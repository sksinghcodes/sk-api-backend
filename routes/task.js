const router = require("express").Router();
const { create, getOne, getByDate, getAll } = require("../controllers/task");

router.post("/create", create);
router.get("/get-one", getOne);
router.get("/get-all", getAll);
router.get("/get-by-date/", getByDate);

module.exports = router;
