const router = require("express").Router();
const {
  create,
  getOne,
  getByDate,
  getAll,
  removeTask,
} = require("../controllers/task");

router.post("/create", create);
router.get("/get-one", getOne);
router.get("/get-all", getAll);
router.get("/get-by-date", getByDate);
router.delete("/delete", removeTask);

module.exports = router;
