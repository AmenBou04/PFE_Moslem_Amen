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

const AdminZones = () => {
    const [zones, setZones] = useState([]);
    const { confirm, notify } = useUiFeedback();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        localisation: ''
    });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const response = await api.get('/zones');
            setZones(response.data);
        } catch (error) {
            console.error('Erreur chargement zones:', error);
        }
    };

    const handleOpenDialog = (zone = null) => {
        setEditingZone(zone);
        setFormData(zone ? {
            nom: zone.nom,
            description: zone.description,
            localisation: zone.localisation
        } : {
            nom: '',
            description: '',
            localisation: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingZone(null);
    };

    const handleSubmit = async () => {
        try {
            const zoneId = editingZone?._id || editingZone?.id;
            if (editingZone) {
                await api.put(`/zones/${zoneId}`, formData);
            } else {
                await api.post('/zones', formData);
            }
            fetchZones();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur sauvegarde zone:', error);
        }
    };

    const handleDelete = async (id) => {
        const shouldDelete = await confirm({
            title: 'Supprimer cette zone ?',
            message: 'Cette zone sera supprimee definitivement.',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            await api.delete(`/zones/${id}`);
            notify({ type: 'success', message: 'Zone supprimee avec succes.' });
            fetchZones();
        } catch (error) {
            console.error('Erreur suppression zone:', error);
            notify({ type: 'error', message: 'Erreur lors de la suppression de la zone.' });
        }
    };

    return (
        <Layout title="Gestion des Zones">
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 16 }}>
                    <Typography variant="h5">Gestion des Zones</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Ajouter Zone
                    </Button>
                </div>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Localisation</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {zones.map((zone) => {
                                const zoneId = zone._id || zone.id;
                                return (
                                    <TableRow key={zoneId}>
                                        <TableCell>{zoneId}</TableCell>
                                        <TableCell>{zone.nom}</TableCell>
                                        <TableCell>{zone.description}</TableCell>
                                        <TableCell>{zone.localisation}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenDialog(zone)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(zoneId)}>
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
                    <DialogTitle>{editingZone ? 'Modifier Zone' : 'Ajouter Zone'}</DialogTitle>
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
                            label="Localisation"
                            fullWidth
                            value={formData.localisation}
                            onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {editingZone ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
};

export default AdminZones;