const express = require('express');
const Zone = require('../controllers/zoneController');
const { auth, isAdmin, isOperator } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// ROUTES ACCESSIBLES PAR TOUS (Admin + Opérateur)
// =====================================================

// GET - Récupérer toutes les zones
// Admin et Opérateur peuvent voir les zones
router.get('/', auth, isOperator, Zone.getZones);

// GET - Récupérer une zone par ID (optionnel)
router.get('/:id', auth, isOperator, Zone.getZoneById);

// =====================================================
// ROUTES ADMIN SEULEMENT (Création, modification, suppression)
// =====================================================

// POST - Créer une zone (Admin seulement)
router.post('/', auth, isAdmin, Zone.createZone);

// PUT - Modifier une zone (Admin seulement)
router.put('/:id', auth, isAdmin, Zone.updateZone);

// DELETE - Supprimer une zone (Admin seulement)
router.delete('/:id', auth, isAdmin, Zone.deleteZone);


module.exports = router;

