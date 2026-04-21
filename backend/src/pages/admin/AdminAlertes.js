import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    PageHeader, DataTable, Modal, Field, Input, Textarea, Select,
    Btn, Badge, ConfirmDialog, colors, toast, ToastContainer,
    getSeverityBadge, getStatusBadge
} from '../../components/ui';

const EMPTY = { titre: '', description: '', type: '', severity: 'LOW', cameraId: '' };

const AdminAlertes = () => {
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [filterSev, setFilterSev] = useState('ALL');

    const fetch = async () => {
        try { setLoading(true); const r = await api.get('/alertes'); setAlertes(r.data); }
        catch { toast.error('Erreur chargement alertes'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const handleSubmit = async () => {
        if (!form.titre.trim()) { toast.error('Le titre est requis'); return; }
        setSaving(true);
        try {
            if (editing) { await api.put(`/alertes/${editing._id || editing.id}`, form); toast.success('Alerte modifiée'); }
            else { await api.post('/alertes', form); toast.success('Alerte créée'); }
            fetch(); closeModal();
        } catch (e) { toast.error(e.response?.data?.message || 'Erreur sauvegarde'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/alertes/${confirmDelete._id || confirmDelete.id}`); toast.success('Alerte supprimée'); fetch(); }
        catch { toast.error('Erreur suppression'); }
        finally { setConfirmDelete(null); }
    };

    const open = (a = null) => {
        setEditing(a);
        setForm(a ? { titre: a.titre || '', description: a.description || '', type: a.type || '', severity: a.severity || 'LOW', cameraId: a.cameraId || '' } : EMPTY);
        setOpenModal(true);
    };
    const closeModal = () => { setOpenModal(false); setEditing(null); setForm(EMPTY); };
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = filterSev === 'ALL' ? alertes : alertes.filter(a => (a.severity || a.gravite) === filterSev);

    const sevColor = { HIGH: 'red', MEDIUM: 'amber', LOW: 'green', CRITIQUE: 'red', ELEVEE: 'orange', MOYENNE: 'amber', FAIBLE: 'green' };

    const columns = [
        {
            label: 'Titre / Type',
            render: a => (
                <div>
                    <div style={{ color: colors.text, fontSize: 13.5, fontWeight: 500 }}>{a.titre || a.type || '—'}</div>
                    <div style={{ color: colors.textMuted, fontSize: 12 }}>{a.type || '—'}</div>
                </div>
            ),
        },
        { label: 'Description', render: a => <span style={{ color: colors.textMuted, fontSize: 12.5, display: 'block', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description || '—'}</span> },
        { label: 'Sévérité', render: a => {
            const sev = a.severity || a.gravite;
            return <Badge label={sev} color={sevColor[sev] || 'gray'} />;
        }},
        { label: 'Caméra', render: a => <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{a.cameraId || '—'}</span> },
        {
            label: 'Actions', width: 120,
            render: a => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="ghost" icon="✏" onClick={() => open(a)}>Modifier</Btn>
                    <Btn size="sm" variant="danger" icon="🗑" onClick={() => setConfirmDelete(a)} />
                </div>
            ),
        },
    ];

    return (
        <Layout title="Gestion des Alertes">
            <ToastContainer />
            <ConfirmDialog open={!!confirmDelete} title="Supprimer l'alerte" message={`Supprimer l'alerte "${confirmDelete?.titre || confirmDelete?.type}" ?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} danger />

            <PageHeader
                title="Alertes"
                description={`${alertes.length} alerte${alertes.length > 1 ? 's' : ''} au total`}
                action={<Btn variant="primary" icon="+" onClick={() => open()}>Créer alerte</Btn>}
            />

            {/* Severity filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                    { key: 'ALL', label: 'Toutes', count: alertes.length },
                    { key: 'HIGH', label: 'Élevée', count: alertes.filter(a => a.severity === 'HIGH').length },
                    { key: 'MEDIUM', label: 'Moyenne', count: alertes.filter(a => a.severity === 'MEDIUM').length },
                    { key: 'LOW', label: 'Faible', count: alertes.filter(a => a.severity === 'LOW').length },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilterSev(f.key)} style={{
                        background: filterSev === f.key ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                        border: filterSev === f.key ? '1px solid rgba(108,99,255,0.4)' : `1px solid ${colors.border}`,
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                        color: filterSev === f.key ? '#c4b5fd' : colors.textMuted,
                        fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {f.label}
                        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{f.count}</span>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                loading={loading}
                emptyIcon="🔔"
                emptyText="Aucune alerte"
                searchable={a => `${a.titre} ${a.type} ${a.description}`}
            />

            <Modal
                open={openModal}
                onClose={closeModal}
                title={editing ? 'Modifier l\'alerte' : 'Créer une alerte'}
                actions={
                    <>
                        <Btn variant="ghost" onClick={closeModal}>Annuler</Btn>
                        <Btn variant="primary" onClick={handleSubmit} loading={saving}>{editing ? 'Enregistrer' : 'Créer'}</Btn>
                    </>
                }
            >
                <Field label="Titre" required>
                    <Input placeholder="Intrusion détectée" value={form.titre} onChange={set('titre')} />
                </Field>
                <Field label="Type">
                    <Input placeholder="INTRUSION / INCENDIE / MOUVEMENT..." value={form.type} onChange={set('type')} />
                </Field>
                <Field label="Sévérité">
                    <Select value={form.severity} onChange={set('severity')}>
                        <option value="LOW">Faible</option>
                        <option value="MEDIUM">Moyenne</option>
                        <option value="HIGH">Élevée</option>
                    </Select>
                </Field>
                <Field label="Caméra associée">
                    <Input placeholder="ID de la caméra" value={form.cameraId} onChange={set('cameraId')} />
                </Field>
                <Field label="Description">
                    <Textarea placeholder="Détails de l'alerte..." value={form.description} onChange={set('description')} />
                </Field>
            </Modal>
        </Layout>
    );
};

export default AdminAlertes;
