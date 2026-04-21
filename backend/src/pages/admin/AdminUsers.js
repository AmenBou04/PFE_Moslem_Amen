import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    PageHeader, DataTable, Modal, Field, Input, Select,
    Btn, Badge, ConfirmDialog, colors, toast, ToastContainer
} from '../../components/ui';

const EMPTY_FORM = { email: '', password: '', prenom: '', nom: '', role: 'OPERATEUR' };

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            toast.error('Impossible de charger les utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const validate = () => {
        const e = {};
        if (!formData.email) e.email = 'Email requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
        if (!editingUser && !formData.password) e.password = 'Mot de passe requis';
        if (!editingUser && formData.password?.length < 6) e.password = 'Minimum 6 caractères';
        if (!formData.prenom) e.prenom = 'Prénom requis';
        if (!formData.nom) e.nom = 'Nom requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (editingUser) {
                // Update: use _id
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.put(`/users/${editingUser._id}`, payload);
                toast.success('Utilisateur modifié avec succès');
            } else {
                // BUG FIX: was inverted — ADMIN goes to /admins, OPERATEUR goes to /operateurs
                const route = formData.role === 'ADMIN' ? '/users/admins' : '/users/operateurs';
                await api.post(route, formData);
                toast.success('Utilisateur créé avec succès');
            }
            fetchUsers();
            closeModal();
        } catch (e) {
            const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const user = confirmDelete;
        try {
            const route = user.role === 'ADMIN' ? `/users/admins/${user._id}` : `/users/operateurs/${user._id}`;
            await api.delete(route);
            toast.success('Utilisateur supprimé');
            fetchUsers();
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setConfirmDelete(null);
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({ email: user.email, password: '', prenom: user.prenom, nom: user.nom, role: user.role });
        setErrors({});
        setOpenModal(true);
    };

    const closeModal = () => {
        setOpenModal(false);
        setEditingUser(null);
        setFormData(EMPTY_FORM);
        setErrors({});
    };

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const columns = [
        {
            label: 'Utilisateur', key: 'email',
            render: row => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: row.role === 'ADMIN'
                            ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                        {`${(row.prenom || row.email || 'U')[0]}${(row.nom || '')[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ color: colors.text, fontSize: 13.5, fontWeight: 500 }}>{row.prenom} {row.nom}</div>
                        <div style={{ color: colors.textMuted, fontSize: 12 }}>{row.email}</div>
                    </div>
                </div>
            ),
        },
        {
            label: 'Rôle', key: 'role',
            render: row => <Badge
                label={row.role === 'ADMIN' ? '👑 Admin' : '👁 Opérateur'}
                color={row.role === 'ADMIN' ? 'amber' : 'blue'}
            />,
        },
        {
            label: 'Actions', key: '_id', width: 120,
            render: row => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="ghost" icon="✏" onClick={() => openEdit(row)}>Modifier</Btn>
                    <Btn size="sm" variant="danger" icon="🗑" onClick={() => setConfirmDelete(row)} />
                </div>
            ),
        },
    ];

    return (
        <Layout title="Gestion des Utilisateurs">
            <ToastContainer />
            <ConfirmDialog
                open={!!confirmDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer ${confirmDelete?.prenom} ${confirmDelete?.nom} ? Cette action est irréversible.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                danger
            />

            <PageHeader
                title="Utilisateurs"
                description={`${users.length} utilisateur${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`}
                action={
                    <Btn variant="primary" icon="+" onClick={() => { setEditingUser(null); setFormData(EMPTY_FORM); setErrors({}); setOpenModal(true); }}>
                        Nouvel utilisateur
                    </Btn>
                }
            />

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total', val: users.length, color: colors.purple },
                    { label: 'Admins', val: users.filter(u => u.role === 'ADMIN').length, color: colors.amber },
                    { label: 'Opérateurs', val: users.filter(u => u.role === 'OPERATEUR').length, color: colors.blue },
                ].map((s, i) => (
                    <div key={i} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{s.label}</span>
                        <span style={{ color: colors.text, fontWeight: 700, fontSize: 16 }}>{s.val}</span>
                    </div>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                emptyIcon="👤"
                emptyText="Aucun utilisateur trouvé"
                searchable={row => `${row.email} ${row.prenom} ${row.nom} ${row.role}`}
            />

            <Modal
                open={openModal}
                onClose={closeModal}
                title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                actions={
                    <>
                        <Btn variant="ghost" onClick={closeModal}>Annuler</Btn>
                        <Btn variant="primary" onClick={handleSubmit} loading={saving}>
                            {editingUser ? 'Enregistrer' : 'Créer'}
                        </Btn>
                    </>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    <Field label="Prénom" required error={errors.prenom} style={{ paddingRight: 8 }}>
                        <Input placeholder="Jean" value={formData.prenom} onChange={set('prenom')} />
                    </Field>
                    <Field label="Nom" required error={errors.nom} style={{ paddingLeft: 8 }}>
                        <Input placeholder="Dupont" value={formData.nom} onChange={set('nom')} />
                    </Field>
                </div>
                <Field label="Email" required error={errors.email}>
                    <Input type="email" placeholder="jean.dupont@exemple.com" value={formData.email} onChange={set('email')} />
                </Field>
                <Field label={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} required={!editingUser} error={errors.password}>
                    <Input type="password" placeholder={editingUser ? '••••••••' : 'Minimum 6 caractères'} value={formData.password} onChange={set('password')} />
                </Field>
                <Field label="Rôle">
                    <Select value={formData.role} onChange={set('role')}>
                        <option value="OPERATEUR">Opérateur</option>
                        <option value="ADMIN">Administrateur</option>
                    </Select>
                </Field>
                {formData.role === 'ADMIN' && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
                        <span style={{ color: '#fcd34d', fontSize: 12 }}>⚠ Les administrateurs ont accès complet à la plateforme.</span>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default AdminUsers;
