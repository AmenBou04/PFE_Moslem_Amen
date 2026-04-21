import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Snackbar,
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

const OperatorAlertes = () => {
    const [alertes, setAlertes] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [selectedAlerte, setSelectedAlerte] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [commentaire, setCommentaire] = useState('');
    const [filters, setFilters] = useState({
        gravite: 'ALL',
        statut: 'ALL',
        zone_id: 'ALL',
        dateFrom: '',
        dateTo: ''
    });
    const [stats, setStats] = useState({
        total: 0,
        critiques: 0,
        elevees: 0,
        moyennes: 0,
        faibles: 0
    });
    const previousAlertCount = useRef(0);

    const fetchZones = useCallback(async () => {
        try {
            const response = await api.get('/zones');
            setZones(response.data || []);
        } catch (error) {
            console.error('Erreur chargement zones:', error);
        }
    }, []);

    // Récupérer les alertes
    const fetchAlertes = useCallback(async (overrideFilters = filters) => {
        try {
            const params = new URLSearchParams();

            if (overrideFilters.gravite && overrideFilters.gravite !== 'ALL') {
                params.set('gravite', overrideFilters.gravite);
            }

            if (overrideFilters.statut && overrideFilters.statut !== 'ALL') {
                params.set('statut', overrideFilters.statut);
            }

            if (overrideFilters.zone_id && overrideFilters.zone_id !== 'ALL') {
                params.set('zone_id', overrideFilters.zone_id);
            }

            if (overrideFilters.dateFrom) {
                params.set('dateFrom', overrideFilters.dateFrom);
            }

            if (overrideFilters.dateTo) {
                params.set('dateTo', overrideFilters.dateTo);
            }

            params.set('limit', '100');

            const response = await api.get(`/alertes?${params.toString()}`);
            const nouvellesAlertes = response.data;
            setAlertes(nouvellesAlertes);
            
            const critiques = nouvellesAlertes.filter(a => a.gravite === 'CRITIQUE').length;
            const elevees = nouvellesAlertes.filter(a => a.gravite === 'ELEVEE').length;
            const moyennes = nouvellesAlertes.filter(a => a.gravite === 'MOYENNE').length;
            const faibles = nouvellesAlertes.filter(a => a.gravite === 'FAIBLE').length;
            
            setStats({
                total: nouvellesAlertes.length,
                critiques,
                elevees,
                moyennes,
                faibles
            });
            
            if (previousAlertCount.current > 0 && nouvellesAlertes.length > previousAlertCount.current) {
                const nouvelle = nouvellesAlertes[0];
                const payload = {
                    open: true,
                    message: `🔔 Nouvelle alerte: ${nouvelle.type} - ${nouvelle.description}`,
                    severity: nouvelle.gravite === 'CRITIQUE' ? 'error' : nouvelle.gravite === 'ELEVEE' ? 'warning' : 'info'
                };
                setNotification(payload);
            }

            previousAlertCount.current = nouvellesAlertes.length;
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleFilterChange = (field) => (event) => {
        setFilters((previous) => ({ ...previous, [field]: event.target.value }));
    };

    const handleFilterSearch = () => {
        fetchAlertes(filters);
    };

    const handleFilterReset = () => {
        const defaultFilters = {
            gravite: 'ALL',
            statut: 'ALL',
            zone_id: 'ALL',
            dateFrom: '',
            dateTo: ''
        };

        setFilters(defaultFilters);
        fetchAlertes(defaultFilters);
    };

    // Acquitter une alerte
    const handleAcquitter = async (id) => {
        try {
            await api.patch(`/alertes/${id}/acquitter`);
            setNotification({
                open: true,
                message: '✅ Alerte acquittée avec succès',
                severity: 'success'
            });
            fetchAlertes();
        } catch (error) {
            console.error('Erreur:', error);
            setNotification({
                open: true,
                message: 'Erreur lors de l\'acquittement de l\'alerte',
                severity: 'error'
            });
        }
    };

    // Escalader une alerte
    const handleEscalader = async () => {
        try {
            const id = selectedAlerte?._id || selectedAlerte?.id;
            await api.patch(`/alertes/${id}/escalader`, { commentaire });
            setNotification({
                open: true,
                message: '⚠️ Alerte escaladée au responsable',
                severity: 'warning'
            });
            setOpenDialog(false);
            setCommentaire('');
            fetchAlertes();
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    // Voir les détails
    const handleViewDetails = (alerte) => {
        setSelectedAlerte(alerte);
        setOpenDialog(true);
    };

    // Obtenir la couleur et l'icône selon la gravité
    const getSeverityInfo = (gravite) => {
        switch(gravite) {
            case 'CRITIQUE':
                return { color: 'error', icon: <ErrorIcon />, label: 'Critique' };
            case 'ELEVEE':
                return { color: 'warning', icon: <WarningIcon />, label: 'Élevée' };
            case 'MOYENNE':
                return { color: 'info', icon: <InfoIcon />, label: 'Moyenne' };
            default:
                return { color: 'success', icon: <CheckIcon />, label: 'Faible' };
        }
    };

    // Obtenir la couleur de fond selon la gravité
    const getRowBackground = (gravite) => {
        switch(gravite) {
            case 'CRITIQUE': return '#ffebee';
            case 'ELEVEE': return '#fff3e0';
            case 'MOYENNE': return '#e3f2fd';
            default: return 'inherit';
        }
    };

    useEffect(() => {
        fetchZones();
        fetchAlertes();
    }, [fetchAlertes, fetchZones]);

    useEffect(() => {
        const interval = setInterval(() => fetchAlertes(filters), 3000);
        return () => clearInterval(interval);
    }, [fetchAlertes, filters]);

    const getNotificationIcon = (severity) => {
        switch (severity) {
            case 'error':
                return <ErrorIcon sx={{ mr: 1.5, color: '#b91c1c' }} />;
            case 'warning':
                return <WarningIcon sx={{ mr: 1.5, color: '#b45309' }} />;
            case 'success':
                return <CheckIcon sx={{ mr: 1.5, color: '#047857' }} />;
            default:
                return <InfoIcon sx={{ mr: 1.5, color: '#2563eb' }} />;
        }
    };

    return (
        <Layout title="Gestion des Alertes">
            <Card sx={{ mb: 3, borderRadius: 3, bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid rgba(184, 216, 255, 0.14)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>Filtres des alertes</Typography>
                            <Typography variant="body2" sx={{ color: '#b8d8ff' }}>
                                Filtrer par sévérité, statut, zone et période.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button variant="outlined" onClick={handleFilterReset} sx={{ color: '#f8fafc', borderColor: 'rgba(184, 216, 255, 0.28)' }}>
                                Réinitialiser
                            </Button>
                            <Button variant="contained" onClick={handleFilterSearch}>
                                Filtrer
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                select
                                fullWidth
                                label="Sévérité"
                                value={filters.gravite}
                                onChange={handleFilterChange('gravite')}
                                sx={{
                                    '& .MuiInputLabel-root': { color: '#b8d8ff' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(184,216,255,0.22)' }
                                    }
                                }}
                            >
                                <MenuItem value="ALL">Toutes</MenuItem>
                                <MenuItem value="CRITIQUE">Critique</MenuItem>
                                <MenuItem value="ELEVEE">Élevée</MenuItem>
                                <MenuItem value="MOYENNE">Moyenne</MenuItem>
                                <MenuItem value="FAIBLE">Faible</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                select
                                fullWidth
                                label="Statut"
                                value={filters.statut}
                                onChange={handleFilterChange('statut')}
                                sx={{
                                    '& .MuiInputLabel-root': { color: '#b8d8ff' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(184,216,255,0.22)' }
                                    }
                                }}
                            >
                                <MenuItem value="ALL">Tous</MenuItem>
                                <MenuItem value="NOUVELLE">Nouvelle</MenuItem>
                                <MenuItem value="ACQUITTEE">Acquittée</MenuItem>
                                <MenuItem value="ESCALADEE">Escaladée</MenuItem>
                                <MenuItem value="RESOLUE">Résolue</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                select
                                fullWidth
                                label="Zone"
                                value={filters.zone_id}
                                onChange={handleFilterChange('zone_id')}
                                sx={{
                                    '& .MuiInputLabel-root': { color: '#b8d8ff' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(184,216,255,0.22)' }
                                    }
                                }}
                            >
                                <MenuItem value="ALL">Toutes les zones</MenuItem>
                                {zones.map((zone) => (
                                    <MenuItem key={zone._id || zone.id} value={zone._id || zone.id}>
                                        {zone.nom || zone.name || 'Zone'}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Début"
                                value={filters.dateFrom}
                                onChange={handleFilterChange('dateFrom')}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiInputLabel-root': { color: '#b8d8ff' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(184,216,255,0.22)' }
                                    },
                                    '& input::-webkit-calendar-picker-indicator': {
                                        filter: 'invert(1) brightness(1.3)'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fin"
                                value={filters.dateTo}
                                onChange={handleFilterChange('dateTo')}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiInputLabel-root': { color: '#b8d8ff' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(184,216,255,0.22)' }
                                    },
                                    '& input::-webkit-calendar-picker-indicator': {
                                        filter: 'invert(1) brightness(1.3)'
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Cartes de statistiques */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ bgcolor: '#1a1a2e', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h4">{stats.total}</Typography>
                            <Typography variant="body2">Total alertes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ bgcolor: '#e53e3e', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h4">{stats.critiques}</Typography>
                            <Typography variant="body2">Critiques</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ bgcolor: '#ed8936', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h4">{stats.elevees}</Typography>
                            <Typography variant="body2">Élevées</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ bgcolor: '#4299e1', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h4">{stats.moyennes}</Typography>
                            <Typography variant="body2">Moyennes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ bgcolor: '#48bb78', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h4">{stats.faibles}</Typography>
                            <Typography variant="body2">Faibles</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Bouton rafraîchir */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAlertes}
                >
                    Rafraîchir
                </Button>
            </Box>

            {/* Tableau des alertes */}
            <TableContainer component={Paper}>
                <Table sx={{ '& td': { color: '#0b1b30' } }}>
                    <TableHead sx={{ bgcolor: '#1a1a2e' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white' }}>Type</TableCell>
                            <TableCell sx={{ color: 'white' }}>Gravité</TableCell>
                            <TableCell sx={{ color: 'white' }}>Description</TableCell>
                            <TableCell sx={{ color: 'white' }}>Zone</TableCell>
                            <TableCell sx={{ color: 'white' }}>Date</TableCell>
                            <TableCell sx={{ color: 'white' }}>Statut</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {alertes.map((alerte) => {
                            const severityInfo = getSeverityInfo(alerte.gravite);
                            return (
                                <TableRow 
                                    key={alerte._id}
                                    sx={{ bgcolor: getRowBackground(alerte.gravite) }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={alerte.type}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                color: '#0b1b30',
                                                borderColor: 'divider',
                                                '& .MuiChip-label': { color: '#0b1b30' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={severityInfo.icon}
                                            label={severityInfo.label}
                                            color={severityInfo.color}
                                            size="small"
                                            variant={severityInfo.color === 'info' || severityInfo.color === 'warning' ? 'outlined' : 'filled'}
                                            sx={{
                                                color: '#0b1b30',
                                                '& .MuiChip-label': { color: '#0b1b30' },
                                                '& .MuiChip-icon': { color: '#0b1b30' },
                                                ...(severityInfo.color === 'info' && {
                                                    borderColor: '#7dd3fc',
                                                    bgcolor: '#e0f2fe'
                                                }),
                                                ...(severityInfo.color === 'warning' && {
                                                    borderColor: '#fcd34d',
                                                    bgcolor: '#fef3c7'
                                                })
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{alerte.description}</TableCell>
                                    <TableCell>
                                        {alerte.zone_id?.nom || `Zone ${alerte.zone_id}`}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(alerte.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={alerte.statut}
                                            color={alerte.statut === 'NOUVELLE' ? 'error' : 'success'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            color="info"
                                            onClick={() => handleViewDetails(alerte)}
                                            title="Voir détails"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        {alerte.statut === 'NOUVELLE' && (
                                            <>
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    color="success"
                                                    onClick={() => handleAcquitter(alerte._id)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Acquitter
                                                </Button>
                                                {alerte.gravite === 'CRITIQUE' && (
                                                    <Button 
                                                        size="small" 
                                                        variant="contained" 
                                                        color="warning"
                                                        onClick={() => {
                                                            setSelectedAlerte(alerte);
                                                            setOpenDialog(true);
                                                        }}
                                                    >
                                                        Escalader
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {alertes.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Box sx={{ py: 4 }}>
                                        <Typography variant="h6" color="textSecondary">
                                            Aucune alerte pour le moment
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Les alertes apparaîtront ici automatiquement
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Détails/Escalade */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedAlerte?.statut === 'NOUVELLE' ? 'Escalader l\'alerte' : 'Détails de l\'alerte'}
                </DialogTitle>
                <DialogContent>
                    {selectedAlerte && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                                    <Typography variant="body1">{selectedAlerte.type}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Gravité</Typography>
                                    <Chip 
                                        icon={getSeverityInfo(selectedAlerte.gravite).icon}
                                        label={getSeverityInfo(selectedAlerte.gravite).label}
                                        color={getSeverityInfo(selectedAlerte.gravite).color}
                                        size="small"
                                        sx={{ color: '#0b1b30' }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                    <Typography variant="body1">{selectedAlerte.description}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Zone</Typography>
                                    <Typography variant="body1">{selectedAlerte.zone_id?.nom || `Zone ${selectedAlerte.zone_id}`}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                                    <Typography variant="body1">{new Date(selectedAlerte.createdAt).toLocaleString()}</Typography>
                                </Grid>
                                {selectedAlerte.statut === 'NOUVELLE' && (
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Commentaire"
                                            multiline
                                            rows={3}
                                            value={commentaire}
                                            onChange={(e) => setCommentaire(e.target.value)}
                                            placeholder="Raison de l'escalade..."
                                            margin="normal"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
                    {selectedAlerte?.statut === 'NOUVELLE' && (
                        <Button 
                            onClick={handleEscalader} 
                            variant="contained" 
                            color="warning"
                        >
                            Escalader
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                ClickAwayListenerProps={{ onClickAway: () => setNotification({ ...notification, open: false }) }}
                PaperProps={{
                    sx: {
                        minWidth: 320,
                        maxWidth: 420,
                        borderRadius: 3,
                        p: 0,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.35)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, bgcolor: '#111827' }}>
                        {getNotificationIcon(notification.severity)}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>
                            {notification.severity === 'error' ? 'Attention' : notification.severity === 'warning' ? 'Avertissement' : notification.severity === 'success' ? 'Succès' : 'Info'}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: '#94a3b8' }}>
                            Maintenant
                        </Typography>
                    </Box>
                    <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                            {notification.message}
                        </Typography>
                    </Box>
                </Box>
            </Snackbar>
        </Layout>
    );
};

export default OperatorAlertes;