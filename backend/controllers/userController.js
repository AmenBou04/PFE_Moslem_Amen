const User = require('../models/User');
const { safeCreateSystemLog } = require('../utils/systemLog');

const deleteAllUsers = async (req, res) => {
    return res.status(403).json({ message: 'La suppression globale des utilisateurs est interdite' });
};

const addAdmin = async (req, res) => {
    try {
        const { email, password, prenom, nom, role } = req.body;
        if (!email || !password || !prenom || !nom || !role) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        if (role !== 'ADMIN') {
            return res.status(400).json({ message: 'Le rôle doit être ADMIN' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const user = await User.create({ email, password, prenom, nom, role: 'ADMIN' });
        res.status(201).json({
            message: 'Admin ajouté',
            user: {
                _id: user._id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role
            }
        });

        await safeCreateSystemLog({
            level: 'INFO',
            action: 'ADMIN_CREATED',
            message: `Admin ajouté: ${user.email}`,
            entity: 'USER',
            entityId: String(user._id),
            user: req.user,
            metadata: { role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAdmin = async (req, res) => {
    return res.status(403).json({ message: 'La suppression d\'un admin est interdite' });
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);

        if (!users) {
            return res.status(404).json({ message: 'Aucun utilisateur trouvé' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addOperateur = async (req, res) => {
    try {
        const { email, password, prenom, nom } = req.body;
        if (!email || !password || !prenom || !nom) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const user = await User.create({ email, password, prenom, nom, role: 'OPERATEUR' });
        res.status(201).json({
            message: 'Opérateur ajouté',
            user: {
                _id: user._id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom
            }
        });

        await safeCreateSystemLog({
            level: 'INFO',
            action: 'OPERATOR_CREATED',
            message: `Opérateur ajouté: ${user.email}`,
            entity: 'USER',
            entityId: String(user._id),
            user: req.user,
            metadata: { role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOperateurs = async (req, res) => {
    try {
        const operateurs = await User.find({ role: 'OPERATEUR' }).select('-password');
        res.json(operateurs);

        if (!operateurs) {
            return res.status(404).json({ message: 'Aucun opérateur trouvé' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateOperateur = async (req, res) => {
    try {
        const { email, password, prenom, nom } = req.body;
        const operateur = await User.findById(req.params.id);

        if (!operateur || operateur.role !== 'OPERATEUR') {
            return res.status(404).json({ message: 'Opérateur non trouvé' });
        }

        if (email) operateur.email = email;
        if (password) operateur.password = password;
        if (prenom) operateur.prenom = prenom;
        if (nom) operateur.nom = nom;

        await operateur.save();
        res.json({
            message: 'Opérateur mis à jour',
            user: {
                _id: operateur._id,
                email: operateur.email,
                prenom: operateur.prenom,
                nom: operateur.nom
            }
        });

        await safeCreateSystemLog({
            level: 'INFO',
            action: 'OPERATOR_UPDATED',
            message: `Opérateur mis à jour: ${operateur.email}`,
            entity: 'USER',
            entityId: String(operateur._id),
            user: req.user,
            metadata: { email: operateur.email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAdmin = async (req, res) => {
    return res.status(403).json({ message: 'La modification d\'un admin est interdite' });
};

const getOperateurById = async (req, res) => {
    try {
        const operateur = await User.findById(req.params.id).select('-password');
        if (!operateur || operateur.role !== 'OPERATEUR') {
            return res.status(404).json({ message: 'Opérateur non trouvé' });
        }
        res.json(operateur);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteOperateur = async (req, res) => {
    try {
        const operateur = await User.findById(req.params.id);
        if (!operateur || operateur.role !== 'OPERATEUR') {
            return res.status(404).json({ message: 'Opérateur non trouvé' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Opérateur supprimé' });

        await safeCreateSystemLog({
            level: 'WARNING',
            action: 'OPERATOR_DELETED',
            message: `Opérateur supprimé: ${operateur.email}`,
            entity: 'USER',
            entityId: String(operateur._id),
            user: req.user,
            metadata: { role: operateur.role }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    deleteAllUsers,
    deleteAdmin,
    getUsers,
    addAdmin,
    addOperateur,
    getOperateurs,
    updateOperateur,
    getOperateurById,
    deleteOperateur,
    updateAdmin
};
