import React, { useState, useEffect, useCallback } from 'react';
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
    IconButton
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { useUiFeedback } from '../../contexts/UiFeedbackContext';
import { useAuth } from '../../contexts/AuthContext';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const { confirm, notify } = useUiFeedback();
    const { user } = useAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        prenom: '',
        nom: '',
        role: 'OPERATEUR'
    });

    const canManageAdmins = user?.role === 'ADMIN';
    const isAdminRole = (role) => (role || '').toUpperCase() === 'ADMIN';
    const visibleUsers = users;

    const normalizeUser = (user) => ({
        ...user,
        prenom:
            user?.prenom ||
            user?.Prenom ||
            user?.firstName ||
            user?.firstname ||
            user?.first_name ||
            user?.givenName ||
            user?.profile?.prenom ||
            user?.profile?.firstName ||
            '',
        nom:
            user?.nom ||
            user?.Nom ||
            user?.lastName ||
            user?.lastname ||
            user?.last_name ||
            user?.familyName ||
            user?.profile?.nom ||
            user?.profile?.lastName ||
            ''
    });

    const fetchUsers = useCallback(async () => {
        const response = await api.get('/users');
        const rawUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(rawUsers.map(normalizeUser));
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', prenom: '', nom: '', role: 'OPERATEUR' });
    };

    const handleOpenCreate = () => {
        resetForm();
        setOpenDialog(true);
    };

    const getUserId = (user) => user?._id || user?.id;

    const getRolePath = (role) => {
        const normalizedRole = (role || 'OPERATEUR').toUpperCase();
        return normalizedRole === 'ADMIN' ? 'admins' : 'operateurs';
    };

    const handleSubmit = async () => {
        try {
            const isEditing = Boolean(editingUser);
            const selectedRole = (formData.role || 'OPERATEUR').toUpperCase();

            if (!canManageAdmins && selectedRole === 'ADMIN') {
                notify({ type: 'error', message: 'Seul un administrateur peut créer un admin.' });
                return;
            }

            const missingRequired = isEditing
                ? (!formData.email || !formData.prenom || !formData.nom)
                : (!formData.email || !formData.password || !formData.prenom || !formData.nom);

            if (missingRequired) {
                notify({ type: 'warning', message: 'Tous les champs requis doivent etre remplis.' });
                return;
            }

            const payload = {
                email: formData.email,
                prenom: formData.prenom || '',
                nom: formData.nom || '',
                firstName: formData.prenom || '',
                lastName: formData.nom || '',
                first_name: formData.prenom || '',
                last_name: formData.nom || '',
                givenName: formData.prenom || '',
                familyName: formData.nom || '',
                role: selectedRole
            };

            // On edit, password is optional. Send it only when user typed a new one.
            if (formData.password?.trim()) {
                payload.password = formData.password;
            }

            console.log('📤 Envoi des données:', payload);

            if (isEditing) {
                const userId = getUserId(editingUser);

                if (!userId) {
                    notify({ type: 'error', message: 'ID utilisateur introuvable.' });
                    return;
                }

                try {
                    await api.put(`/users/${userId}`, payload);
                } catch (updateError) {
                    const targetRolePath = getRolePath(formData.role);
                    await api.put(`/users/${targetRolePath}/${userId}`, payload);
                }

                notify({ type: 'success', message: 'Utilisateur modifie avec succes.' });
            } else {
                if (selectedRole === 'ADMIN') {
                    const response = await api.post('/users/admins', {
                        ...payload,
                        password: formData.password
                    });
                    console.log('✅ Réponse:', response.data);
                } else {
                    const response = await api.post('/users/operateurs', {
                        ...payload,
                        password: formData.password
                    });
                    console.log('✅ Réponse:', response.data);
                }

                notify({ type: 'success', message: 'Utilisateur ajoute avec succes.' });
            }

            fetchUsers();
            setOpenDialog(false);
            resetForm();
        } catch (error) {
            console.error('❌ Erreur détaillée:', error.response?.data || error.message);
            const backendMessage = error.response?.data?.message || error.response?.data?.error;
            notify({
                type: 'error',
                message: backendMessage || `Erreur lors de la sauvegarde (${error.response?.status || 'reseau'}).`
            });
        }
    };
    const handleDelete = async (id) => {
        const shouldDelete = await confirm({
            title: 'Supprimer cet utilisateur ?',
            message: 'Cette action est irreversible.',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        const user = users.find((u) => getUserId(u) === id);
        const isAdminTarget = isAdminRole(user?.role);

        if (isAdminTarget) {
            notify({ type: 'error', message: 'La modification ou suppression d\'un admin est interdite.' });
            return;
        }

        try {
            await api.delete(`/users/operateurs/${id}`);

            notify({ type: 'success', message: 'Utilisateur supprime avec succes.' });
            fetchUsers();
        } catch (error) {
            notify({ type: 'error', message: error.response?.data?.message || 'Erreur lors de la suppression.' });
        }
    };

    const handleEdit = (user) => {
        const normalizedUser = normalizeUser(user);
        setEditingUser(user);
        setFormData({
            email: normalizedUser.email,
            password: '',
            prenom: normalizedUser.prenom,
            nom: normalizedUser.nom,
            role: normalizedUser.role
        });
        setOpenDialog(true);
    };

    return (
        <Layout title="Gestion des Utilisateurs">
            <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenCreate}
                sx={{ mb: 2 }}
            >
                Ajouter un utilisateur
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Prénom</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleUsers.map((user) => (
                            <TableRow key={getUserId(user)}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.nom || '-'}</TableCell>
                                <TableCell>{user.prenom || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role}
                                        color={isAdminRole(user.role) ? 'error' : 'primary'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {!isAdminRole(user.role) && (
                                        <IconButton onClick={() => handleEdit(user)}>
                                            <Edit />
                                        </IconButton>
                                    )}
                                    {!isAdminRole(user.role) && (
                                        <IconButton onClick={() => handleDelete(getUserId(user))}>
                                            <Delete />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }}>
                <DialogTitle>{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        margin="dense"
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Mot de passe"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        margin="dense"
                    />
                    <TextField
                        fullWidth
                        label="Prénom"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        margin="dense"
                    />
                    <TextField
                        fullWidth
                        label="Nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        margin="dense"
                    />
                    <TextField
                        fullWidth
                        select
                        label="Rôle"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        margin="dense"
                        SelectProps={{ native: true }}
                    >
                        {canManageAdmins && <option value="ADMIN">Admin</option>}
                        <option value="OPERATEUR">Opérateur</option>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenDialog(false); resetForm(); }}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">Valider</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default AdminUsers;