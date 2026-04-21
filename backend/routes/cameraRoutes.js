const express = require('express');
const Camera = require('../controllers/cameraController');
const { auth, isAdmin, isOperator } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// ROUTES ACCESSIBLES PAR TOUS (Admin + Opérateur)
// =====================================================

// GET - Lister toutes les caméras
router.get('/', auth, isOperator, Camera.getCameras);

// GET - Voir une caméra spécifique
router.get('/:id', auth, isOperator, Camera.getCameraById);

// PATCH - Mettre à jour le statut d'une caméra (ONLINE/OFFLINE/ERROR)
// Les opérateurs peuvent mettre à jour le statut
router.patch('/:id/statut', auth, isOperator, Camera.updateCameraStatut);

// =====================================================
// ROUTES ADMIN SEULEMENT (Création et modification)
// =====================================================

// POST - Créer une caméra (Admin seulement)
router.post('/', auth, isAdmin, Camera.createCamera);

// PUT - Modifier complètement une caméra (Admin seulement)
router.put('/:id', auth, isAdmin, Camera.updateCamera);

// DELETE - Supprimer une caméra (Admin seulement - optionnel)
router.delete('/:id', auth, isAdmin, Camera.deleteCamera);
    
module.exports = router;