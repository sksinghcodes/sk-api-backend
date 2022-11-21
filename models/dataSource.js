const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

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
    },
})

module.exports = model('DataSource', dataSourceSchema);