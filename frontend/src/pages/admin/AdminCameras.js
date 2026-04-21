import React, { useState, useEffect } from 'react';
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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Typography
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { useUiFeedback } from '../../contexts/UiFeedbackContext';

const AdminCameras = () => {
    const [cameras, setCameras] = useState([]);
    const [zones, setZones] = useState([]);
    const { confirm, notify } = useUiFeedback();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCamera, setEditingCamera] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        zone_id: '',
        adresse_ip: ''
    });

    useEffect(() => {
        fetchCameras();
        fetchZones();
    }, []);

    const fetchCameras = async () => {
        try {
            const response = await api.get('/cameras');
            setCameras(response.data);
        } catch (error) {
            console.error('Erreur chargement caméras:', error);
        }
    };

    const fetchZones = async () => {
        try {
            const response = await api.get('/zones');
            setZones(response.data || []);
        } catch (error) {
            console.error('Erreur chargement zones:', error);
        }
    };

    const handleOpenDialog = (camera = null) => {
        setEditingCamera(camera);
        setFormData(camera ? {
            nom: camera.nom,
            description: camera.description || '',
            zone_id: camera.zone_id?._id || camera.zone_id || '',
            adresse_ip: camera.adresse_ip || camera.ipAddress || ''
        } : {
            nom: '',
            description: '',
            zone_id: '',
            adresse_ip: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCamera(null);
    };

    const handleSubmit = async () => {
        try {
            const cameraId = editingCamera?._id || editingCamera?.id;
            if (editingCamera) {
                await api.put(`/cameras/${cameraId}`, formData);
            } else {
                await api.post('/cameras', formData);
            }
            fetchCameras();
            handleCloseDialog();
            notify({ type: 'success', message: `Camera ${editingCamera ? 'modifiee' : 'ajoutee'} avec succes.` });
        } catch (error) {
            console.error('Erreur sauvegarde caméra:', error);
            notify({ type: 'error', message: 'Erreur lors de la sauvegarde de la camera.' });
        }
    };

    const handleDelete = async (id) => {
        const shouldDelete = await confirm({
            title: 'Supprimer cette camera ?',
            message: 'Cette camera sera supprimee definitivement.',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            await api.delete(`/cameras/${id}`);
            notify({ type: 'success', message: 'Camera supprimee avec succes.' });
            fetchCameras();
        } catch (error) {
            console.error('Erreur suppression caméra:', error);
            notify({ type: 'error', message: 'Erreur lors de la suppression de la camera.' });
        }
    };

    return (
        <Layout title="Gestion des Caméras">
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 16 }}>
                    <Typography variant="h5">Gestion des Caméras</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Ajouter Caméra
                    </Button>
                </div>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Zone</TableCell>
                                <TableCell>Adresse IP</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cameras.map((camera) => {
                                const cameraId = camera._id || camera.id;
                                return (
                                    <TableRow key={cameraId}>
                                        <TableCell>{cameraId}</TableCell>
                                        <TableCell>{camera.nom}</TableCell>
                                        <TableCell>{camera.description}</TableCell>
                                        <TableCell>{camera.zone_id?.nom || 'Non assignee'}</TableCell>
                                        <TableCell>{camera.adresse_ip || camera.ipAddress || 'Non renseignee'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenDialog(camera)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(cameraId)}>
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
                    <DialogTitle>{editingCamera ? 'Modifier Caméra' : 'Ajouter Caméra'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Nom"
                            fullWidth
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                            label="Zone"
                            fullWidth
                            select
                            value={formData.zone_id}
                            onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                        >
                            <MenuItem value="">Aucune</MenuItem>
                            {zones.map((zone) => (
                                <MenuItem key={zone._id || zone.id} value={zone._id || zone.id}>
                                    {zone.nom}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            margin="dense"
                            label="Adresse IP"
                            fullWidth
                            value={formData.adresse_ip}
                            onChange={(e) => setFormData({ ...formData, adresse_ip: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {editingCamera ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
};

export default AdminCameras;