import mongoose from 'mongoose';

export const connectToDB = async function () {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log('Database connection successful');
  } catch (e) {
    console.log(e);
    console.log('Database connection failed');
    throw e;
  }
};

export const checkDBConnection = function (req, res, next) {
  if (mongoose.connection._readyState === 1) {
    next();
  } else {
    res.json({
      success: false,
      error: {
        message: 'Database connection issue'
      }
    });
  }
};
