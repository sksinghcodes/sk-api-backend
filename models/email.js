const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const emailSchema = new Schema({
    value: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        set: verificationCode => bcrypt.hashSync(verificationCode, 12),
    },
    verificationCodeExpirationDate: {
        type: Date,
        default: new Date(Date.now() + (1000 * 60 * 10)),
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
});

module.exports = model('Email', emailSchema);