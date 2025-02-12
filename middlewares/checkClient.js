const cors = require("cors");

module.exports = cors({
  credentials: true,
  origin: process.env.ALLOWED_CLIENT.split(" "),
});
