const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification de base (vérifie que l'utilisateur est connecté)
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Non autorisé - Token manquant' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }
        
        if (!user.est_actif) {
            return res.status(401).json({ message: 'Compte désactivé' });
        }
        
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Non autorisé - Token invalide' });
    }
};

const isAdminLikeUser = (user) => user?.role === 'ADMIN';

const isOperatorLikeUser = (user) => isAdminLikeUser(user) || user?.role === 'OPERATEUR';

const canManageAdmins = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé - Droits administrateur requis' });
    }
};

// Middleware pour vérifier que l'utilisateur est ADMIN
const isAdmin = (req, res, next) => {
    if (req.user && isAdminLikeUser(req.user)) {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé - Droits administrateur requis' });
    }
};

// Middleware pour vérifier que l'utilisateur est OPERATEUR
const isOperator = (req, res, next) => {
    if (req.user && isOperatorLikeUser(req.user)) {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé - Droits opérateur requis' });
    }
};

// Middleware pour vérifier que l'utilisateur est ADMIN ou OPERATEUR (tout connecté)
const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: 'Non authentifié' });
    }
};

// Middleware pour les appels machine-to-machine (service IA)
const authAI = (req, res, next) => {
    const providedKey = req.header('x-ai-key');
    const expectedKey = process.env.AI_ALERT_API_KEY;

    if (!expectedKey) {
        return res.status(500).json({ message: 'Configuration AI_ALERT_API_KEY manquante' });
    }

    if (!providedKey || providedKey !== expectedKey) {
        return res.status(401).json({ message: 'Non autorisé - Clé IA invalide' });
    }

    next();
};

module.exports = { auth, isAdmin, isOperator, isAuthenticated, authAI, canManageAdmins, isAdminLikeUser, isOperatorLikeUser };