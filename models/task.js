const { Schema, model } = require("mongoose");
const {
  RECURRENCE_ENUM,
  INVALID_DATE_STRATEGY_ENUM,
  autoRemove_ENUM,
  CATEGORY_ENUM,
  SCHEDULE_ENUM,
} = require("../constants");

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, minlength: 1, maxlength: 100 },
    description: {
      type: String,
      default: null,
      set: (v) => (v === "" ? null : v),
      maxlength: 500,
    },

    category: {
      type: String,
      enum: CATEGORY_ENUM,
      required: true,
    },

    recurrence: {
      type: String,
      enum: RECURRENCE_ENUM,
      required: true,
    },
    recurrenceValues: {
      type: [Number],
      default: null,
      set: (v) => (Array.isArray(v) && v.length === 0 ? null : v),
    },
    recurrenceInvalidDateStrategy: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          return v === null || INVALID_DATE_STRATEGY_ENUM.includes(v);
        },
        message: (props) =>
          `${props.value} is not a valid recurrenceInvalidDateStrategy`,
      },
    },

    schedule: {
      type: String,
      enum: SCHEDULE_ENUM,
      required: true,
    },
    scheduleStartTime: { type: Number, default: null },
    scheduleEndTime: { type: Number, default: null },

    autoRemove: {
      type: String,
      enum: autoRemove_ENUM,
      required: true,
    },
    autoRemoveDate: { type: Number, default: null },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Task", taskSchema);
