import React, { useState, useEffect, useCallback } from 'react';

/* ────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
export const colors = {
    bg: '#0f0f1a',
    surface: '#13132b',
    surface2: '#1a1a35',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.14)',
    text: '#f1f0ff',
    textMuted: 'rgba(255,255,255,0.45)',
    textSub: 'rgba(255,255,255,0.25)',
    purple: '#6c63ff',
    purpleLight: '#a78bfa',
    blue: '#3b82f6',
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    orange: '#f97316',
};

const baseInput = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    padding: '9px 12px',
    fontSize: 13.5,
    width: '100%',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
};

/* ────────────────────────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────────────────────────── */
let _showToast = null;

export const toast = {
    success: (msg) => _showToast?.({ msg, type: 'success' }),
    error:   (msg) => _showToast?.({ msg, type: 'error' }),
    warning: (msg) => _showToast?.({ msg, type: 'warning' }),
    info:    (msg) => _showToast?.({ msg, type: 'info' }),
};

export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        _showToast = ({ msg, type }) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, msg, type }]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
        };
        return () => { _showToast = null; };
    }, []);

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const clrs  = { success: colors.green, error: colors.red, warning: colors.amber, info: colors.blue };

    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: colors.surface2, border: `1px solid ${clrs[t.type]}40`,
                    borderLeft: `3px solid ${clrs[t.type]}`,
                    borderRadius: 10, padding: '12px 16px', minWidth: 280, maxWidth: 400,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                    animation: 'slideIn 0.25s ease',
                }}>
                    <span style={{ color: clrs[t.type], fontSize: 15, fontWeight: 700 }}>{icons[t.type]}</span>
                    <span style={{ color: colors.text, fontSize: 13.5, flex: 1 }}>{t.msg}</span>
                </div>
            ))}
            <style>{`@keyframes slideIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: none; } }`}</style>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────────────────────────── */
