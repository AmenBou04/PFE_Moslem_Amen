const express = require('express');
const aiServerController = require('../controllers/aiServerController');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/status', auth, isAdmin, aiServerController.getAiServerStatus);
router.get('/frame', auth, isAdmin, aiServerController.getAiServerFrame);
router.post('/start', auth, isAdmin, aiServerController.startAiServer);
router.post('/stop', auth, isAdmin, aiServerController.stopAiServer);

module.exports = router;
