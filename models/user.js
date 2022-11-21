const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        maxLength: 50,
        trim: true,
    },
    lastName: {
        type: String,
        maxLength: 50,
        trim: true,
    },
    username: {
        type: String,
        maxLength: 50,
        unique: true,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        set: password => bcrypt.hashSync(password, 12),
    },
    dataSources: [{
        type: Schema.Types.ObjectId,
        ref: 'DataSource',
    }],
    role: {
        type: Number,
        default: 1,
    },
})

userSchema.methods.authenticate = function(password) {
    return bcrypt.compare(password, this.password);
}

module.exports = model('User', userSchema);