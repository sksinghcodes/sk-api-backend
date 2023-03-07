const DataSource = require('../models/dataSource');
const Data = require('../models/data');
const jwt = require('jsonwebtoken');
const sendMail = require('../email/sendMail');
const User = require('../models/user');


exports.create = (req, res) => {
    try {
        const decoded = jwt.verify(req.body.key, process.env.JWT_SECRET_KEY);
        const dataSource = JSON.parse(decoded.dataSource);
        DataSource.findOne({_id: dataSource._id})
            .then(resDataSource => {
                return !!resDataSource
                        &&
                        resDataSource.headings.sort().toString() === Object.keys(req.body.data).sort().toString()
                        &&
                        resDataSource.source.startsWith(req.headers.origin);
            })
            .then(result => {
                if(result){
                    const data = new Data(req.body.data);
                    data.userId = dataSource.userId;
                    data.dataSourceId = dataSource._id;
                    return data.save();
                } else {
                    res.json({
                        success: false,
                        error: "Data-source did not match",
                    });
                    return result;
                }
            }).then(async result => {
                const user = await User.findById(result.userId)
                if(result) {
                    const tableStyle = "border-collapse: collapse;";
                    const cellStyle = "border: 1px solid #000;padding: 5px 10px;text-align: left;";
                    let html = `
                    <table class="table" style="${tableStyle}"><thead><tr>`;
                    dataSource.headings.forEach(heading => {
                        html+=`<th style="${cellStyle}">${heading}</th>`;
                    })
                    html+='</tr></thead><tbody><tr>';
                    dataSource.headings.forEach(heading => {
                        html+=`<td style="${cellStyle}">${result[heading]}</td>`;
                    })
                    html+=`</tr></tbody></table>`;

                    const info = await sendMail({
                        receivers: [user.email],
                        subject: 'Someone just Submitted your Form',
                        html: html,
                    })
                
                    if(info.accepted.length){
                        res.json({
                            success: true,
                            message: 'Your message was delivered'
                        });
                    } else {
                        res.json({
                            success: false,
                            message: 'Something went wrong'
                        });
                    }
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
    Data.find({userId: req.userId, dataSourceId: req.params.dataSourceId})
        .select(['-userId', '-dataSourceId', '-updatedAt', '-__v'])
        .then(async datas => {
            const dataSource = await DataSource.findOne({
                userId: req.userId, _id: req.params.dataSourceId
            }).select('headings');
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
    Data.findOneAndDelete({userId: req.userId, _id: req.params.id})
        .then(async result => {
            if(result){
                const datas = await Data.find({userId: req.userId, dataSourceId: result.dataSourceId})
                .select(['-author', '-dataSource', '-__v'])
                const dataSource = await DataSource.findOne({userId: req.userId, _id: result.dataSourceId}).select('headings')
                res.json({
                    success: true,
                    message: 'One data deleted',
                    headings: dataSource.headings,
                    datas: datas,
                })
            } else {
                res.json({
                    success: false,
                    error: 'Data deletion failed',
                })
            }
        })
        .catch(err => {
            console.log(err)
            res.json({
                success: false,
                error: err,
            })
        })
}