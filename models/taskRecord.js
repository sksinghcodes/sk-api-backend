const { Schema, model } = require("mongoose");
const { CATEGORY_ENUM } = require("../constants");

const weightTrainingSetSchema = new Schema(
  {
    weightInGrams: {
      type: Number,
      required: true,
    },
    reps: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const taskRecordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORY_ENUM,
      required: true,
    },
    calisthenicsReps: {
      type: Number,
      default: null,
    },
    cardioSeconds: {
      type: Number,
      default: null,
    },
    weightTrainingSets: {
      type: [weightTrainingSetSchema],
      default: null,
      set: (v) => (Array.isArray(v) && v.length === 0 ? null : v),
    },
    score: {
      type: Number,
      required: true,
    },
    taskDate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("TaskRecord", taskRecordSchema);
