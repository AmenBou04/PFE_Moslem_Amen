import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const typeOptions = ['ALL', 'INTRUSION', 'ANOMALIE', 'CHUTE', 'FOULE', 'EQUIPEMENT'];

const severityConfig = {
    CRITIQUE: { label: 'Critique', color: '#dc2626', bg: '#fee2e2' },
    ELEVEE: { label: 'Élevée', color: '#c2410c', bg: '#ffedd5' },
    MOYENNE: { label: 'Moyenne', color: '#1d4ed8', bg: '#dbeafe' },
    FAIBLE: { label: 'Faible', color: '#047857', bg: '#d1fae5' }
};

const filterFieldSx = {
    '& .MuiInputLabel-root': {
        color: '#b8d8ff'
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#22b7ff'
    },
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        color: '#f8fafc',
        '& fieldset': {
            borderColor: 'rgba(184, 216, 255, 0.22)'
        },
        '&:hover fieldset': {
            borderColor: 'rgba(34, 183, 255, 0.45)'
        },
        '&.Mui-focused fieldset': {
            borderColor: '#22b7ff'
        }
    },
    '& .MuiSvgIcon-root': {
        color: '#b8d8ff'
    }
};

const OperatorHistorique = () => {
    const [alertes, setAlertes] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        zone_id: 'ALL',
        type: 'ALL',
        dateFrom: '',
        dateTo: ''
    });

    const fetchZones = async () => {
        try {
            const response = await api.get('/zones');
            setZones(response.data || []);
        } catch (error) {
            console.error('Erreur chargement zones:', error);
        }
    };

    const fetchAlertes = async (overrideFilters = filters) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (overrideFilters.zone_id && overrideFilters.zone_id !== 'ALL') params.set('zone_id', overrideFilters.zone_id);
            if (overrideFilters.type && overrideFilters.type !== 'ALL') params.set('type', overrideFilters.type);
            if (overrideFilters.dateFrom) params.set('dateFrom', overrideFilters.dateFrom);
            if (overrideFilters.dateTo) params.set('dateTo', overrideFilters.dateTo);
            params.set('limit', '200');

            const response = await api.get(`/alertes?${params.toString()}`);
            setAlertes(response.data || []);
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
        fetchAlertes();
    }, []);

    const handleChange = (field) => (event) => {
        setFilters((previous) => ({ ...previous, [field]: event.target.value }));
    };

    const handleSearch = () => {
        fetchAlertes();
    };

    const handleReset = () => {
        const defaultFilters = { zone_id: 'ALL', type: 'ALL', dateFrom: '', dateTo: '' };
        setFilters(defaultFilters);
        fetchAlertes(defaultFilters);
    };

    const stats = useMemo(() => {
        const total = alertes.length;
        const critiques = alertes.filter((alerte) => alerte.gravite === 'CRITIQUE').length;
        const elevees = alertes.filter((alerte) => alerte.gravite === 'ELEVEE').length;
        const anomalies = alertes.filter((alerte) => alerte.type === 'ANOMALIE').length;
        return { total, critiques, elevees, anomalies };
    }, [alertes]);

    const getSeverityBadge = (gravite) => {
        const config = severityConfig[gravite] || severityConfig.MOYENNE;
        return (
            <Chip
                label={config.label}
                size="small"
                sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 700 }}
            />
        );
    };

    return (
        <Layout title="Historique des événements">
            <Card sx={{ mb: 3, borderRadius: 3, bgcolor: 'rgba(7, 16, 31, 0.92)', color: '#f8fafc', border: '1px solid rgba(132, 196, 255, 0.14)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                                Analyse des incidents passés
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#b8d8ff' }}>
                                Filtre par zone, type d&apos;alerte et intervalle de dates.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ borderColor: 'rgba(184, 216, 255, 0.3)', color: '#f8fafc' }}>
                                Réinitialiser
                            </Button>
                            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
                                Rechercher
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#0f172a', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h4">{stats.total}</Typography>
                                    <Typography variant="body2">Résultats</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#dc2626', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h4">{stats.critiques}</Typography>
                                    <Typography variant="body2">Critiques</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#f97316', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h4">{stats.elevees}</Typography>
                                    <Typography variant="body2">Élevées</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#2563eb', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h4">{stats.anomalies}</Typography>
                                    <Typography variant="body2">Anomalies</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Zone"
                                value={filters.zone_id}
                                onChange={handleChange('zone_id')}
                                sx={filterFieldSx}
                            >
                                <MenuItem value="ALL">Toutes les zones</MenuItem>
                                {zones.map((zone) => (
                                    <MenuItem key={zone._id || zone.id} value={zone._id || zone.id}>
                                        {zone.nom || zone.name || 'Zone'}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Type d'alerte"
                                value={filters.type}
                                onChange={handleChange('type')}
                                sx={filterFieldSx}
                            >
                                {typeOptions.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type === 'ALL' ? 'Tous les types' : type}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date début"
                                value={filters.dateFrom}
                                onChange={handleChange('dateFrom')}
                                InputLabelProps={{ shrink: true }}
                                sx={filterFieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date fin"
                                value={filters.dateTo}
                                onChange={handleChange('dateTo')}
                                InputLabelProps={{ shrink: true }}
                                sx={filterFieldSx}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Sévérité</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Zone</TableCell>
                            <TableCell>Statut</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!loading && alertes.map((alerte) => (
                            <TableRow key={alerte._id} hover>
                                <TableCell>{alerte.createdAt ? new Date(alerte.createdAt).toLocaleString('fr-FR') : '—'}</TableCell>
                                <TableCell>{alerte.type || '—'}</TableCell>
                                <TableCell>{getSeverityBadge(alerte.gravite)}</TableCell>
                                <TableCell sx={{ maxWidth: 320 }}>{alerte.description || '—'}</TableCell>
                                <TableCell>{alerte.zone_id?.nom || alerte.zone_id || '—'}</TableCell>
                                <TableCell>{alerte.statut || '—'}</TableCell>
                            </TableRow>
                        ))}
                        {!loading && alertes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    Aucun incident trouvé pour ces critères.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Layout>
    );
};

export default OperatorHistorique;