const SystemLog = require('../models/SystemLog');

const getSystemLogs = async (req, res) => {
    try {
        const { limit = 100, level, action, entity } = req.query;
        const filter = {};

        if (level) filter.level = level;
        if (action) filter.action = action;
        if (entity) filter.entity = entity;

        const logs = await SystemLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(parseInt(limit, 10) || 100, 500))
            .populate('userId', 'prenom nom email role');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSystemLogs };