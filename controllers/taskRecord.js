const { RECURRENCE, INVALID_DATE_STRATEGY, CATEGORY } = require("../constants");
const TaskRecord = require("../models/taskRecord");
const Task = require("../models/task");
const { getDateDetails, validateDate } = require("../utils/utils");

exports.create = async (req, res) => {
  try {
    const { taskId, taskDate } = req.query;
    const userId = req.userId;
    const errorArr = [];

    if (!taskId) errorArr.push("Missing 'taskId'");
    if (!taskDate) errorArr.push("Missing 'taskDate'");
    if (!userId) errorArr.push("Missing 'userId'");

    if (errorArr.length) {
      return res.json({ success: false, error: errorArr.join(". ") });
    }

    const dateValidity = validateDate(taskDate);
    if (!dateValidity.isValid) {
      return res.json({ success: false, error: dateValidity.message });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.json({ success: false, error: "Invalid taskId" });
    }

    if (task.userId.toString() !== userId.toString()) {
      return res.json({ success: false, error: "Unauthorized action" });
    }

    const { calisthenicsReps, cardioSeconds, weightTrainingSets, score } =
      req.body;

    const taskRecordData = {
      calisthenicsReps,
      cardioSeconds,
      weightTrainingSets,
      score,
      userId,
      taskId,
      category: task.category,
      taskDate: dateValidity.date,
    };

    const exists = await TaskRecord.exists({
      taskId,
      userId,
      taskDate: dateValidity.date,
    });

    if (exists) {
      return res.json({
        success: false,
        error: "Record for this task on this date already exists",
      });
    }

    const taskRecordDocument = await new TaskRecord(taskRecordData).save();

    await Task.updateOne(
      { _id: taskId, allowEdit: true },
      { $set: { allowEdit: false } }
    );

    const taskRecord = taskRecordDocument.toObject();
    delete taskRecord.userId;
    delete taskRecord.__v;

    return res.json({
      success: true,
      message: "Task completion recorded",
      taskRecord: taskRecord,
    });
  } catch (e) {
    console.error(e);
    return res.json({ success: false, error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const recordId = req.query.recordId;

    if (!recordId) {
      return res.json({ success: false, error: "Missing 'recordId'" });
    }

    const { calisthenicsReps, cardioSeconds, weightTrainingSets, score } =
      req.body;

    const taskRecordData = {};
    if (calisthenicsReps !== undefined)
      taskRecordData.calisthenicsReps = calisthenicsReps;
    if (cardioSeconds !== undefined)
      taskRecordData.cardioSeconds = cardioSeconds;
    if (weightTrainingSets !== undefined)
      taskRecordData.weightTrainingSets = weightTrainingSets;
    if (score !== undefined) taskRecordData.score = score;

    if (Object.keys(taskRecordData).length === 0) {
      return res.json({ success: false, error: "No fields to update" });
    }

    const updated = await TaskRecord.findOneAndUpdate(
      { _id: recordId, userId: req.userId },
      { $set: taskRecordData },
      { new: true }
    )
      .lean()
      .select(["-userId", "-__v"]);

    if (!updated) {
      return res.json({
        success: false,
        error: "Record not found or unauthorized",
      });
    }

    return res.json({
      success: true,
      message: "Record updated",
      taskRecord: updated,
    });
  } catch (e) {
    console.error(e);
    return res.json({ success: false, error: e.message });
  }
};

exports.getTaskRecords = ({ taskId, userId, fromDate, toDate }) => {
  const nextDate = new Date(toDate);
  nextDate.setDate(nextDate.getDate() + 1);
  return TaskRecord.find({
    taskId,
    userId,
    taskDate: { $gte: fromDate, $lt: nextDate },
  }).select(["-userId", "-__v"]);
};

exports.getByDate = async (req, res) => {
  try {
    const { taskId, fromDate, toDate } = req.query;
    const userId = req.userId;
    const errorArr = [];

    if (!taskId) errorArr.push("Missing 'taskId'");
    if (!fromDate) errorArr.push("Missing 'fromDate'");
    if (!toDate) errorArr.push("Missing 'toDate'");
    if (!userId) errorArr.push("Missing 'userId'");

    if (errorArr.length) {
      return res.json({ success: false, error: errorArr.join(". ") });
    }

    const fromDateValidation = validateDate(fromDate);
    const toDateValidation = validateDate(toDate);

    if (!fromDateValidation.isValid)
      errorArr.push(`'fromDate' has ${fromDateValidation.message}`);
    if (!toDateValidation.isValid)
      errorArr.push(`'toDate' has ${toDateValidation.message}`);
    if (fromDateValidation.date > toDateValidation.date)
      errorArr.push("'fromDate' cannot be after 'toDate'");

    if (errorArr.length) {
      return res.json({ success: false, error: errorArr.join(". ") });
    }

    const nextDate = new Date(toDateValidation.date);
    nextDate.setDate(nextDate.getDate() + 1);

    const taskRecords = await this.getTaskRecords({
      taskId,
      userId,
      fromDate: fromDateValidation.date,
      toDate: toDateValidation.date,
    });

    res.json({ success: true, taskRecords });
  } catch (e) {
    console.error(e);
    res.json({ success: false, error: e.message });
  }
};
