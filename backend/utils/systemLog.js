const SystemLog = require('../models/SystemLog');

const safeCreateSystemLog = async ({
    level = 'INFO',
    action,
    message,
    entity,
    entityId,
    user,
    metadata
}) => {
    if (!action || !message) {
        return null;
    }

    try {
        return await SystemLog.create({
            level,
            action,
            message,
            entity,
            entityId,
            userId: user?._id,
            userEmail: user?.email,
            metadata
        });
    } catch (error) {
        console.error('Erreur journal système:', error.message);
        return null;
    }
};

module.exports = { safeCreateSystemLog };