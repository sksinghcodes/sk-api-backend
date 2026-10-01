import { Schema, model } from 'mongoose';

const dataSchema = new Schema(
  {
    userId: {
      type: String,
      required: true
    },
    dataSourceId: {
      type: String,
      required: true
    }
  },
  { strict: false, timestamps: true }
);

const DataModel = model('Data', dataSchema);
export default DataModel;
