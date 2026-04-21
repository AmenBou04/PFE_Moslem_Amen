const Alerte = require('../models/Alerte');
const Camera = require('../models/Camera');
const mongoose = require('mongoose');
const { safeCreateSystemLog } = require('../utils/systemLog');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildAlertesListFilter = (req = {}) => {
    const { statut, gravite, zone_id, type, dateFrom, dateTo } = req.query || {};
    const filter = {};

    if (req.user?.role === 'ADMIN') {
        filter.statut = 'ESCALADEE';
    } else {
        if (statut) filter.statut = statut;
        if (gravite) filter.gravite = gravite;
        if (zone_id) filter.zone_id = zone_id;
        if (type) filter.type = type;
    }

    if (type && req.user?.role === 'ADMIN') {
        filter.type = type;
    }

    if (dateFrom || dateTo) {
        filter.createdAt = {};

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filter.createdAt.$gte = fromDate;
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
        }
    }

    return filter;
};

const buildAlertePayload = async (body = {}) => {
    const payload = {
        type: body.type || 'ANOMALIE',
        gravite: body.gravite || 'MOYENNE',
        description: body.description || 'Détection IA',
        statut: 'NOUVELLE'
    };

    const imageCapture = body.image_capture || body.imageCapture || body.image_base64;
    if (imageCapture) {
        payload.image_capture = imageCapture;
    }

    if (body.zone_id && isValidObjectId(body.zone_id)) {
        payload.zone_id = body.zone_id;
    }

    if (body.camera_id && isValidObjectId(body.camera_id)) {
        payload.camera_id = body.camera_id;
    }

    if (!payload.zone_id && payload.camera_id) {
        const linkedCamera = await Camera.findById(payload.camera_id).select('zone_id');
        if (linkedCamera?.zone_id) {
            payload.zone_id = linkedCamera.zone_id;
        }
    }

    if (Array.isArray(body.ids_personnes)) {
        payload.ids_personnes = body.ids_personnes.filter((id) => Number.isInteger(id));
    }

    return payload;
};

// =====================================================
// FONCTIONS EXISTANTES
// =====================================================

// @desc    Récupérer toutes les alertes
const getAlertes = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const filter = buildAlertesListFilter(req);
        
        const alertes = await Alerte.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer une alerte par ID
const getAlerteById = async (req, res) => {
    try {
        const alerte = await Alerte.findById(req.params.id)
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        if (!alerte) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }
        res.json(alerte);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Créer une alerte
const createAlerte = async (req, res) => {
    try {
        const imageLength = req.body?.image_capture?.length || req.body?.imageCapture?.length || req.body?.image_base64?.length || 0;
        console.log(`📥 Requête reçue (image_capture: ${imageLength > 0 ? `${imageLength} chars` : 'absente'})`);
        
        const alerte = await Alerte.create(await buildAlertePayload(req.body));
        
        console.log('✅ Alerte créée:', alerte._id);
        res.status(201).json(alerte);
        await safeCreateSystemLog({
            level: 'INFO',
            action: 'ALERTE_CREATED',
            message: `Alerte créée: ${alerte.type} / ${alerte.gravite}`,
            entity: 'ALERTE',
            entityId: String(alerte._id),
            user: req.user,
            metadata: { type: alerte.type, gravite: alerte.gravite, statut: alerte.statut }
        });
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ message: error.message });
        await safeCreateSystemLog({
            level: 'ERROR',
            action: 'ALERTE_CREATE_FAILED',
            message: `Échec création alerte: ${error.message}`,
            entity: 'ALERTE',
            user: req.user,
            metadata: { body: req.body }
        });
    }
};

// @desc    Créer une alerte depuis le service IA (clé API)
const createAlerteFromAI = async (req, res) => {
    try {
        const alerte = await Alerte.create(await buildAlertePayload(req.body));
        res.status(201).json(alerte);
    } catch (error) {
        console.error('❌ Erreur création alerte IA:', error);
        res.status(500).json({ message: error.message });
    }
};


