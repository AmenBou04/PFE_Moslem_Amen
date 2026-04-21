const User = require('../models/User');
const bcrypt = require('bcryptjs');

// =====================================================
// MODIFIER SON PROPRE COMPTE (nom, prénom, email)
// =====================================================
const modifyAccount = async (req, res) => {
    try {
        const userId = req.userId; // ← Correction: req.userId (pas req.user.id)
        const { nom, prenom, email } = req.body;
        
        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé' });
            }
            user.email = email;
        }
        
        // Mettre à jour les champs
        if (nom !== undefined) user.nom = nom;
        if (prenom !== undefined) user.prenom = prenom;
        
        await user.save();
        
        // Retourner l'utilisateur sans le mot de passe
        const userResponse = {
            _id: user._id,
            email: user.email,
            role: user.role,
            prenom: user.prenom,
            nom: user.nom,
            est_actif: user.est_actif
        };
        
        res.json(userResponse);
    } catch (error) {
        console.error('❌ Erreur modifyAccount:', error);
        res.status(500).json({ message: error.message });
    }
};

// =====================================================
// MODIFIER LE MOT DE PASSE
// =====================================================
const modifyPassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;
        
        // Vérifier les champs requis
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }
        
        // Vérifier la longueur du nouveau mot de passe
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        
        // Récupérer l'utilisateur avec son mot de passe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Vérifier l'ancien mot de passe
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }
        
        // Hacher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        
        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        console.error('❌ Erreur modifyPassword:', error);
        res.status(500).json({ message: error.message });
    }
};

// =====================================================
// SUPPRIMER SON PROPRE COMPTE
// =====================================================
const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({ message: 'Un administrateur ne peut pas supprimer son compte' });
        }
        
        // Supprimer l'utilisateur
        await User.findByIdAndDelete(userId);
        
        res.json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        console.error('❌ Erreur deleteAccount:', error);
        res.status(500).json({ message: error.message });
    }
};

// =====================================================
// RÉCUPÉRER SON PROPRE PROFIL
// =====================================================
const getMyProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('❌ Erreur getMyProfile:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    modifyAccount,
    modifyPassword,
    deleteAccount,
    getMyProfile
};