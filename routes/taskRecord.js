const router = require("express").Router();
const { create, getByDate, update } = require("../controllers/taskRecord");

router.post("/create", create);
router.put("/update", update);
router.get("/by-date", getByDate);

module.exports = router;
