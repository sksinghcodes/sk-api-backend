const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    username: {
        type: String,
        maxLength: 50,
        unique: true,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        set: password => bcrypt.hashSync(password, 12),
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
})

userSchema.methods.authenticate = function(password) {
    return bcrypt.compare(password, this.password);
}

const UserModel = model('User', userSchema)

module.exports = UserModel;