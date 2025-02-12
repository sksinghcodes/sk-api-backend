const router = require("express").Router();
const { create, getAll, remove } = require("../controllers/dataSource");

router.post("/", create);
router.get("/get-all", getAll);
router.delete("/:id", remove);

module.exports = router;
