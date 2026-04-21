const express = require('express');
const { login } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);

module.exports = router;
