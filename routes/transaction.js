const router = require("express").Router();
const {
  convertCrypto,
  sellCrypto,
  buyCrypto,
  getAllTransactions,
} = require("../controllers/transaction-controller");
const {authenticateToken} = require("../middleware/authenticate-token");

router.get("/get-transactions", authenticateToken, getAllTransactions);

router.post("/convert-crypto", authenticateToken, convertCrypto);

router.post("/sell-crypto", authenticateToken, sellCrypto);

router.post("/buy-crypto", authenticateToken, buyCrypto);

module.exports = router;
