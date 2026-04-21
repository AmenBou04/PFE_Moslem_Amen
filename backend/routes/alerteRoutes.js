const express = require('express');
const Alerte = require('../controllers/alerteController');
const {auth,isAdmin,isOperator,isAuthenticated,authAI} = require('../middleware/auth');


const router = express.Router();

// POST - Créer une alerte depuis le service IA (clé API)
router.post('/ai', authAI, Alerte.createAlerteFromAI);

// GET /api/alertes - Récupérer les alertes
// GET - Lister toutes les alertes
router.get('/', auth, isOperator, Alerte.getAlertes);

// GET - Voir une alerte spécifique
router.get('/:id', auth, isOperator, Alerte.getAlerteById);

// GET - Alertes par zone
router.get('/zone/:zoneId', auth, isOperator, Alerte.getAlertesByZone);

// GET - Alertes par caméra
router.get('/camera/:cameraId', auth, isOperator, Alerte.getAlertesByCamera);

// GET - Alertes par statut
router.get('/statut/:statut', auth, isOperator, Alerte.getAlertesByStatut);

// GET - Alertes par gravité
router.get('/gravite/:gravite', auth, isOperator, Alerte.getAlertesByGravite);

// GET - Alertes non traitées
router.get('/non-traitees', auth, isOperator, Alerte.getAlertesNonTraitees);

// GET - Alertes acquittées
router.get('/acquittees', auth, isOperator, Alerte.getAlertesAcquittees);

// GET - Alerte la plus récente
router.get('/recente', auth, isOperator, Alerte.getAlerteRecente);

// GET - Alerte récente par zone
router.get('/recente/zone/:zoneId', auth, isOperator, Alerte.getAlerteRecenteByZone);

// GET - Alerte récente par caméra
router.get('/recente/camera/:cameraId', auth, isOperator, Alerte.getAlerteRecenteByCamera);

// POST - Créer une alerte
router.post('/', Alerte.createAlerte);

router.patch('/:id/acquitter', auth, isOperator, Alerte.acquitterAlerte);
router.patch('/:id/escalader', auth, isOperator, Alerte.escaladerAlerte);
router.delete('/:id', auth, isAdmin, Alerte.deleteAlerte);
router.delete('/', auth, isAdmin, Alerte.deleteAllAlertes);

// POST /api/alertes - Créer une alerte


module.exports = router;

