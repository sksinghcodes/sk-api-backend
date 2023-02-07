const router = require('express').Router();

const { create } = require('../controllers/data');

router.post('/', create);

module.exports = router;