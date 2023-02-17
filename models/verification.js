const { Schema, model } = require('mongoose');

const verificationSchema = new Schema({
    code: {
        type: String,
        default: String(Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)),
        required: true,
    },
    expirationDate: {
        type: Date,
        default: new Date(Date.now),
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
    }
});

module.exports = model('Verification', verificationSchema);