import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';  // ← Vérifie ce chemin
import { useAuth } from '../contexts/AuthContext';
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    TextField,
    Button,
    Grid,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useNavigate } from 'react-router-dom';
import { useUiFeedback } from '../contexts/UiFeedbackContext';

const ProfileSettings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { confirm } = useUiFeedback();
    const isAdminLike = user?.role === 'ADMIN';
    
    const [formData, setFormData] = useState({ prenom: '', nom: '' });
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                prenom: user.prenom || '',
                nom: user.nom || ''
            });
        }
    }, [user]);

    const handleCancelEdit = () => {
        setFormData({
            prenom: user?.prenom || '',
            nom: user?.nom || ''
        });
        setError('');
        setSuccess('');
        setEditMode(false);
    };

    // ✅ 2. MODIFIER LE PROFIL (PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!formData.prenom || !formData.nom) {
                setError('Le prénom et le nom sont requis');
                setLoading(false);
                return;
            }

            const hasChanged = formData.prenom !== user.prenom || formData.nom !== user.nom;
            if (!hasChanged) {
                setError('Aucune modification détectée');
                setLoading(false);
                return;
            }

            // ✅ PUT /api/account/me
            const response = await api.put('/account/me', {
                prenom: formData.prenom,
                nom: formData.nom
            });

            console.log('✅ Réponse:', response.data);

            const updatedUser = {
                ...user,
                prenom: response.data.prenom,
                nom: response.data.nom
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            window.location.reload();

            setSuccess('Profil mis à jour avec succès !');
            setTimeout(() => setSuccess(''), 3000);

        } catch (error) {
            console.error('❌ Erreur:', error);
            setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    // ✅ 4. SUPPRIMER LE COMPTE (DELETE)
    const handleDeleteAccount = async () => {
        const confirmDelete = await confirm({
            title: 'Supprimer votre compte ?',
            message: 'Cette action est irreversible et supprimera definitivement vos donnees.',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'danger'
        });
        if (!confirmDelete) return;

        setDeleteLoading(true);
        setError('');

        try {
            // ✅ DELETE /api/account/me
            await api.delete('/account/me');
            
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            logout();
            navigate('/login');
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError(error.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Layout title="Paramètres du profil">
            <Grid container spacing={3} maxWidth="md">
                {/* Vue du profil */}
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 4, boxShadow: 6, overflow: 'hidden' }}>
                        <CardContent>
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ width: 70, height: 70, bgcolor: 'primary.main' }}>
                                        <PersonOutlineIcon sx={{ fontSize: 36 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>Mon profil</Typography>
                                        <Typography variant="body2" color="text.secondary">Visualisez votre compte et utilisez les actions ci-dessous pour modifier ou supprimer.</Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Button startIcon={<EditIcon />} variant="contained" onClick={() => setEditMode(true)}>Modifier</Button>
                                    <Button startIcon={<DeleteOutlineIcon />} variant="outlined" color="error" disabled={deleteLoading} onClick={handleDeleteAccount}>
                                        {deleteLoading ? <CircularProgress size={24} /> : 'Supprimer'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                        <Divider />
                        <CardContent sx={{ bgcolor: 'background.default' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Prénom</Typography>
                                    <Typography variant="body1" fontSize={16} fontWeight={600}>{user?.prenom || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nom</Typography>
                                    <Typography variant="body1" fontSize={16} fontWeight={600}>{user?.nom || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                                    <Typography variant="body1" fontSize={16} fontWeight={600}>{user?.email || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Rôle</Typography>
                                    <Chip label={isAdminLike ? 'Administrateur' : 'Opérateur'} color={isAdminLike ? 'primary' : 'default'} />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {editMode && (
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 4, boxShadow: 4 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>Modifier mon profil</Typography>
                                        <Typography variant="body2" color="text.secondary">Mettez à jour votre prénom et nom.</Typography>
                                    </Box>
                                </Stack>
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                                <Box component="form" onSubmit={handleSubmit}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth label="Prénom" name="prenom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} required />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth label="Nom" name="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 3, p: 3, bgcolor: '#f7f8fc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                        <Typography variant="body1" fontWeight={600}>{user?.email || '-'}</Typography>
                                        <Typography variant="caption" color="text.secondary">L'email ne peut pas être modifié ici.</Typography>
                                    </Box>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                                        <Button type="submit" variant="contained" size="large" disabled={loading}>
                                            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
                                        </Button>
                                        <Button variant="outlined" size="large" onClick={handleCancelEdit}>Annuler</Button>
                                    </Stack>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Layout>
    );
};

export default ProfileSettings;