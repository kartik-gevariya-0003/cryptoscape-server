const router = require('express').Router();
const {checkHealth} = require('../controllers/health-check-controller');

router.get('/', checkHealth);

module.exports = router;