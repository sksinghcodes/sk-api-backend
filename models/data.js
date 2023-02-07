const { Schema, model } = require('mongoose');

const dataSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dataSource: {
        type: Schema.Types.ObjectId,
        ref: 'DataSource',
        required: true,
    }
}, { strict: false });

module.exports = model('Data', dataSchema);