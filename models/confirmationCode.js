const { Schema, model } = require('mongoose');

const Purpose = {
    PROFILE_VERIFICATION: 0,
    PASSWORD_RESET: 1,
}

const nextTenMinutes = () => {
    return new Date(Date.now() + (1000 * 60 * 10))
}

const confirmationCodeSchema = new Schema({
    code: {
        type: String,
        default: String(Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)),
        required: true,
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    purpose: {
        type: Number,
        enum: [Purpose.PROFILE_VERIFICATION, Purpose.PASSWORD_RESET],
        required: true,
    },
    userId: {
        type: String,
        required: true,
    }
});

const ConfirmationCodeModel = model('ConfirmationCode', confirmationCodeSchema);
ConfirmationCodeModel.Purpose = Purpose;
ConfirmationCodeModel.nextTenMinutes = nextTenMinutes;
module.exports = ConfirmationCodeModel;