const { RECURRENCE, INVALID_DATE_STRATEGY } = require("../constants");
const Task = require("../models/task");
const TaskRecord = require("../models/taskRecord");
const { getDateDetails, validateDate } = require("../utils/utils");
const { getTaskRecords } = require("./taskRecord");

exports.create = async (req, res) => {
  try {
    const taskData = ({
      name,
      description,
      schedule,
      scheduleStartTime,
      scheduleEndTime,
      category,
      categoryWeightTrainingTargetReps,
      categoryWeightTrainingTargetSets,
      recurrence,
      recurrenceValues,
      recurrenceInvalidDateStrategy,
      autoRemove,
      autoRemoveDate,
    } = req.body);

    taskData.userId = req.userId;

    const task = new Task(taskData);

    await task.save();
    res.json({
      success: true,
      message: "New task created",
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
    }).select(["-userId", "-__v"]);
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
      taskRecord = await TaskRecord.findOne({ taskId, taskDate: date }).select([
        "-userId",
        "-__v",
      ]);
    }

    const task = await Task.findOne({ _id: taskId }).select([
      "-userId",
      "-__v",
    ]);

    if (!task) {
      throw new Error("Task not found");
    }

    const taskObj = task.toObject();

    if (recordDate) {
      taskObj.taskRecord = taskRecord;
    }

    res.json({
      success: true,
      task: taskObj,
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

    const options = [
      {
        userId,
        recurrence: RECURRENCE.DAILY,
      },
      {
        userId,
        recurrence: RECURRENCE.WEEKLY,
        recurrenceValues: dayOfWeek,
      },
      {
        userId,
        recurrence: RECURRENCE.MONTHLY,
        recurrenceValues: monthlyDate,
      },
      {
        userId,
        recurrence: RECURRENCE.YEARLY,
        recurrenceValues: yearlyDate,
      },
    ];

    getMonthlyTasksFrom.forEach((md) => {
      options.push({
        userId,
        recurrence: RECURRENCE.MONTHLY,
        recurrenceValues: md,
        recurrenceInvalidDateStrategy: INVALID_DATE_STRATEGY.SHIFT,
      });
    });

    getYearlyTasksFrom.forEach((yd) => {
      options.push({
        userId,
        recurrence: RECURRENCE.YEARLY,
        recurrenceValues: yd,
        recurrenceInvalidDateStrategy: INVALID_DATE_STRATEGY.SHIFT,
      });
    });

    options.forEach((option) => {
      option.$and = [
        { createdAt: { $lt: nextDate } },
        {
          $or: [
            { autoRemoveDate: null },
            { autoRemoveDate: { $gte: dateEpoch } },
          ],
        },
      ];
    });

    const tasks = await Task.find({ $or: options, deleted: false }).select([
      "-userId",
      "-__v",
    ]);
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

    tasks.forEach((t) => {
      t.taskRecord = taskRecordsMap[t._id.toString()] || null;
    });

    const tasksCopy = tasks.map((t) => {
      return {
        ...t.toObject(),
        taskRecord: taskRecordsMap[t._id.toString()] || null,
      };
    });

    res.json({
      success: true,
      tasks: tasksCopy,
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
