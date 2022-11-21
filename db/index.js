const mongoose = require('mongoose');

exports.connectToDB = async function(){
    return await mongoose.connect(process.env.DB_CONNECTION_STRING)
        .then(() => {
            console.log("Database connection successfull");
        })
        .catch(() => {
            console.log("Database connection failed");
        });
}

exports.checkDBConnection = function(req, res, next){
    if(mongoose.connection._readyState === 1){
        next();
    } else {
        res.json({
            success: false,
            error: {
                message: "Database connection issue",
            }
        });
    }
}