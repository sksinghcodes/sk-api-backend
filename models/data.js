const { Schema, model } = require("mongoose");

const dataSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    dataSourceId: {
      type: String,
      required: true,
    },
  },
  { strict: false, timestamps: true }
);

const DataModel = model("Data", dataSchema);
module.exports = DataModel;
