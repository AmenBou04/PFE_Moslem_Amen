const Camera = require('../models/Camera');

const normalizeCameraPayload = (body = {}) => {
    const payload = {
        nom: body.nom,
        description: body.description || ''
    };

    payload.adresse_ip = body.adresse_ip || body.ipAddress || '';

    if (body.zone_id) {
        payload.zone_id = body.zone_id;
    } else if (body.zoneId) {
        payload.zone_id = body.zoneId;
    }

    if (body.statut) {
        payload.statut = body.statut;
    }

    if (body.resolution) {
        payload.resolution = body.resolution;
    }

    if (typeof body.fps !== 'undefined') {
        payload.fps = body.fps;
    }

    return payload;
};

// @desc    Récupérer toutes les caméras
// @route   GET /api/cameras
// @access  Private
const getCameras = async (req, res) => {
    try {
        const cameras = await Camera.find().populate('zone_id', 'nom');
        res.json(cameras);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer une caméra par ID
// @route   GET /api/cameras/:id
// @access  Private
const getCameraById = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id).populate('zone_id', 'nom');
        if (!camera) {
            return res.status(404).json({ message: 'Caméra non trouvée' });
        }
        res.json(camera);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Créer une caméra
// @route   POST /api/cameras
// @access  Admin
const createCamera = async (req, res) => {
    try {
        const camera = await Camera.create(normalizeCameraPayload(req.body));
        res.status(201).json(camera);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Modifier une caméra
// @route   PUT /api/cameras/:id
// @access  Admin
const updateCamera = async (req, res) => {
    try {
        const camera = await Camera.findByIdAndUpdate(
            req.params.id, 
            normalizeCameraPayload(req.body), 
            { new: true, runValidators: true }
        );
        if (!camera) {
            return res.status(404).json({ message: 'Caméra non trouvée' });
        }
        res.json(camera);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mettre à jour le statut d'une caméra
// @route   PATCH /api/cameras/:id/statut
// @access  Private
const updateCameraStatut = async (req, res) => {
    try {
        const camera = await Camera.findByIdAndUpdate(
            req.params.id, 
            { 
                statut: req.body.statut,
                dernier_heartbeat: new Date()
            },
            { new: true }
        );
        if (!camera) {
            return res.status(404).json({ message: 'Caméra non trouvée' });
        }
        res.json(camera);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Supprimer une caméra
// @route   DELETE /api/cameras/:id
// @access  Admin
const deleteCamera = async (req, res) => {
    try {
        const camera = await Camera.findByIdAndDelete(req.params.id);
        if (!camera) {
            return res.status(404).json({ message: 'Caméra non trouvée' });
        }
        res.json({ message: 'Caméra supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCameras,
    getCameraById,
    createCamera,
    updateCamera,
    updateCameraStatut,
    deleteCamera
};