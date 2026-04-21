import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { StatCard, colors, Badge } from '../../components/ui';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, cameras: 0, zones: 0, alertes: 0, critiques: 0, nonTraitees: 0 });
    const [recentAlertes, setRecentAlertes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [users, cameras, zones, alertes] = await Promise.allSettled([
                    api.get('/users'),
                    api.get('/cameras'),
                    api.get('/zones'),
                    api.get('/alertes'),
                ]);

                const u = users.status === 'fulfilled' ? users.value.data : [];
                const c = cameras.status === 'fulfilled' ? cameras.value.data : [];
                const z = zones.status === 'fulfilled' ? zones.value.data : [];
                const a = alertes.status === 'fulfilled' ? alertes.value.data : [];

                setStats({
                    users: u.length,
                    cameras: c.length,
                    zones: z.length,
                    alertes: a.length,
                    critiques: a.filter(x => x.gravite === 'CRITIQUE').length,
                    nonTraitees: a.filter(x => x.statut === 'NOUVELLE').length,
                });
                setRecentAlertes(a.slice(0, 8));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 10000);
        return () => clearInterval(t);
    }, []);

    const severityMap = {
        CRITIQUE: { color: 'red', icon: '🔴' },
        ELEVEE:   { color: 'orange', icon: '🟠' },
        MOYENNE:  { color: 'amber', icon: '🟡' },
        FAIBLE:   { color: 'green', icon: '🟢' },
    };

    const statusMap = {
        NOUVELLE:  { color: 'red',    label: 'Nouvelle' },
        ACQUITTEE: { color: 'green',  label: 'Acquittée' },
        ESCALADEE: { color: 'orange', label: 'Escaladée' },
    };

    return (
        <Layout title="Dashboard Administrateur">
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Utilisateurs" value={stats.users} icon="👥" color={colors.purple} sub="Admins & opérateurs" />
                <StatCard label="Caméras" value={stats.cameras} icon="📹" color={colors.blue} sub="Actives" />
                <StatCard label="Zones" value={stats.zones} icon="🗺" color={colors.green} sub="Surveillées" />
                <StatCard label="Alertes totales" value={stats.alertes} icon="🔔" color={colors.amber} />
                <StatCard label="Critiques" value={stats.critiques} icon="🚨" color={colors.red} sub="Nécessitent attention" />
                <StatCard label="Non traitées" value={stats.nonTraitees} icon="⏳" color={colors.orange} sub="En attente" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                {/* Recent alerts table */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>Alertes récentes</span>
                        <span style={{ color: colors.textMuted, fontSize: 12 }}>Mise à jour auto 10s</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                {['Type', 'Description', 'Gravité', 'Statut', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: colors.textSub, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>Chargement...</td></tr>
                            ) : recentAlertes.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                                    Aucune alerte
                                </td></tr>
                            ) : recentAlertes.map((a, i) => {
                                const sev = severityMap[a.gravite] || { color: 'gray', icon: '⚪' };
                                const sta = statusMap[a.statut] || { color: 'gray', label: a.statut };
                                return (
                                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '11px 16px', color: colors.text, fontSize: 13 }}>{a.type || '—'}</td>
                                        <td style={{ padding: '11px 16px', color: colors.textMuted, fontSize: 12.5, maxWidth: 200 }}>
                                            <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description || '—'}</span>
                                        </td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <Badge label={`${sev.icon} ${a.gravite}`} color={sev.color} size="sm" />
                                        </td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <Badge label={sta.label} color={sta.color} size="sm" />
                                        </td>
                                        <td style={{ padding: '11px 16px', color: colors.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>
                                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Right sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Distribution */}
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '18px 20px' }}>
                        <div style={{ color: colors.text, fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Distribution des alertes</div>
                        {[
                            { label: 'Critiques', val: stats.critiques, total: stats.alertes, color: colors.red },
                            { label: 'Non traitées', val: stats.nonTraitees, total: stats.alertes, color: colors.orange },
                            { label: 'Traitées', val: stats.alertes - stats.nonTraitees, total: stats.alertes, color: colors.green },
                        ].map((item, i) => {
                            const pct = stats.alertes > 0 ? Math.round((item.val / stats.alertes) * 100) : 0;
                            return (
                                <div key={i} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ color: colors.textMuted, fontSize: 12.5 }}>{item.label}</span>
                                        <span style={{ color: colors.text, fontSize: 12.5, fontWeight: 600 }}>{item.val} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick actions */}
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '18px 20px' }}>
                        <div style={{ color: colors.text, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Accès rapide</div>
                        {[
                            { label: 'Gérer les utilisateurs', icon: '👥', path: '/users' },
                            { label: 'Configurer les caméras', icon: '📹', path: '/cameras' },
                            { label: 'Gérer les zones', icon: '🗺', path: '/zones' },
                            { label: 'Voir toutes les alertes', icon: '🔔', path: '/alertes' },
                        ].map((item, i) => (
                            <a key={i} href={item.path} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 12px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}`,
                                marginBottom: 7, textDecoration: 'none', transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                <span style={{ color: colors.text, fontSize: 13 }}>{item.label}</span>
                                <span style={{ marginLeft: 'auto', color: colors.textSub, fontSize: 12 }}>→</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
