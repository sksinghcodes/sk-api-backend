const DataSource = require('../models/dataSource');
const Data = require('../models/data');
const jwt = require('jsonwebtoken');


exports.create = (req, res) => {
    try {
        const decoded = jwt.verify(req.body.key, process.env.JWT_SECRET_KEY);
        const dataSource = JSON.parse(decoded.dataSource);
        DataSource.findOne({_id: dataSource._id})
            .then(resDataSource => {
                return resDataSource.headings.sort().toString() === Object.keys(req.body.data).sort().toString()
                        &&
                        resDataSource.source.startsWith(req.headers.origin);
            })
            .then(result => {
                if(result){
                    const data = new Data(req.body.data);
                    data.author = dataSource.author;
                    data.dataSource = dataSource._id;
                    return data.save();
                } else {
                    res.json({
                        success: false,
                        error: "Data-source did not match",
                    });
                    return result;
                }
            }).then(result => {
                if(result) {
                    res.json({message: 'hello'});
                }
            })
    } catch(err) {
        res.json({
            success: false,
            error: err
        })
    }
}

exports.getAll = (req, res) => {
    Data.find({author: req.userId, dataSource: req.params.dataSourceId})
        .select(['-author', '-dataSource', '-__v'])
        .then(async datas => {
            const dataSource = await DataSource.findOne({id: req.params.dataSourceId}).select('headings')
            return [
                dataSource.headings,
                datas
            ]
        })
        .then(([headings, datas]) => {
            res.json({
                success: true,
                headings: headings,
                datas: datas,
            })
        })
        .catch(err => {
            res.json({
                success: false,
                error: err,
            })
        })   
}

exports.remove = (req, res) => {
    console.log('erf')
    Data.findOneAndDelete({_id: req.params.id})
        .then(result => {
            return Data.find({author: req.userId, dataSource: result.dataSource._id})
                .select(['-author', '-dataSource', '-__v'])
        })
        .then(async datas => {
            const dataSource = await DataSource.findOne({id: req.params.dataSourceId}).select('headings')
            return [
                dataSource.headings,
                datas
            ]
        })
        .then(([headings, datas]) => {
            res.json({
                success: true,
                message: 'One data deleted',
                headings: headings,
                datas: datas,
            })
        })
        .catch(err => {
            res.json({
                success: false,
                error: err,
                message: 'Deletion failed'
            })
        })
}