const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const AI_SERVER_EXE_PATH = process.env.AI_SERVER_EXE_PATH
    ? path.resolve(process.env.AI_SERVER_EXE_PATH)
    : path.resolve(__dirname, '../../ai_server/ai_server.exe');
const AI_SERVER_CPP_PATH = path.resolve(__dirname, '../../ai_server/ai_server.cpp');
const DEFAULT_OPENCV_BIN_PATH = 'C:/OpenCV-MinGW-Build-OpenCV-4.5.5-x64/x64/mingw/bin';
const AI_SERVER_FRAME_PATH = process.env.AI_SERVER_FRAME_PATH
    ? path.resolve(process.env.AI_SERVER_FRAME_PATH)
    : path.resolve(__dirname, '../../ai_server/latest_frame.jpg');

let aiProcess = null;
let currentContext = null;

const resolveCameraIndex = (camera, fallbackIndex) => {
    if (Number.isInteger(fallbackIndex) && fallbackIndex >= 0) {
        return fallbackIndex;
    }

    if (Number.isInteger(camera?.device_index) && camera.device_index >= 0) {
        return camera.device_index;
    }

    if (typeof camera?.adresse_ip === 'string' && /^\d+$/.test(camera.adresse_ip.trim())) {
        return parseInt(camera.adresse_ip.trim(), 10);
    }

    return 0;
};

const getStatus = () => ({
    running: Boolean(aiProcess && !aiProcess.killed),
    pid: aiProcess?.pid || null,
    context: currentContext
});

const start = ({ camera, cameraIndex }) => {
    if (aiProcess && !aiProcess.killed) {
        throw new Error('AI server already running');
    }

    if (!camera?._id) {
        throw new Error('Camera is required to start AI server');
    }

    if (!fs.existsSync(AI_SERVER_EXE_PATH)) {
        throw new Error(`ai_server.exe not found: ${AI_SERVER_EXE_PATH}`);
    }

    if (fs.existsSync(AI_SERVER_CPP_PATH)) {
        const exeStat = fs.statSync(AI_SERVER_EXE_PATH);
        const cppStat = fs.statSync(AI_SERVER_CPP_PATH);
        if (cppStat.mtimeMs > exeStat.mtimeMs) {
            console.warn('WARN ai_server.exe is older than ai_server.cpp. Rebuild is recommended.');
        }
    }

    if (!process.env.AI_ALERT_API_KEY) {
        throw new Error('AI_ALERT_API_KEY is missing in backend environment');
    }

    const resolvedCameraIndex = resolveCameraIndex(camera, cameraIndex);
    const args = [
        '--camera-index',
        String(resolvedCameraIndex),
        '--camera-id-db',
        String(camera._id)
    ];

    if (camera.zone_id?._id || camera.zone_id) {
        args.push('--zone-id', String(camera.zone_id?._id || camera.zone_id));
    }

    if (process.env.AI_SERVER_API_URL) {
        args.push('--api-url', process.env.AI_SERVER_API_URL);
    }

    if (process.env.AI_ALERT_API_KEY) {
        args.push('--api-key', process.env.AI_ALERT_API_KEY);
    }

    args.push('--snapshot-path', AI_SERVER_FRAME_PATH);

    args.push('--headless');

    const spawnEnv = { ...process.env };
    const opencvBinPath = process.env.OPENCV_BIN_PATH || DEFAULT_OPENCV_BIN_PATH;
    if (fs.existsSync(opencvBinPath)) {
        const currentPath = spawnEnv.PATH || '';
        if (!currentPath.toLowerCase().includes(opencvBinPath.toLowerCase())) {
            spawnEnv.PATH = `${opencvBinPath};${currentPath}`;
        }
    }

    aiProcess = spawn(AI_SERVER_EXE_PATH, args, {
        cwd: path.dirname(AI_SERVER_EXE_PATH),
        windowsHide: true,
        stdio: 'ignore',
        env: spawnEnv
    });

    currentContext = {
        cameraId: String(camera._id),
        cameraName: camera.nom || 'Camera',
        zoneId: camera.zone_id?._id ? String(camera.zone_id._id) : (camera.zone_id ? String(camera.zone_id) : null),
        cameraIndex: resolvedCameraIndex,
        startedAt: new Date().toISOString()
    };

    aiProcess.on('exit', () => {
        aiProcess = null;
        currentContext = null;
    });

    aiProcess.on('error', () => {
        aiProcess = null;
        currentContext = null;
    });

    return getStatus();
};

const stop = () => {
    if (!aiProcess || aiProcess.killed) {
        return getStatus();
    }

    aiProcess.kill('SIGTERM');
    return getStatus();
};

module.exports = {
    start,
    stop,
    getStatus
};
