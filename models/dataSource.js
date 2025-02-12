const { Schema, model } = require("mongoose");

const dataSourceSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
    },
    headings: {
      type: [String],
      required: true,
    },
    key: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const DataSourceModel = model("DataSource", dataSourceSchema);
module.exports = DataSourceModel;
