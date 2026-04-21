import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { PageHeader, DataTable, Modal, Field, Input, Textarea, Select, Btn, Badge, ConfirmDialog, colors, toast, ToastContainer } from '../../components/ui';

const EMPTY = { nom: '', description: '', zoneId: '', ipAddress: '' };

const AdminCameras = () => {
    const [cameras, setCameras] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [errors, setErrors] = useState({});

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [cam, zon] = await Promise.allSettled([api.get('/cameras'), api.get('/zones')]);
            if (cam.status === 'fulfilled') setCameras(cam.value.data);
            if (zon.status === 'fulfilled') setZones(zon.value.data);
        } catch { toast.error('Erreur chargement'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const validate = () => {
        const e = {};
        if (!form.nom.trim()) e.nom = 'Nom requis';
        if (form.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(form.ipAddress)) e.ipAddress = 'Adresse IP invalide';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (editing) { await api.put(`/cameras/${editing._id || editing.id}`, form); toast.success('Caméra modifiée'); }
            else { await api.post('/cameras', form); toast.success('Caméra ajoutée'); }
            fetchAll(); closeModal();
        } catch (e) { toast.error(e.response?.data?.message || 'Erreur sauvegarde'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/cameras/${confirmDelete._id || confirmDelete.id}`); toast.success('Caméra supprimée'); fetchAll(); }
        catch { toast.error('Erreur suppression'); }
        finally { setConfirmDelete(null); }
    };

    const open = (c = null) => {
        setEditing(c);
        setForm(c ? { nom: c.nom, description: c.description, zoneId: c.zoneId || '', ipAddress: c.ipAddress || '' } : EMPTY);
        setErrors({}); setOpenModal(true);
    };
    const closeModal = () => { setOpenModal(false); setEditing(null); setForm(EMPTY); setErrors({}); };
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const getZoneName = (zoneId) => zones.find(z => (z._id || z.id) === zoneId)?.nom || zoneId || '—';

    const columns = [
        {
            label: 'Caméra',
            render: c => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📹</div>
                    <div>
                        <div style={{ color: colors.text, fontSize: 13.5, fontWeight: 500 }}>{c.nom}</div>
                        <div style={{ color: colors.textMuted, fontSize: 12 }}>{c.ipAddress || 'IP non définie'}</div>
                    </div>
                </div>
            ),
        },
        { label: 'Description', render: c => <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{c.description || '—'}</span> },
        { label: 'Zone', render: c => <Badge label={getZoneName(c.zoneId)} color="blue" /> },
        {
            label: 'Actions', width: 120,
            render: c => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="ghost" icon="✏" onClick={() => open(c)}>Modifier</Btn>
                    <Btn size="sm" variant="danger" icon="🗑" onClick={() => setConfirmDelete(c)} />
                </div>
            ),
        },
    ];

    return (
        <Layout title="Gestion des Caméras">
            <ToastContainer />
            <ConfirmDialog open={!!confirmDelete} title="Supprimer la caméra" message={`Supprimer la caméra "${confirmDelete?.nom}" ?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} danger />

            <PageHeader
                title="Caméras"
                description={`${cameras.length} caméra${cameras.length > 1 ? 's' : ''} configurée${cameras.length > 1 ? 's' : ''}`}
                action={<Btn variant="primary" icon="+" onClick={() => open()}>Ajouter caméra</Btn>}
            />

            <DataTable
                columns={columns}
                data={cameras}
                loading={loading}
                emptyIcon="📹"
                emptyText="Aucune caméra configurée"
                searchable={c => `${c.nom} ${c.ipAddress} ${getZoneName(c.zoneId)}`}
            />

            <Modal
                open={openModal}
                onClose={closeModal}
                title={editing ? 'Modifier la caméra' : 'Ajouter une caméra'}
                actions={
                    <>
                        <Btn variant="ghost" onClick={closeModal}>Annuler</Btn>
                        <Btn variant="primary" onClick={handleSubmit} loading={saving}>{editing ? 'Enregistrer' : 'Ajouter'}</Btn>
                    </>
                }
            >
                <Field label="Nom de la caméra" required error={errors.nom}>
                    <Input placeholder="CAM-01 Entrée Nord" value={form.nom} onChange={set('nom')} />
                </Field>
                <Field label="Adresse IP" error={errors.ipAddress}>
                    <Input placeholder="192.168.1.100" value={form.ipAddress} onChange={set('ipAddress')} />
                </Field>
                <Field label="Zone">
                    <Select value={form.zoneId} onChange={set('zoneId')}>
                        <option value="">— Aucune zone —</option>
                        {zones.map(z => (
                            <option key={z._id || z.id} value={z._id || z.id}>{z.nom}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Description">
                    <Textarea placeholder="Localisation et notes..." value={form.description} onChange={set('description')} />
                </Field>
            </Modal>
        </Layout>
    );
};

export default AdminCameras;