// @desc    Acquitter une alerte
const acquitterAlerte = async (req, res) => {
    try {
        const alerte = await Alerte.findByIdAndUpdate(
            req.params.id,
            { 
                statut: 'ACQUITTEE',
                traitee_par: req.userId
            },
            { new: true }
        );
        if (!alerte) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }
        res.json(alerte);
        await safeCreateSystemLog({
            level: 'INFO',
            action: 'ALERTE_ACKNOWLEDGED',
            message: `Alerte acquittée: ${alerte._id}`,
            entity: 'ALERTE',
            entityId: String(alerte._id),
            user: req.user,
            metadata: { statut: 'ACQUITTEE' }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Escalader une alerte
const escaladerAlerte = async (req, res) => {
    try {
        const alerte = await Alerte.findByIdAndUpdate(
            req.params.id,
            { 
                statut: 'ESCALADEE',
                commentaire: req.body.commentaire
            },
            { new: true }
        );
        if (!alerte) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }
        res.json(alerte);
        await safeCreateSystemLog({
            level: 'WARNING',
            action: 'ALERTE_ESCALATED',
            message: `Alerte escaladée: ${alerte._id}`,
            entity: 'ALERTE',
            entityId: String(alerte._id),
            user: req.user,
            metadata: { statut: 'ESCALADEE', commentaire: req.body.commentaire }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Résoudre une alerte
const resoudreAlerte = async (req, res) => {
    try {
        const alerte = await Alerte.findByIdAndUpdate(
            req.params.id,
            { 
                statut: 'RESOLUE',
                date_resolution: new Date(),
                commentaire: req.body.commentaire
            },
            { new: true }
        );
        if (!alerte) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }
        res.json(alerte);
        await safeCreateSystemLog({
            level: 'INFO',
            action: 'ALERTE_RESOLVED',
            message: `Alerte résolue: ${alerte._id}`,
            entity: 'ALERTE',
            entityId: String(alerte._id),
            user: req.user,
            metadata: { statut: 'RESOLUE', commentaire: req.body.commentaire }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// =====================================================
// NOUVELLES FONCTIONS
// =====================================================

// @desc    Récupérer les alertes par zone
// @route   GET /api/alertes/zone/:zoneId
const getAlertesByZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ zone_id: zoneId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes par caméra
// @route   GET /api/alertes/camera/:cameraId
const getAlertesByCamera = async (req, res) => {
    try {
        const { cameraId } = req.params;
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ camera_id: cameraId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes par statut
// @route   GET /api/alertes/statut/:statut
const getAlertesByStatut = async (req, res) => {
    try {
        const { statut } = req.params;
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ statut })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes par gravité
// @route   GET /api/alertes/gravite/:gravite
const getAlertesByGravite = async (req, res) => {
    try {
        const { gravite } = req.params;
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ gravite })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes traitées par un utilisateur
// @route   GET /api/alertes/traitee_par/:userId
const getAlertesByTraiteePar = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ traitee_par: userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes non traitées (NOUVELLE)
// @route   GET /api/alertes/non-traitees
const getAlertesNonTraitees = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ statut: 'NOUVELLE' })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les alertes acquittées
// @route   GET /api/alertes/acquittees
const getAlertesAcquittees = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const alertes = await Alerte.find({ statut: 'ACQUITTEE' })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer l'alerte la plus récente
// @route   GET /api/alertes/recente
const getAlerteRecente = async (req, res) => {
    try {
        const alerte = await Alerte.findOne()
            .sort({ createdAt: -1 })
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        if (!alerte) {
            return res.status(404).json({ message: 'Aucune alerte trouvée' });
        }
        res.json(alerte);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer l'alerte la plus récente par zone
// @route   GET /api/alertes/recente/:zoneId
const getAlerteRecenteByZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        
        const alerte = await Alerte.findOne({ zone_id: zoneId })
            .sort({ createdAt: -1 })
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        if (!alerte) {
            return res.status(404).json({ message: 'Aucune alerte trouvée pour cette zone' });
        }
        res.json(alerte);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer l'alerte la plus récente par caméra
// @route   GET /api/alertes/recente/camera/:cameraId
const getAlerteRecenteByCamera = async (req, res) => {
    try {
        const { cameraId } = req.params;
        
        const alerte = await Alerte.findOne({ camera_id: cameraId })
            .sort({ createdAt: -1 })
            .populate('zone_id', 'nom')
            .populate('camera_id', 'nom')
            .populate('traitee_par', 'nom prenom');
        
        if (!alerte) {
            return res.status(404).json({ message: 'Aucune alerte trouvée pour cette caméra' });
        }
        res.json(alerte);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAlerte = async (req, res) => {
    try {
        const alerte = await Alerte.findByIdAndDelete(req.params.id);
        if (!alerte) {
            return res.status(404).json({ message: 'Alerte non trouvée' });
        }
        res.json({ message: 'Alerte supprimée' });
        await safeCreateSystemLog({
            level: 'WARNING',
            action: 'ALERTE_DELETED',
            message: `Alerte supprimée: ${alerte._id}`,
            entity: 'ALERTE',
            entityId: String(alerte._id),
            user: req.user,
            metadata: { type: alerte.type, gravite: alerte.gravite }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
};

const deleteAllAlertes = async (req, res) => {
    try {
        const result = await Alerte.deleteMany({});
        res.json({ message: 'Toutes les alertes ont été supprimées' });
        await safeCreateSystemLog({
            level: 'WARNING',
            action: 'ALERTE_BULK_DELETE',
            message: `Suppression de toutes les alertes (${result.deletedCount})`,
            entity: 'ALERTE',
            user: req.user,
            metadata: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    // Existantes
    getAlertes,
    getAlerteById,
    createAlerte,
    createAlerteFromAI,
    acquitterAlerte,
    escaladerAlerte,
    resoudreAlerte,
    // Nouvelles
    getAlertesByZone,
    getAlertesByCamera,
    getAlertesByStatut,
    getAlertesByGravite,
    getAlertesByTraiteePar,
    getAlertesNonTraitees,
    getAlertesAcquittees,
    getAlerteRecente,
    getAlerteRecenteByZone,
    getAlerteRecenteByCamera,
    deleteAlerte,
    deleteAllAlertes

};