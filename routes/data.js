const router = require('express').Router();
const cors = require('cors');

const { 
    create,
    getAll,
    remove,
} = require('../controllers/data');

router.post('/', cors(), create);
router.get('/get-all/:dataSourceId', getAll);
router.delete('/:id', remove);

module.exports = router;