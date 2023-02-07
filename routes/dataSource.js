const router = require('express').Router();
const { 
    create,
    getOne,
    getAll,
    update,
    remove,
} = require('../controllers/dataSource');

router.post('/', create);
router.get('/get-one/:id', getOne);
router.get('/get-all', getAll); 
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;