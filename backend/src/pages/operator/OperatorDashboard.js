/* ════════════════════════════════════════════════════════════
   OperatorDashboard.js
════════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { StatCard, colors, Badge } from '../../components/ui';

export const OperatorDashboard = () => {
    const [stats, setStats] = useState({ total: 0, critiques: 0, nonTraitees: 0, elevees: 0 });
    const [recent, setRecent] = useState([]);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const r = await api.get('/alertes');
                const a = r.data;
                const newStats = {
                    total: a.length,
                    critiques: a.filter(x => x.gravite === 'CRITIQUE').length,
                    elevees: a.filter(x => x.gravite === 'ELEVEE').length,
                    nonTraitees: a.filter(x => x.statut === 'NOUVELLE').length,
                };
                setStats(prev => {
                    if (prev.total < newStats.total) setPulse(true);
                    return newStats;
                });
                setRecent(a.filter(x => x.statut === 'NOUVELLE').slice(0, 5));
            } catch {}
        };
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => { if (pulse) { const t = setTimeout(() => setPulse(false), 2000); return () => clearTimeout(t); } }, [pulse]);

    return (
        <Layout title="Dashboard Opérateur">
            {pulse && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <span style={{ color: '#fca5a5', fontSize: 13.5, fontWeight: 500 }}>Nouvelle alerte détectée !</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Total alertes" value={stats.total} icon="🔔" color={colors.purple} />
                <StatCard label="Critiques" value={stats.critiques} icon="🚨" color={colors.red} sub="Action immédiate requise" />
                <StatCard label="Élevées" value={stats.elevees} icon="⚠" color={colors.orange} />
                <StatCard label="Non traitées" value={stats.nonTraitees} icon="⏳" color={colors.amber} sub="En attente de traitement" />
            </div>

            {/* Pending alerts */}
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>Alertes en attente</span>
                    {stats.nonTraitees > 0 && (
                        <span style={{ background: colors.red, color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{stats.nonTraitees}</span>
                    )}
                    <span style={{ marginLeft: 'auto', color: colors.textSub, fontSize: 12 }}>Actualisation 5s</span>
                </div>
                {recent.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                        <div style={{ color: colors.textMuted, fontSize: 14 }}>Aucune alerte en attente</div>
                    </div>
                ) : recent.map((a, i) => {
                    const sevColor = { CRITIQUE: colors.red, ELEVEE: colors.orange, MOYENNE: colors.amber, FAIBLE: colors.green };
                    const col = sevColor[a.gravite] || colors.purple;
                    return (
                        <div key={i} style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.03)`, display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${col}` }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: colors.text, fontSize: 13.5, fontWeight: 500 }}>{a.type || 'Alerte'}</div>
                                <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{a.description || '—'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: colors.textMuted, fontSize: 11 }}>{a.createdAt ? new Date(a.createdAt).toLocaleTimeString('fr-FR') : ''}</div>
                                <Badge label={a.gravite} color={a.gravite === 'CRITIQUE' ? 'red' : a.gravite === 'ELEVEE' ? 'orange' : 'amber'} size="sm" />
                            </div>
                        </div>
                    );
                })}
                {recent.length > 0 && (
                    <div style={{ padding: '12px 20px' }}>
                        <a href="/alertes" style={{ color: colors.purple, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>Voir toutes les alertes →</a>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Layout>
    );
};

export default OperatorDashboard;
