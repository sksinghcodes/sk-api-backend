const DataSource = require('../models/dataSource');
const jwt = require('jsonwebtoken');

exports.create = (req, res) => {
    const dataSource = new DataSource(req.body)
    dataSource.author = req.userId;
    const key = jwt.sign({dataSource:JSON.stringify(dataSource)}, process.env.JWT_SECRET_KEY);
    dataSource.key = key;
    
    dataSource.save()
        .then(response => {
            res.json({
                success: true,
                message: `New data-source "${response.source}" added`,
            })
        })
        .catch(err => {
            res.json({
                success: false,
                message: `Something went wrong`,
            })
        })
}

exports.getOne = (req, res) => {
    DataSource.findOne({id:req.params.id, author: req.userId})
        .then(dataSource => {
            res.json({
                success: true,
                dataSource: dataSource,
            })
        }).catch(err => {
            res.json({
                success: false,
                message: `Not Found`,
            })
        })
}

exports.getAll = (req, res) => {
    DataSource.find({author: req.userId})
        .then(dataSources => {
            res.json({
                success: true,
                dataSources: dataSources
            })
        })
        .catch(err => {
            console.log(err)
            res.json({
                success: false,
                error: err
            })
        })
}

exports.update = (req, res) => {
    // ...
    res.send('dd')
}

exports.remove = (req, res) => {
    // ...
    res.send('dd')
}