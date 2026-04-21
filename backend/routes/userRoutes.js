
const express = require('express');
const router = express.Router();
const User = require('../controllers/userController');
const {auth,isAdmin,isOperator}= require('../middleware/auth');


router.delete('/all', auth,isAdmin,User.deleteAllUsers);
router.get('/', auth,isAdmin,User.getUsers);
router.post('/admins', auth,isAdmin,User.addAdmin);
router.put('/admins/:id', auth,isAdmin,User.updateAdmin);
router.delete('/admins/:id', auth,isAdmin,User.deleteAdmin);
router.post('/operateurs', auth,isAdmin, User.addOperateur);
router.get('/operateurs', auth,isAdmin, User.getOperateurs);
router.get('/operateurs/:id', auth,isAdmin, User.getOperateurById);
router.put('/operateurs/:id', auth,isAdmin, User.updateOperateur);
router.delete('/operateurs/:id', auth,isAdmin, User.deleteOperateur);

module.exports = router;