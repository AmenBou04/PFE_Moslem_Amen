import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    PageHeader, Modal, Field, Textarea, Btn, Badge,
    colors, toast, ToastContainer, getSeverityBadge, getStatusBadge,
    StatCard
} from '../../components/ui';

const OperatorAlertes = () => {
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedAlerte, setSelectedAlerte] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view' | 'escalate'
    const [commentaire, setCommentaire] = useState('');
    const [processing, setProcessing] = useState(false);
    const prevCountRef = useRef(0);

    const stats = {
        total: alertes.length,
        critiques: alertes.filter(a => a.gravite === 'CRITIQUE').length,
        nonTraitees: alertes.filter(a => a.statut === 'NOUVELLE').length,
        acquittees: alertes.filter(a => a.statut === 'ACQUITTEE').length,
    };

    const fetchAlertes = async () => {
        try {
            const r = await api.get('/alertes');
            const data = r.data;

            // Notify if new critical alert
            if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
                const newest = data[0];
                if (newest?.gravite === 'CRITIQUE') toast.error(`🚨 Nouvelle alerte CRITIQUE : ${newest.type}`);
                else if (newest?.gravite === 'ELEVEE') toast.warning(`⚠ Nouvelle alerte élevée : ${newest.type}`);
                else toast.info(`Nouvelle alerte : ${newest?.type}`);
            }
            prevCountRef.current = data.length;
            setAlertes(data);
        } catch { toast.error('Erreur chargement alertes'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAlertes();
        const t = setInterval(fetchAlertes, 5000);
        return () => clearInterval(t);
    }, []);

    const handleAcquitter = async (id) => {
        setProcessing(true);
        try {
            await api.patch(`/alertes/${id}/acquitter`);
            toast.success('Alerte acquittée');
            fetchAlertes();
        } catch { toast.error('Erreur lors de l\'acquittement'); }
        finally { setProcessing(false); }
    };

    const handleEscalader = async () => {
        setProcessing(true);
        try {
            await api.patch(`/alertes/${selectedAlerte._id}/escalader`, { commentaire });
            toast.warning('Alerte escaladée au responsable');
            setSelectedAlerte(null); setCommentaire('');
            fetchAlertes();
        } catch { toast.error('Erreur lors de l\'escalade'); }
        finally { setProcessing(false); }
    };

    const openDetail = (a, mode = 'view') => { setSelectedAlerte(a); setModalMode(mode); };

    const filtered = filter === 'ALL' ? alertes
        : filter === 'NOUVELLES' ? alertes.filter(a => a.statut === 'NOUVELLE')
        : alertes.filter(a => a.gravite === filter);

    const sevColors = { CRITIQUE: colors.red, ELEVEE: colors.orange, MOYENNE: colors.amber, FAIBLE: colors.green };
    const sevIcons  = { CRITIQUE: '🔴', ELEVEE: '🟠', MOYENNE: '🟡', FAIBLE: '🟢' };

    return (
        <Layout title="Mes Alertes">
            <ToastContainer />

            <PageHeader
                title="Alertes"
                description="Surveillance en temps réel — actualisation toutes les 5 secondes"
                action={
                    <Btn variant="ghost" icon="↻" onClick={fetchAlertes}>Actualiser</Btn>
                }
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total" value={stats.total} icon="🔔" color={colors.purple} />
                <StatCard label="Critiques" value={stats.critiques} icon="🚨" color={colors.red} />
                <StatCard label="Non traitées" value={stats.nonTraitees} icon="⏳" color={colors.orange} />
                <StatCard label="Acquittées" value={stats.acquittees} icon="✅" color={colors.green} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { key: 'ALL', label: 'Toutes', count: alertes.length },
                    { key: 'NOUVELLES', label: 'Nouvelles', count: stats.nonTraitees },
                    { key: 'CRITIQUE', label: '🔴 Critique', count: stats.critiques },
                    { key: 'ELEVEE', label: '🟠 Élevée', count: alertes.filter(a => a.gravite === 'ELEVEE').length },
                    { key: 'MOYENNE', label: '🟡 Moyenne', count: alertes.filter(a => a.gravite === 'MOYENNE').length },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        background: filter === f.key ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                        border: filter === f.key ? '1px solid rgba(108,99,255,0.4)' : `1px solid ${colors.border}`,
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                        color: filter === f.key ? '#c4b5fd' : colors.textMuted,
                        fontSize: 12.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {f.label}
                        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Alert cards */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: colors.textMuted }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div> Chargement des alertes...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <div style={{ color: colors.textMuted, fontSize: 14 }}>Aucune alerte pour ce filtre</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((a, i) => {
                        const col = sevColors[a.gravite] || colors.purple;
                        const icon = sevIcons[a.gravite] || '⚪';
                        const isNew = a.statut === 'NOUVELLE';
                        return (
                            <div key={i} style={{
                                background: colors.surface,
                                border: `1px solid ${isNew ? col + '40' : colors.border}`,
                                borderLeft: `3px solid ${col}`,
                                borderRadius: 12, padding: '16px 20px',
                                display: 'flex', alignItems: 'center', gap: 16,
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = colors.surface2}
                                onMouseLeave={e => e.currentTarget.style.background = colors.surface}>
                                {/* Severity indicator */}
                                <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{a.type || 'Alerte'}</span>
                                        <Badge label={a.gravite} color={a.gravite === 'CRITIQUE' ? 'red' : a.gravite === 'ELEVEE' ? 'orange' : a.gravite === 'MOYENNE' ? 'amber' : 'green'} size="sm" />
                                        {isNew && <Badge label="Nouvelle" color="red" size="sm" />}
                                    </div>
                                    <div style={{ color: colors.textMuted, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description || '—'}</div>
                                    <div style={{ color: colors.textSub, fontSize: 11.5, marginTop: 4 }}>
                                        {a.zone_id?.nom ? `📍 ${a.zone_id.nom} · ` : ''}
                                        {a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : ''}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <Btn size="sm" variant="ghost" onClick={() => openDetail(a, 'view')}>Détails</Btn>
                                    {isNew && (
                                        <>
                                            <Btn size="sm" variant="success" onClick={() => handleAcquitter(a._id)} loading={processing}>✓ Acquitter</Btn>
                                            {a.gravite === 'CRITIQUE' && (
                                                <Btn size="sm" variant="warning" onClick={() => openDetail(a, 'escalate')}>⬆ Escalader</Btn>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail / Escalate modal */}
            <Modal
                open={!!selectedAlerte}
                onClose={() => { setSelectedAlerte(null); setCommentaire(''); }}
                title={modalMode === 'escalate' ? 'Escalader l\'alerte' : 'Détails de l\'alerte'}
                width={560}
                actions={
                    modalMode === 'escalate' ? (
                        <>
                            <Btn variant="ghost" onClick={() => { setSelectedAlerte(null); setCommentaire(''); }}>Annuler</Btn>
                            <Btn variant="warning" onClick={handleEscalader} loading={processing}>⬆ Escalader au responsable</Btn>
                        </>
                    ) : (
                        <Btn variant="ghost" onClick={() => setSelectedAlerte(null)}>Fermer</Btn>
                    )
                }
            >
                {selectedAlerte && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                            {[
                                { label: 'Type', val: selectedAlerte.type },
                                { label: 'Gravité', val: <Badge label={selectedAlerte.gravite} color={selectedAlerte.gravite === 'CRITIQUE' ? 'red' : 'amber'} /> },
                                { label: 'Statut', val: <Badge label={selectedAlerte.statut} color={selectedAlerte.statut === 'NOUVELLE' ? 'red' : 'green'} /> },
                                { label: 'Zone', val: selectedAlerte.zone_id?.nom || '—' },
                                { label: 'Date', val: selectedAlerte.createdAt ? new Date(selectedAlerte.createdAt).toLocaleString('fr-FR') : '—' },
                            ].map((item, i) => (
                                <div key={i} style={{ marginBottom: 14 }}>
                                    <div style={{ color: colors.textSub, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                                    <div style={{ color: colors.text, fontSize: 13.5 }}>{item.val}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 4, marginBottom: 14 }}>
                            <div style={{ color: colors.textSub, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</div>
                            <div style={{ color: colors.text, fontSize: 13.5, lineHeight: 1.6 }}>{selectedAlerte.description || '—'}</div>
                        </div>
                        {modalMode === 'escalate' && (
                            <Field label="Commentaire pour le responsable">
                                <Textarea
                                    placeholder="Décrivez pourquoi cette alerte nécessite une escalade..."
                                    value={commentaire}
                                    onChange={e => setCommentaire(e.target.value)}
                                    style={{ minHeight: 100 }}
                                />
                            </Field>
                        )}
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default OperatorAlertes;
