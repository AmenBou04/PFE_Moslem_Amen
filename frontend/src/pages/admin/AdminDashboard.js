import React, { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Grid, Card, CardContent, Typography, Button, Box, Chip, TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUiFeedback } from '../../contexts/UiFeedbackContext';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, zones: 0, cameras: 0, alertes: 0 });
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [cameraIndex, setCameraIndex] = useState(0);
    const [aiStatus, setAiStatus] = useState({ running: false, context: null });
    const [previewRunning, setPreviewRunning] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const [aiFrameUrl, setAiFrameUrl] = useState('');
    const { notify } = useUiFeedback();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const stopPreview = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setPreviewRunning(false);
    };

    const startPreview = async () => {
        try {
            setPreviewError('');

            if (aiStatus.running) {
                setPreviewError('AI Server utilise deja la camera. Le flux IA ci-dessous affiche deja la camera dans l\'app.');
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setPreviewError('Ton navigateur ne supporte pas la previsualisation camera.');
                return;
            }

            if (!window.isSecureContext) {
                setPreviewError('Acces camera bloque: ouvre l\'application via https ou http://localhost.');
                return;
            }

            if (streamRef.current) {
                stopPreview();
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((device) => device.kind === 'videoinput');
            const index = Number(cameraIndex);
            const selectedDevice = videoInputs[index] || videoInputs[0];

            let stream;
            try {
                const preferredConstraints = selectedDevice
                    ? { video: { deviceId: { exact: selectedDevice.deviceId } }, audio: false }
                    : { video: true, audio: false };
                stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
            } catch (preferredError) {
                // Fallback: let browser pick any available camera.
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setPreviewRunning(true);
        } catch (error) {
            console.error('Erreur preview camera:', error);

            if (error?.name === 'NotAllowedError') {
                setPreviewError('Permission refusee. Autorise la camera dans le navigateur pour ce site.');
            } else if (error?.name === 'NotFoundError') {
                setPreviewError('Aucune camera detectee sur cette machine.');
            } else if (error?.name === 'NotReadableError') {
                setPreviewError('Camera occupee par une autre application (ex: AI Server). Arrete-la puis reessaie.');
            } else if (error?.name === 'OverconstrainedError') {
                setPreviewError('La camera choisie n\'est pas disponible avec cet index. Change l\'index puis reessaie.');
            } else {
                setPreviewError('Impossible d\'ouvrir la camera. Verifie permission et disponibilite.');
            }

            setPreviewRunning(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, zonesRes, camerasRes, alertesRes, aiStatusRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/zones'),
                    api.get('/cameras'),
                    api.get('/alertes'),
                    api.get('/ai-server/status')
                ]);

                setStats({
                    users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
                    zones: Array.isArray(zonesRes.data) ? zonesRes.data.length : 0,
                    cameras: Array.isArray(camerasRes.data) ? camerasRes.data.length : 0,
                    alertes: Array.isArray(alertesRes.data) ? alertesRes.data.length : 0
                });

                const cameraList = Array.isArray(camerasRes.data) ? camerasRes.data : [];
                setCameras(cameraList);
                setAiStatus(aiStatusRes.data || { running: false, context: null });

                if (!selectedCameraId && cameraList.length > 0) {
                    setSelectedCameraId(String(cameraList[0]._id || cameraList[0].id));
                }
            } catch (error) {
                console.error('Erreur chargement des statistiques admin :', error);
            }
        };

        fetchData();
    }, []);

    const refreshAiStatus = async () => {
        try {
            const response = await api.get('/ai-server/status');
            setAiStatus(response.data || { running: false, context: null });
        } catch (error) {
            console.error('Erreur status AI server:', error);
        }
    };

    const handleStartAiServer = async () => {
        if (!selectedCameraId) {
            notify({ type: 'warning', message: 'Choisis une camera avant de lancer AI Server.' });
            return;
        }

        try {
            await api.post('/ai-server/start', {
                cameraId: selectedCameraId,
                cameraIndex: Number(cameraIndex)
            });
            notify({ type: 'success', message: 'AI Server demarre depuis l application.' });
            refreshAiStatus();
        } catch (error) {
            notify({ type: 'error', message: error.response?.data?.message || 'Impossible de demarrer AI Server.' });
        }
    };

    const handleStopAiServer = async () => {
        try {
            await api.post('/ai-server/stop');
            notify({ type: 'info', message: 'AI Server arrete.' });
            refreshAiStatus();
        } catch (error) {
            notify({ type: 'error', message: error.response?.data?.message || 'Impossible d arreter AI Server.' });
        }
    };

    useEffect(() => {
        return () => {
            stopPreview();
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        let timerId;
        let lastObjectUrl = '';

        const fetchAiFrame = async () => {
            if (!aiStatus.running) {
                if (lastObjectUrl) {
                    URL.revokeObjectURL(lastObjectUrl);
                    lastObjectUrl = '';
                }
                if (mounted) {
                    setAiFrameUrl('');
                }
                return;
            }

            try {
                const response = await api.get('/ai-server/frame', { responseType: 'blob' });
                const nextUrl = URL.createObjectURL(response.data);

                if (lastObjectUrl) {
                    URL.revokeObjectURL(lastObjectUrl);
                }

                lastObjectUrl = nextUrl;
                if (mounted) {
                    setAiFrameUrl(nextUrl);
                }
            } catch (error) {
                // Ignore polling gaps before first frame exists.
            }
        };

        fetchAiFrame();
        timerId = window.setInterval(fetchAiFrame, 600);

        return () => {
            mounted = false;
            window.clearInterval(timerId);
            if (lastObjectUrl) {
                URL.revokeObjectURL(lastObjectUrl);
            }
        };
    }, [aiStatus.running]);

    return (
        <Layout title="Dashboard Administrateur">
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                Suivez les principaux indicateurs de surveillance en temps réel et accédez rapidement aux fonctions d'administration.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#2d3748', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h5">{stats.users}</Typography>
                            <Typography color="text.secondary">Utilisateurs</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#1d4ed8', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h5">{stats.zones}</Typography>
                            <Typography color="text.secondary">Zones actives</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#0f766e', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h5">{stats.cameras}</Typography>
                            <Typography color="text.secondary">Caméras</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#991b1b', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h5">{stats.alertes}</Typography>
                            <Typography color="text.secondary">Alertes totales</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <Button variant="contained" onClick={() => navigate('/users')}>
                    Gérer les utilisateurs
                </Button>
                <Button variant="contained" onClick={() => navigate('/zones')}>
                    Gérer les zones
                </Button>
                <Button variant="contained" onClick={() => navigate('/cameras')}>
                    Gérer les caméras
                </Button>
                <Button variant="contained" onClick={() => navigate('/alertes')}>
                    Voir les alertes
                </Button>
            </Box>

            <Card sx={{ mt: 4, bgcolor: '#111c30', color: 'white', border: '1px solid rgba(132, 196, 255, 0.25)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h6">AI Server integre</Typography>
                        <Chip
                            label={aiStatus.running ? 'En cours' : 'Arrete'}
                            color={aiStatus.running ? 'success' : 'default'}
                            size="small"
                        />
                    </Box>

                    <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(220, 235, 255, 0.86)' }}>
                        Selectionne une camera puis lance le service IA depuis l application (sans fenetre externe).
                    </Typography>

                    <Box sx={{ mt: 2.5, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto auto' } }}>
                        <TextField
                            select
                            label="Camera"
                            value={selectedCameraId}
                            onChange={(event) => setSelectedCameraId(event.target.value)}
                            fullWidth
                            size="small"
                        >
                            {cameras.map((camera) => (
                                <MenuItem key={camera._id || camera.id} value={camera._id || camera.id}>
                                    {camera.nom} {camera.zone_id?.nom ? `(${camera.zone_id.nom})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Index camera"
                            type="number"
                            size="small"
                            value={cameraIndex}
                            onChange={(event) => setCameraIndex(event.target.value)}
                            inputProps={{ min: 0 }}
                        />

                        <Button variant="contained" onClick={handleStartAiServer} disabled={aiStatus.running || !selectedCameraId}>
                            Lancer
                        </Button>

                        <Button variant="outlined" color="inherit" onClick={handleStopAiServer} disabled={!aiStatus.running}>
                            Arreter
                        </Button>
                    </Box>

                    {aiStatus.context?.cameraName ? (
                        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'rgba(220, 235, 255, 0.76)' }}>
                            Camera active: {aiStatus.context.cameraName} | Index: {aiStatus.context.cameraIndex}
                        </Typography>
                    ) : null}
                </CardContent>
            </Card>

            <Card sx={{ mt: 3, bgcolor: '#111c30', color: 'white', border: '1px solid rgba(132, 196, 255, 0.25)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                        <Typography variant="h6">Apercu camera dans l'application</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" size="small" onClick={startPreview}>
                                Voir la camera
                            </Button>
                            <Button variant="outlined" size="small" color="inherit" onClick={stopPreview} disabled={!previewRunning}>
                                Fermer l'apercu
                            </Button>
                        </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'rgba(220, 235, 255, 0.86)', mb: 1.5 }}>
                        L'apercu utilise la camera locale correspondant a l'index choisi plus haut. Si AI Server tourne deja,
                        arrete-le avant d'ouvrir l'apercu.
                    </Typography>

                    {aiStatus.running ? (
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#86efac', mb: 1 }}>
                                Flux IA actif: la camera est affichee ci-dessous meme si elle est occupee par AI Server.
                            </Typography>
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(132, 196, 255, 0.25)',
                                    backgroundColor: '#050b16',
                                    minHeight: 260,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {aiFrameUrl ? (
                                    <img
                                        src={aiFrameUrl}
                                        alt="Flux IA"
                                        style={{
                                            width: '100%',
                                            maxHeight: 420,
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'rgba(220, 235, 255, 0.76)' }}>
                                        Demarrage du flux IA...
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ) : null}

                    {previewError ? (
                        <Typography variant="body2" sx={{ color: '#fca5a5', mb: 1.5 }}>
                            {previewError}
                        </Typography>
                    ) : null}

                    <Box
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(132, 196, 255, 0.25)',
                            backgroundColor: '#050b16',
                            minHeight: 260,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                maxHeight: 420,
                                objectFit: 'cover',
                                display: previewRunning ? 'block' : 'none'
                            }}
                        />

                        {!previewRunning ? (
                            <Typography variant="body2" sx={{ color: 'rgba(220, 235, 255, 0.76)' }}>
                                Clique sur "Voir la camera" pour afficher le flux ici.
                            </Typography>
                        ) : null}
                    </Box>
                </CardContent>
            </Card>
        </Layout>
    );
};

export default AdminDashboard;
