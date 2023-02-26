const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.MAIN_EMAIL_SERVICE,
    auth: {
        user: process.env.MAIN_EMAIL_ADDRESS,
        pass: process.env.MAIN_EMAIL_PASSWORD, 
    }
});

module.exports = function(options){
    const receivers = options.receivers.join(', ');
    return transporter.sendMail({
        from: `"SK Web API" <${process.env.MAIN_EMAIL_ADDRESS}>`, // sender address
        to: receivers, // list of receivers
        subject: options.subject.trim() + " | SK Web API", // Subject line
        text: options.text, // plain text body
        html: options.html, // html body
    })
}