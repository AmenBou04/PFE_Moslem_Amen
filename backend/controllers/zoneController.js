const Zone = require('../models/Zone');
const Camera = require('../models/Camera');

// @desc    Récupérer toutes les zones
// @route   GET /api/zones
// @access  Private
const getZones = async (req, res) => {
    try {
        const zones = await Zone.find().sort({ createdAt: -1 });
        res.json(zones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer une zone par ID
// @route   GET /api/zones/:id
// @access  Private
const getZoneById = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone non trouvée' });
        }
        res.json(zone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Créer une zone
// @route   POST /api/zones
// @access  Admin
const createZone = async (req, res) => {
    try {
        const zone = await Zone.create(req.body);
        res.status(201).json(zone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Modifier une zone
// @route   PUT /api/zones/:id
// @access  Admin
const updateZone = async (req, res) => {
    try {
        const zone = await Zone.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!zone) {
            return res.status(404).json({ message: 'Zone non trouvée' });
        }
        res.json(zone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Supprimer une zone
// @route   DELETE /api/zones/:id
// @access  Admin
const deleteZone = async (req, res) => {
    try {
        const linkedCameras = await Camera.countDocuments({ zone_id: req.params.id });
        if (linkedCameras > 0) {
            return res.status(409).json({
                message: `Suppression impossible: ${linkedCameras} camera(s) liee(s) a cette zone.`
            });
        }

        const zone = await Zone.findByIdAndDelete(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone non trouvée' });
        }
        res.json({ message: 'Zone supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getZones,
    getZoneById,
    createZone,
    updateZone,
    deleteZone
};