const router = require('express').Router();
const {body} = require('express-validator');
const {login, register} = require('../controllers/user-controller');

router.post('/login', [
    body('email', "Valid email is required")
        .notEmpty()
        .trim().isEmail(),
    body('password', "Password is required")
        .notEmpty()
        .trim(),
], login);

router.post('/register', [
    body('firstName', "First name is required")
        .notEmpty()
        .trim(),
    body('lastName', "Last name is required")
        .notEmpty()
        .trim(),
    body('email', "Valid email is required")
        .notEmpty()
        .trim().isEmail(),
    body('password', "Password is required")
        .notEmpty()
        .trim(),
], register);

module.exports = router;