const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { getSystemLogs } = require('../controllers/systemLogController');

router.get('/', auth, isAdmin, getSystemLogs);

module.exports = router;