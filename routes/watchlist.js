const router = require("express").Router();
const {getWatchlist, addToWatchList} = require("../controllers/watchlist-controller");
const {authenticateToken} = require("../middleware/authenticate-token");

router.get("/get-watchlist", authenticateToken, getWatchlist);
router.post("/add-to-watchlist", authenticateToken, addToWatchList);

module.exports = router;
