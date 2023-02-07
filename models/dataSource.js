const { Schema, model } = require('mongoose');

const dataSourceSchema = new Schema({
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
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
})

module.exports = model('DataSource', dataSourceSchema);