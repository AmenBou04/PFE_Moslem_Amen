import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Typography
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { useUiFeedback } from '../../contexts/UiFeedbackContext';

const AdminAlertes = () => {
    const [alertes, setAlertes] = useState([]);
    const { confirm, notify } = useUiFeedback();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAlerte, setEditingAlerte] = useState(null);
    const [seuils, setSeuils] = useState({
        critique: 90,
        elevee: 70,
        moyenne: 50,
        faible: 25
    });
    const [seuilsLoading, setSeuilsLoading] = useState(true);
    const [savingSeuils, setSavingSeuils] = useState(false);
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        type: '',
        severity: '',
        cameraId: ''
    });

    const getSeverityValue = (alerte) => alerte?.severity || alerte?.gravite || 'MOYENNE';

    const getSeverityLabel = (value) => {
        switch (value) {
            case 'CRITIQUE':
                return 'Critique';
            case 'ELEVEE':
            case 'HIGH':
                return 'Élevée';
            case 'MEDIUM':
            case 'MOYENNE':
                return 'Moyenne';
            case 'LOW':
            case 'FAIBLE':
                return 'Faible';
            default:
                return value || 'Moyenne';
        }
    };

    const getSeverityChipProps = (value) => {
        switch (value) {
            case 'CRITIQUE':
            case 'ELEVEE':
            case 'HIGH':
                return { color: 'error', variant: 'filled' };
            case 'MEDIUM':
            case 'MOYENNE':
                return { color: 'warning', variant: 'filled' };
            case 'LOW':
            case 'FAIBLE':
            default:
                return { color: 'info', variant: 'outlined' };
        }
    };

    const lightCardFieldSx = {
        '& .MuiInputLabel-root': {
            color: '#475569'
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: '#0f172a'
        },
        '& .MuiFormHelperText-root': {
            color: '#64748b'
        },
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff'
        }
    };

    const fetchAlertes = useCallback(async () => {
        try {
            const response = await api.get('/alertes');
            setAlertes(response.data);
        } catch (error) {
            console.error('Erreur chargement alertes:', error);
        }
    }, []);

    const fetchSeuils = useCallback(async () => {
        try {
            const response = await api.get('/alertes/seuils');
            const data = response.data || {};

            setSeuils({
                critique: Number(data.critique ?? data.seuilCritique ?? 90),
                elevee: Number(data.elevee ?? data.seuilElevee ?? 70),
                moyenne: Number(data.moyenne ?? data.seuilMoyenne ?? 50),
                faible: Number(data.faible ?? data.seuilFaible ?? 25)
            });
        } catch (error) {
            console.error('Erreur chargement seuils:', error);
            notify({
                type: 'warning',
                message: 'Impossible de charger les seuils d\'alerte. Les valeurs par défaut sont affichées.'
            });
        } finally {
            setSeuilsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        fetchAlertes();
        fetchSeuils();
    }, [fetchAlertes, fetchSeuils]);

    const handleSeuilChange = (key) => (event) => {
        const value = event.target.value;
        setSeuils((previous) => ({
            ...previous,
            [key]: value === '' ? '' : Number(value)
        }));
    };

    const validateSeuils = () => {
        const values = [seuils.critique, seuils.elevee, seuils.moyenne, seuils.faible];
        if (values.some((value) => value === '' || Number.isNaN(Number(value)))) {
            notify({
                type: 'error',
                message: 'Tous les seuils doivent être renseignés.'
            });
            return false;
        }

        if (!(Number(seuils.critique) > Number(seuils.elevee) && Number(seuils.elevee) > Number(seuils.moyenne) && Number(seuils.moyenne) > Number(seuils.faible))) {
            notify({
                type: 'error',
                message: 'L\'ordre attendu est : Critique > Élevée > Moyenne > Faible.'
            });
            return false;
        }

        return true;
    };

    const handleSaveSeuils = async () => {
        if (!validateSeuils()) {
            return;
        }

        setSavingSeuils(true);
        try {
            await api.put('/alertes/seuils', seuils);
            notify({
                type: 'success',
                message: 'Seuils d\'alerte mis à jour avec succès.'
            });
        } catch (error) {
            console.error('Erreur sauvegarde seuils:', error);
            notify({
                type: 'error',
                message: 'Impossible de sauvegarder les seuils d\'alerte.'
            });
        } finally {
            setSavingSeuils(false);
        }
    };

    const handleOpenDialog = (alerte = null) => {
        setEditingAlerte(alerte);
        setFormData(alerte ? {
            titre: alerte.titre,
            description: alerte.description,
            type: alerte.type,
            severity: getSeverityValue(alerte),
            cameraId: alerte.cameraId
        } : {
            titre: '',
            description: '',
            type: '',
            severity: 'MOYENNE',
            cameraId: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAlerte(null);
    };

    const handleSubmit = async () => {
        try {
            const alerteId = editingAlerte?._id || editingAlerte?.id;
            const payload = {
                ...formData,
                gravite: formData.severity || 'MOYENNE'
            };
            if (editingAlerte) {
                await api.put(`/alertes/${alerteId}`, payload);
            } else {
                await api.post('/alertes', payload);
            }
            fetchAlertes();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur sauvegarde alerte:', error);
        }
    };

    const handleDelete = async (id) => {
        const shouldDelete = await confirm({
            title: 'Supprimer cette alerte ?',
            message: 'Cette alerte sera supprimee definitivement.',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            await api.delete(`/alertes/${id}`);
            notify({ type: 'success', message: 'Alerte supprimee avec succes.' });
            fetchAlertes();
        } catch (error) {
            console.error('Erreur suppression alerte:', error);
            notify({ type: 'error', message: 'Erreur lors de la suppression de l alerte.' });
        }
    };

    return (
        <Layout title="Gestion des Alertes">
            <Card sx={{ mb: 3, borderRadius: 3, bgcolor: '#f8fbff', color: '#0f172a' }}>
                <CardContent sx={{ color: '#0f172a' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Seuils d'alerte</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Ajustez ici les seuils utilisés pour classer automatiquement les alertes.
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleSaveSeuils}
                            disabled={seuilsLoading || savingSeuils}
                        >
                            {savingSeuils ? 'Enregistrement...' : 'Enregistrer les seuils'}
                        </Button>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Seuil critique"
                                type="number"
                                value={seuils.critique}
                                onChange={handleSeuilChange('critique')}
                                disabled={seuilsLoading || savingSeuils}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Valeur la plus élevée"
                                sx={lightCardFieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Seuil élevé"
                                type="number"
                                value={seuils.elevee}
                                onChange={handleSeuilChange('elevee')}
                                disabled={seuilsLoading || savingSeuils}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Doit rester inférieur au critique"
                                sx={lightCardFieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Seuil moyen"
                                type="number"
                                value={seuils.moyenne}
                                onChange={handleSeuilChange('moyenne')}
                                disabled={seuilsLoading || savingSeuils}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Doit rester entre élevé et faible"
                                sx={lightCardFieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Seuil faible"
                                type="number"
                                value={seuils.faible}
                                onChange={handleSeuilChange('faible')}
                                disabled={seuilsLoading || savingSeuils}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Valeur la plus basse"
                                sx={lightCardFieldSx}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 16 }}>
                    <Typography variant="h5">Gestion des Alertes</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Ajouter Alerte
                    </Button>
                </div>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Titre</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Sévérité</TableCell>
                                <TableCell>Caméra ID</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {alertes.map((alerte) => {
                                const alerteId = alerte._id || alerte.id;
                                const severity = getSeverityValue(alerte);
                                const chipProps = getSeverityChipProps(severity);
                                return (
                                    <TableRow key={alerteId}>
                                        <TableCell>{alerteId}</TableCell>
                                        <TableCell>{alerte.titre}</TableCell>
                                        <TableCell>{alerte.description}</TableCell>
                                        <TableCell>{alerte.type}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getSeverityLabel(severity)}
                                                color={chipProps.color}
                                                variant={chipProps.variant}
                                                sx={{
                                                    color: severity === 'MOYENNE' || severity === 'MEDIUM' ? '#1f2937' : undefined,
                                                    bgcolor: severity === 'MOYENNE' || severity === 'MEDIUM' ? '#fef3c7' : undefined,
                                                    borderColor: severity === 'MOYENNE' || severity === 'MEDIUM' ? '#fcd34d' : undefined
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{alerte.cameraId}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenDialog(alerte)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(alerteId)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={openDialog} onClose={handleCloseDialog}>
                    <DialogTitle>{editingAlerte ? 'Modifier Alerte' : 'Ajouter Alerte'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Titre"
                            fullWidth
                            value={formData.titre}
                            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Type"
                            fullWidth
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Sévérité"
                            fullWidth
                            select
                            value={formData.severity}
                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                        >
                            <option value="LOW">Faible</option>
                            <option value="MEDIUM">Moyenne</option>
                            <option value="HIGH">Élevée</option>
                        </TextField>
                        <TextField
                            margin="dense"
                            label="Caméra ID"
                            fullWidth
                            value={formData.cameraId}
                            onChange={(e) => setFormData({ ...formData, cameraId: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {editingAlerte ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
};

export default AdminAlertes;