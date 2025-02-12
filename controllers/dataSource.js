const DataSource = require("../models/dataSource");
const Data = require("../models/data");
const jwt = require("jsonwebtoken");

exports.create = (req, res) => {
  const dataSource = new DataSource(req.body);
  dataSource.userId = req.userId;
  const key = jwt.sign(
    { dataSource: JSON.stringify(dataSource) },
    process.env.JWT_SECRET_KEY
  );
  dataSource.key = key;

  dataSource
    .save()
    .then(() => {
      return DataSource.find({ userId: req.userId }).select([
        "-userId",
        "-updatedAt",
        "-__v",
      ]);
    })
    .then((dataSources) => {
      res.json({
        success: true,
        message: "New data-source added",
        dataSources: dataSources,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: err,
      });
    });
};

exports.getAll = (req, res) => {
  DataSource.find({ userId: req.userId })
    .select(["-userId", "-updatedAt", "-__v"])
    .then((dataSources) => {
      res.json({
        success: true,
        dataSources: dataSources,
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({
        success: false,
        error: err,
      });
    });
};

exports.remove = (req, res) => {
  Promise.all([
    DataSource.findOneAndDelete({ userId: req.userId, _id: req.params.id }),
    Data.deleteMany({ userId: req.userId, dataSourceId: req.params.id }),
  ])
    .then(async (result) => {
      const dataSources = await DataSource.find({ userId: req.userId }).select([
        "-userId",
        "-updatedAt",
        "-__v",
      ]);

      if ((result[0], result[1].acknowledged)) {
        res.json({
          success: true,
          message: "Datasource deleted successfully",
          dataSources: dataSources,
        });
      } else {
        res.json({
          success: false,
          error: "Something went wrong",
        });
      }
    })
    .catch((error) => {
      res.json({
        success: false,
        error: error,
      });
    });
};