export const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{danger ? '🗑' : '❓'}</div>
                <div style={{ color: colors.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                <div style={{ color: colors.textMuted, fontSize: 13.5, marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ ...btnStyle, background: 'rgba(255,255,255,0.06)' }}>Annuler</button>
                    <button onClick={onConfirm} style={{ ...btnStyle, background: danger ? colors.red : colors.purple, color: '#fff', border: 'none' }}>
                        {danger ? 'Supprimer' : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const btnStyle = {
    padding: '8px 18px', borderRadius: 8, border: `1px solid ${colors.border}`,
    color: colors.text, cursor: 'pointer', fontSize: 13.5, fontFamily: 'Inter, sans-serif',
};

/* ────────────────────────────────────────────────────────────
   MODAL
───────────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, actions, width = 520 }) => {
    if (!open) return null;
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 16, maxWidth: width, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.text, fontSize: 15, fontWeight: 600 }}>{title}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '20px 24px' }}>{children}</div>
                {actions && <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${colors.border}` }}>{actions}</div>}
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────────────────────── */
export const Btn = ({ children, onClick, variant = 'default', size = 'md', icon, loading, disabled, style: extraStyle }) => {
    const variants = {
        default:  { background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.border}`, color: colors.text },
        primary:  { background: colors.purple, border: 'none', color: '#fff' },
        success:  { background: colors.green, border: 'none', color: '#fff' },
        danger:   { background: colors.red, border: 'none', color: '#fff' },
        warning:  { background: colors.amber, border: 'none', color: '#1a1000' },
        ghost:    { background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted },
    };
    const sizes = {
        sm: { padding: '5px 12px', fontSize: 12 },
        md: { padding: '8px 16px', fontSize: 13.5 },
        lg: { padding: '11px 22px', fontSize: 14.5 },
    };
    return (
        <button onClick={onClick} disabled={disabled || loading} style={{
            ...variants[variant], ...sizes[size],
            borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
            opacity: (disabled || loading) ? 0.5 : 1, transition: 'opacity 0.15s',
            ...extraStyle,
        }}>
            {loading ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>↻</span> : icon}
            {children}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </button>
    );
};

/* ────────────────────────────────────────────────────────────
   FORM FIELD
───────────────────────────────────────────────────────────── */
export const Field = ({ label, children, error, required }) => (
    <div style={{ marginBottom: 14 }}>
        {label && <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 5 }}>
            {label}{required && <span style={{ color: colors.red }}> *</span>}
        </label>}
        {children}
        {error && <span style={{ color: colors.red, fontSize: 11, marginTop: 3, display: 'block' }}>{error}</span>}
    </div>
);

export const Input = ({ style: extra, ...props }) => (
    <input style={{ ...baseInput, ...extra }} {...props}
        onFocus={e => e.target.style.borderColor = colors.purple}
        onBlur={e => e.target.style.borderColor = colors.border} />
);

export const Textarea = ({ style: extra, ...props }) => (
    <textarea style={{ ...baseInput, resize: 'vertical', minHeight: 80, ...extra }} {...props}
        onFocus={e => e.target.style.borderColor = colors.purple}
        onBlur={e => e.target.style.borderColor = colors.border} />
);

export const Select = ({ children, style: extra, ...props }) => (
    <select style={{ ...baseInput, ...extra }} {...props}
        onFocus={e => e.target.style.borderColor = colors.purple}
        onBlur={e => e.target.style.borderColor = colors.border}>
        {children}
    </select>
);

/* ────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
export const StatCard = ({ label, value, icon, color = colors.purple, trend, sub }) => (
    <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 14, padding: '18px 20px',
        borderTop: `2px solid ${color}`,
        transition: 'border-color 0.2s',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: colors.textMuted, fontSize: 12.5, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 18, opacity: 0.85 }}>{icon}</span>
        </div>
        <div style={{ color: colors.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: colors.textSub, fontSize: 11.5, marginTop: 5 }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{ color: trend >= 0 ? colors.green : colors.red, fontSize: 11.5, marginTop: 5 }}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs hier
            </div>
        )}
    </div>
);

/* ────────────────────────────────────────────────────────────
   BADGE / CHIP
───────────────────────────────────────────────────────────── */
export const Badge = ({ label, color = 'gray', size = 'sm' }) => {
    const palettes = {
        red:    { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
        amber:  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
        green:  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
        blue:   { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
        purple: { bg: 'rgba(108,99,255,0.15)', border: 'rgba(108,99,255,0.3)', text: '#c4b5fd' },
        orange: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#fdba74' },
        gray:   { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.55)' },
    };
    const p = palettes[color] || palettes.gray;
    return (
        <span style={{
            background: p.bg, border: `1px solid ${p.border}`, color: p.text,
            borderRadius: 6, padding: size === 'sm' ? '2px 8px' : '4px 12px',
            fontSize: size === 'sm' ? 11 : 12.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}>{label}</span>
    );
};

/* ────────────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────────────── */
export const PageHeader = ({ title, description, action }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
            <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.4px' }}>{title}</h1>
            {description && <p style={{ color: colors.textMuted, fontSize: 13.5 }}>{description}</p>}
        </div>
        {action}
    </div>
);

/* ────────────────────────────────────────────────────────────
   DATA TABLE
───────────────────────────────────────────────────────────── */
export const DataTable = ({ columns, data, loading, emptyIcon = '📭', emptyText = 'Aucune donnée', searchable }) => {
    const [search, setSearch] = useState('');

    const filtered = searchable
        ? data.filter(row => searchable(row).toLowerCase().includes(search.toLowerCase()))
        : data;

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {searchable && (
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
                    <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
                </div>
            )}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                            {columns.map((col, i) => (
                                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: colors.textSub, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', width: col.width }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>
                                <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: 8 }}>↻</span> Chargement...
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>{emptyIcon}</div>
                                <div style={{ color: colors.textMuted, fontSize: 14 }}>{emptyText}</div>
                            </td></tr>
                        ) : filtered.map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                {columns.map((col, j) => (
                                    <td key={j} style={{ padding: '12px 16px', color: colors.text, fontSize: 13.5 }}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length > 0 && (
                <div style={{ padding: '10px 20px', borderTop: `1px solid ${colors.border}`, color: colors.textSub, fontSize: 12 }}>
                    {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────────────────────── */
export const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${colors.border}`, borderTopColor: colors.purple, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

/* ────────────────────────────────────────────────────────────
   SEVERITY UTILS
───────────────────────────────────────────────────────────── */
export const getSeverityBadge = (gravite) => {
    const map = {
        CRITIQUE: { label: '● Critique', color: 'red' },
        ELEVEE:   { label: '● Élevée',   color: 'orange' },
        MOYENNE:  { label: '● Moyenne',  color: 'amber' },
        FAIBLE:   { label: '● Faible',   color: 'green' },
        HIGH:     { label: '● Élevée',   color: 'red' },
        MEDIUM:   { label: '● Moyenne',  color: 'amber' },
        LOW:      { label: '● Faible',   color: 'green' },
    };
    const s = map[gravite] || { label: gravite, color: 'gray' };
    return <Badge label={s.label} color={s.color} />;
};

export const getStatusBadge = (statut) => {
    const map = {
        NOUVELLE:  { label: 'Nouvelle',  color: 'red' },
        ACQUITTEE: { label: 'Acquittée', color: 'green' },
        ESCALADEE: { label: 'Escaladée', color: 'orange' },
        RESOLUE:   { label: 'Résolue',   color: 'blue' },
    };
    const s = map[statut] || { label: statut, color: 'gray' };
    return <Badge label={s.label} color={s.color} />;
};
