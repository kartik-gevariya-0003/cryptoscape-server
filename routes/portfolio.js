const router = require('express').Router();
const {getUserPortfolio} = require('../controllers/portfolio-controller');
const {authenticateToken} = require("../middleware/authenticate-token");

router.get('/get-portfolio', authenticateToken, getUserPortfolio);

module.exports = router;