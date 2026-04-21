import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getMenuItems = () => {
        const common = [
            { text: 'Dashboard', icon: '⬡', path: '/dashboard' },
            { text: 'Alertes', icon: '◈', path: '/alertes' },
        ];
        const admin = [
            { text: 'Utilisateurs', icon: '◉', path: '/users' },
            { text: 'Zones', icon: '◫', path: '/zones' },
            { text: 'Caméras', icon: '⊙', path: '/cameras' },
        ];
        return user?.role === 'ADMIN' ? [...common, ...admin] : common;
    };

    const menuItems = getMenuItems();
    const sideW = collapsed ? 64 : 240;

    const styles = {
        root: {
            display: 'flex',
            minHeight: '100vh',
            background: '#0f0f1a',
            fontFamily: "'Inter', -apple-system, sans-serif",
        },
        sidebar: {
            width: sideW,
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #13132b 0%, #0d0d1f 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 100,
            transition: 'width 0.25s ease',
            overflow: 'hidden',
        },
        sidebarHeader: {
            padding: collapsed ? '20px 14px' : '24px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: collapsed ? 'center' : 'space-between',
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            overflow: 'hidden',
        },
        logoIcon: {
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
        },
        logoText: {
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s',
        },
        collapseBtn: {
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: 12,
            flexShrink: 0,
            display: collapsed ? 'none' : 'block',
        },
        nav: {
            flex: 1,
            padding: '16px 0',
            overflowY: 'auto',
        },
        navSection: {
            padding: collapsed ? '0 8px' : '0 12px',
            marginBottom: 4,
        },
        navSectionLabel: {
            color: 'rgba(255,255,255,0.25)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '8px 8px 4px',
            display: collapsed ? 'none' : 'block',
        },
        navItem: (active) => ({
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '10px' : '9px 12px',
            borderRadius: 9,
            cursor: 'pointer',
            marginBottom: 2,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: active ? 'rgba(108,99,255,0.18)' : 'transparent',
            border: active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
            transition: 'all 0.15s',
            position: 'relative',
        }),
        navIcon: (active) => ({
            fontSize: 16,
            color: active ? '#a78bfa' : 'rgba(255,255,255,0.45)',
            flexShrink: 0,
            width: 20,
            textAlign: 'center',
        }),
        navText: (active) => ({
            color: active ? '#fff' : 'rgba(255,255,255,0.55)',
            fontSize: 13.5,
            fontWeight: active ? 600 : 400,
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
        }),
        navDot: {
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6c63ff',
            marginLeft: 'auto',
            opacity: collapsed ? 0 : 1,
        },
        sidebarFooter: {
            padding: collapsed ? '16px 8px' : '16px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
        },
        userCard: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '8px' : '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            justifyContent: collapsed ? 'center' : 'flex-start',
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 8,
            background: user?.role === 'ADMIN'
                ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
        },
        userInfo: {
            overflow: 'hidden',
            flex: 1,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            width: collapsed ? 0 : 'auto',
        },
        userName: {
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        userRole: {
            color: user?.role === 'ADMIN' ? '#fbbf24' : '#60a5fa',
            fontSize: 11,
            fontWeight: 500,
        },
        logoutBtn: {
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            fontSize: 14,
            flexShrink: 0,
            display: collapsed ? 'none' : 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
        },
        main: {
            marginLeft: sideW,
            flex: 1,
            transition: 'margin-left 0.25s ease',
            minHeight: '100vh',
        },
        topbar: {
            height: 60,
            background: 'rgba(15,15,26,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            gap: 12,
        },
        collapseTopBtn: {
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: '6px 10px',
            fontSize: 13,
        },
        pageTitle: {
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            flex: 1,
            letterSpacing: '-0.2px',
        },
        breadcrumb: {
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
        },
        content: {
            padding: '28px',
        },
    };

    const initials = user ? `${(user.prenom || user.email || 'U')[0]}${(user.nom || '')[0] || ''}`.toUpperCase() : 'U';

    return (
        <div style={styles.root}>
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.logo}>
                        <div style={styles.logoIcon}>🛡</div>
                        <span style={styles.logoText}>VisionGuard</span>
                    </div>
                    <button style={styles.collapseBtn} onClick={() => setCollapsed(true)}>◀</button>
                </div>

                <nav style={styles.nav}>
                    <div style={styles.navSection}>
                        <div style={styles.navSectionLabel}>Navigation</div>
                        {menuItems.map((item) => {
                            const active = location.pathname === item.path;
                            return (
                                <div
                                    key={item.text}
                                    style={styles.navItem(active)}
                                    onClick={() => navigate(item.path)}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span style={styles.navIcon(active)}>{item.icon}</span>
                                    <span style={styles.navText(active)}>{item.text}</span>
                                    {active && !collapsed && <span style={styles.navDot} />}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div style={styles.sidebarFooter}>
                    <div style={styles.userCard}>
                        <div style={styles.avatar}>{initials}</div>
                        <div style={styles.userInfo}>
                            <div style={styles.userName}>{user?.prenom} {user?.nom || user?.email}</div>
                            <div style={styles.userRole}>{user?.role === 'ADMIN' ? '👑 Admin' : '👁 Opérateur'}</div>
                        </div>
                        <button style={styles.logoutBtn} onClick={handleLogout} title="Déconnexion">⏻</button>
                    </div>
                </div>
            </aside>

            <main style={styles.main}>
                <div style={styles.topbar}>
                    <button style={styles.collapseTopBtn} onClick={() => setCollapsed(c => !c)}>
                        {collapsed ? '▶' : '☰'}
                    </button>
                    <span style={styles.pageTitle}>{title || menuItems.find(m => m.path === location.pathname)?.text || 'Dashboard'}</span>
                    <span style={styles.breadcrumb}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div style={styles.content}>
                    {children}
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default Layout;
