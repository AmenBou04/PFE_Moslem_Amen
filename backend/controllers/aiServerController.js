const Camera = require('../models/Camera');
const aiServerManager = require('../utils/aiServerManager');
const fs = require('fs');
const path = require('path');

const AI_SERVER_FRAME_PATH = process.env.AI_SERVER_FRAME_PATH
    ? path.resolve(process.env.AI_SERVER_FRAME_PATH)
    : path.resolve(__dirname, '../../ai_server/latest_frame.jpg');

const getAiServerStatus = async (req, res) => {
    res.json(aiServerManager.getStatus());
};

const startAiServer = async (req, res) => {
    try {
        const { cameraId, cameraIndex } = req.body || {};

        if (!cameraId) {
            return res.status(400).json({ message: 'cameraId is required' });
        }

        const camera = await Camera.findById(cameraId).populate('zone_id', 'nom');
        if (!camera) {
            return res.status(404).json({ message: 'Camera not found' });
        }

        const parsedIndex = typeof cameraIndex === 'number' ? cameraIndex : parseInt(cameraIndex, 10);
        const status = aiServerManager.start({
            camera,
            cameraIndex: Number.isNaN(parsedIndex) ? undefined : parsedIndex
        });

        return res.json(status);
    } catch (error) {
        const statusCode = error.message.includes('already running') ? 409 : 500;
        return res.status(statusCode).json({ message: error.message });
    }
};

const stopAiServer = async (req, res) => {
    res.json(aiServerManager.stop());
};

const getAiServerFrame = async (req, res) => {
    try {
        if (!fs.existsSync(AI_SERVER_FRAME_PATH)) {
            return res.status(404).json({ message: 'No frame available yet' });
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        return res.sendFile(AI_SERVER_FRAME_PATH);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAiServerStatus,
    startAiServer,
    stopAiServer,
    getAiServerFrame
};
