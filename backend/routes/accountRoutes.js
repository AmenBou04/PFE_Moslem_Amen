const express = require('express');
const accountController = require('../controllers/accountController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, accountController.getMyProfile);
router.put('/me', auth, accountController.modifyAccount);
router.put('/me/password', auth, accountController.modifyPassword);
router.delete('/me', auth, accountController.deleteAccount);

module.exports = router;
