const { RECURRENCE, INVALID_DATE_STRATEGY } = require("../constants");
const Task = require("../models/task");
const TaskRecord = require("../models/taskRecord");
const { getDateDetails, validateDate } = require("../utils/utils");
const { getTaskRecords } = require("./taskRecord");

exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      schedule,
      scheduleStartTime,
      scheduleEndTime,
      category,
      recurrence,
      recurrenceValues,
      recurrenceInvalidDateStrategy,
      autoRemove,
      autoRemoveDate,
    } = req.body;

    const taskData = {
      name,
      description,
      schedule,
      scheduleStartTime,
      scheduleEndTime,
      category,
      recurrence,
      recurrenceValues,
      recurrenceInvalidDateStrategy,
      autoRemove,
      autoRemoveDate,
    };

    taskData.userId = req.userId;
    const taskDoc = await new Task(taskData).save();
    const task = taskDoc.toObject();

    delete task.__v;
    delete task.userId;

    res.json({
      success: true,
      message: "New task created",
      task: task,
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: e.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const taskId = req.query.taskId;

    if (!taskId) {
      return res.json({
        success: false,
        error: "Missing 'taskId'",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      userId: req.userId,
    }).lean();

    if (!task) {
      return res.json({ success: false, error: "Task not found" });
    }

    const {
      name,
      description,
      schedule,
      scheduleStartTime,
      scheduleEndTime,
      category,
      recurrence,
      recurrenceValues,
      recurrenceInvalidDateStrategy,
      autoRemove,
      autoRemoveDate,
    } = req.body;

    const existingRecPrimitive = Array.isArray(task.recurrenceValues)
      ? task.recurrenceValues.sort().toString()
      : null;
    const recPrimitive = Array.isArray(recurrenceValues)
      ? recurrenceValues.sort().toString()
      : null;

    if (
      !task.allowEdit &&
      ((category !== undefined && category !== task.category) ||
        (recurrence !== undefined && recurrence !== task.recurrence) ||
        (recurrenceValues !== undefined &&
          recPrimitive !== existingRecPrimitive) ||
        (recurrenceInvalidDateStrategy !== undefined &&
          recurrenceInvalidDateStrategy !== task.recurrenceInvalidDateStrategy))
    ) {
      return res.json({
        success: false,
        message:
          "Not allowed to change fields 'category', 'recurrence', 'recurrenceValues' and 'recurrenceInvalidDateStrategy' after the task has a record",
      });
    }

    const taskData = {
      name,
      description,
      schedule,
      scheduleStartTime,
      scheduleEndTime,
      category,
      recurrence,
      recurrenceValues,
      recurrenceInvalidDateStrategy,
      autoRemove,
      autoRemoveDate,
    };

    if (!task.allowEdit) {
      delete taskData.category;
      delete taskData.recurrence;
      delete taskData.recurrenceValues;
      delete taskData.recurrenceInvalidDateStrategy;
    }

    const updated = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.userId },
      taskData,
      {
        new: true,
      }
    ).lean();

    if (!updated) {
      return res.json({
        success: false,
        error: "task update failed",
      });
    }

    delete updated.__v;
    delete updated.userId;

    res.json({
      success: true,
      message: "task updated",
      task: updated,
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: e.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      deleted: false,
    })
      .select(["-userId", "-__v"])
      .lean();
    res.json({
      success: true,
      tasks: tasks,
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: e.message,
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const taskId = req.query.taskId;
    const recordDate = req.query.recordDate;
    let date;
    let taskRecord;

    if (recordDate) {
      const validatedDate = validateDate(recordDate);
      if (!validatedDate.isValid) {
        return res.json({
          success: false,
          error: validatedDate.message,
        });
      } else {
        date = validatedDate.date;
      }
    }

    if (recordDate) {
      taskRecord = await TaskRecord.findOne({ taskId, taskDate: date })
        .lean()
        .select(["-userId", "-__v"]);
    }

    const task = await Task.findOne({ _id: taskId })
      .lean()
      .select(["-userId", "-__v"]);

    if (!task) {
      throw new Error("Task not found");
    }

    if (recordDate) {
      task.taskRecord = taskRecord;
    }

    res.json({
      success: true,
      task: task,
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: e.message,
    });
  }
};

exports.getByDate = async (req, res) => {
  try {
    if (!req.query.date) {
      return res.json({
        success: false,
        error: "Missing 'date'",
      });
    }

    const dateValidation = validateDate(req.query.date);

    if (!dateValidation.isValid) {
      return res.json({
        success: false,
        error: dateValidation.message,
      });
    }

    const date = dateValidation.date;
    const userId = req.userId;
    const dateEpoch = date.getTime();

    const {
      dayOfWeek,
      monthlyDate,
      yearlyDate,
      getMonthlyTasksFrom,
      getYearlyTasksFrom,
      nextDate,
    } = getDateDetails(date);

    const tasks = await Task.find({
      userId,
      deleted: false,
      createdAt: { $lt: nextDate },
      $or: [{ autoRemoveDate: null }, { autoRemoveDate: { $gte: dateEpoch } }],
      $or: [
        { recurrence: RECURRENCE.DAILY },
        {
          recurrence: RECURRENCE.WEEKLY,
          recurrenceValues: {
            $elemMatch: {
              $eq: dayOfWeek,
            },
          },
        },
        {
          recurrence: RECURRENCE.MONTHLY,
          $or: [
            {
              recurrenceValues: {
                $elemMatch: {
                  $eq: monthlyDate,
                },
              },
            },
            {
              recurrenceInvalidDateStrategy: INVALID_DATE_STRATEGY.SHIFT,
              recurrenceValues: {
                $elemMatch: {
                  $in: getMonthlyTasksFrom,
                },
              },
            },
          ],
        },
        {
          recurrence: RECURRENCE.YEARLY,
          $or: [
            {
              recurrenceValues: {
                $elemMatch: {
                  $eq: yearlyDate,
                },
              },
            },
            {
              recurrenceInvalidDateStrategy: INVALID_DATE_STRATEGY.SHIFT,
              recurrenceValues: {
                $elemMatch: {
                  $in: getYearlyTasksFrom,
                },
              },
            },
          ],
        },
      ],
    })
      .lean()
      .select(["-userId", "-__v"]);
    const taskRecordsMap = {};
    const taskIds = tasks.map((t) => t._id.toString());

    if (taskIds.length) {
      const taskRecords = await getTaskRecords({
        taskId: { $in: taskIds },
        userId,
        fromDate: date,
        toDate: date,
      });

      taskRecords.forEach((tr) => {
        taskRecordsMap[tr.taskId.toString()] = tr;
      });
    }

    const tasksWithRecord = tasks.map((t) => {
      return {
        ...t,
        taskRecord: taskRecordsMap[t._id.toString()] || null,
      };
    });

    res.json({
      success: true,
      tasks: tasksWithRecord,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
};

exports.removeTask = async (req, res) => {
  try {
    const taskId = req.query.taskId;

    if (!taskId) {
      return res.json({
        success: false,
        error: "Missing 'taskId'",
      });
    }

    const exists = await TaskRecord.exists({ taskId });

    let deleted;

    if (exists) {
      deleted = await Task.findByIdAndUpdate(taskId, { deleted: true });
    } else {
      deleted = await Task.findByIdAndDelete(taskId);
    }

    if (deleted) {
      res.json({
        success: true,
        message: "deleted successfully",
      });
    } else {
      res.json({
        success: false,
        error: "deletion failed",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
};
