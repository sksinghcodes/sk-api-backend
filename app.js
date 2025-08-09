require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 4000;
const userRoutes = require("./routes/user");
const dataSourceRoutes = require("./routes/dataSource");
const dataRoutes = require("./routes/data");
const addDataRoute = require("./routes/addData");
const taskRoutes = require("./routes/task");
const taskRecordRoutes = require("./routes/taskRecord");
const { connectToDB, checkDBConnection } = require("./db");
const checkClient = require("./middlewares/checkClient");
const isAuthenticated = require("./middlewares/isAuthenticated");

connectToDB();

app.use(express.json());
app.use(cookieParser());
app.use(checkDBConnection);

app.use("/api/user/", checkClient, userRoutes);
app.use("/api/data-source/", checkClient, isAuthenticated, dataSourceRoutes);
app.use("/api/data/", checkClient, isAuthenticated, dataRoutes);
app.use("/api/add-data/", cors(), addDataRoute);
app.use("/api/task/", checkClient, isAuthenticated, taskRoutes);
app.use("/api/task-record/", checkClient, isAuthenticated, taskRecordRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port: " + PORT);
});
