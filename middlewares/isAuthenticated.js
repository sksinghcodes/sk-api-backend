const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies["jwt-token"];
  jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decoded) {
    if (err) {
      res.json({
        success: false,
        error: err,
      });
    } else {
      req.userId = decoded.userId;
      next();
    }
  });
};
