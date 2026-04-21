/* ════════════════════════════════════════════════════════════
   AdminZones.js
════════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { PageHeader, DataTable, Modal, Field, Input, Textarea, Btn, ConfirmDialog, colors, toast, ToastContainer } from '../../components/ui';

const EMPTY = { nom: '', description: '', localisation: '' };

export const AdminZones = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [errors, setErrors] = useState({});

    const fetch = async () => {
        try { setLoading(true); const r = await api.get('/zones'); setZones(r.data); }
        catch { toast.error('Erreur chargement zones'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const validate = () => {
        const e = {};
        if (!form.nom.trim()) e.nom = 'Nom requis';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (editing) { await api.put(`/zones/${editing._id || editing.id}`, form); toast.success('Zone modifiée'); }
            else { await api.post('/zones', form); toast.success('Zone créée'); }
            fetch(); closeModal();
        } catch (e) { toast.error(e.response?.data?.message || 'Erreur sauvegarde'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/zones/${confirmDelete._id || confirmDelete.id}`); toast.success('Zone supprimée'); fetch(); }
        catch { toast.error('Erreur suppression'); }
        finally { setConfirmDelete(null); }
    };

    const open = (z = null) => { setEditing(z); setForm(z ? { nom: z.nom, description: z.description, localisation: z.localisation } : EMPTY); setErrors({}); setOpenModal(true); };
    const closeModal = () => { setOpenModal(false); setEditing(null); setForm(EMPTY); setErrors({}); };
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const columns = [
        { label: 'Nom', render: z => <span style={{ color: colors.text, fontWeight: 500 }}>📍 {z.nom}</span> },
        { label: 'Description', render: z => <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{z.description || '—'}</span> },
        { label: 'Localisation', render: z => <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{z.localisation || '—'}</span> },
        { label: 'Actions', width: 120, render: z => (
            <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="ghost" icon="✏" onClick={() => open(z)}>Modifier</Btn>
                <Btn size="sm" variant="danger" icon="🗑" onClick={() => setConfirmDelete(z)} />
            </div>
        )},
    ];

    return (
        <Layout title="Gestion des Zones">
            <ToastContainer />
            <ConfirmDialog open={!!confirmDelete} title="Supprimer la zone" message={`Supprimer la zone "${confirmDelete?.nom}" ?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} danger />
            <PageHeader title="Zones" description={`${zones.length} zone${zones.length > 1 ? 's' : ''} configurée${zones.length > 1 ? 's' : ''}`} action={<Btn variant="primary" icon="+" onClick={() => open()}>Nouvelle zone</Btn>} />
            <DataTable columns={columns} data={zones} loading={loading} emptyIcon="🗺" emptyText="Aucune zone configurée" searchable={z => `${z.nom} ${z.localisation}`} />
            <Modal open={openModal} onClose={closeModal} title={editing ? 'Modifier la zone' : 'Nouvelle zone'} actions={<><Btn variant="ghost" onClick={closeModal}>Annuler</Btn><Btn variant="primary" onClick={handleSubmit} loading={saving}>{editing ? 'Enregistrer' : 'Créer'}</Btn></>}>
                <Field label="Nom" required error={errors.nom}><Input placeholder="Entrepôt Nord" value={form.nom} onChange={set('nom')} /></Field>
                <Field label="Localisation"><Input placeholder="Bâtiment A - Niveau 2" value={form.localisation} onChange={set('localisation')} /></Field>
                <Field label="Description"><Textarea placeholder="Description de la zone..." value={form.description} onChange={set('description')} /></Field>
            </Modal>
        </Layout>
    );
};

export default AdminZones;


/* ════════════════════════════════════════════════════════════
   AdminCameras.js  (separate export below)
════════════════════════════════════════════════════════════ */
