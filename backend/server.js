const app = require('./app');
const connectDB = require('./config/database');
const User = require('./models/User');
const aiServerManager = require('./utils/aiServerManager');

const PORT = process.env.PORT || 8000;

const normalizeLegacyAdmins = async () => {
    const result = await User.updateMany({ role: 'SUPERADMIN' }, { $set: { role: 'ADMIN' } });
    if (result.modifiedCount > 0) {
        console.log(`🔧 ${result.modifiedCount} compte(s) super admin migré(s) vers admin`);
    }
};

const start = async () => {
    await connectDB();
    await normalizeLegacyAdmins();

    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
};

process.on('SIGINT', () => {
    aiServerManager.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    aiServerManager.stop();
    process.exit(0);
});

start().catch((error) => {
    console.error('❌ Erreur au démarrage du serveur:', error.message);
    process.exit(1);
});

