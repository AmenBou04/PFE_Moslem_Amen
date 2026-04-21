import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
    Tooltip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as UsersIcon,
    Videocam as CameraIcon,
    Map as ZoneIcon,
    Notifications as AlertIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    AccountCircle as ProfileIcon,
    History as HistoryIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Layout = ({ children, title = 'Tableau de bord' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const shellBackground = `
        radial-gradient(circle at 18% 20%, rgba(32, 177, 255, 0.18), transparent 38%),
        radial-gradient(circle at 86% 14%, rgba(255, 146, 87, 0.14), transparent 30%),
        linear-gradient(130deg, #050b16 0%, #0b1b30 52%, #071423 100%)
    `;

    const panelBackground = 'linear-gradient(180deg, rgba(7, 16, 31, 0.92), rgba(7, 16, 31, 0.78))';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Alertes', icon: <AlertIcon />, path: '/alertes' },
    ]; 

    if (user?.role === 'OPERATEUR') {
        menuItems.push({ text: 'Historique', icon: <HistoryIcon />, path: '/historique' });
    }

    if (user?.role === 'ADMIN') {
        menuItems.push(
            { text: 'Utilisateurs', icon: <UsersIcon />, path: '/users' },
            { text: 'Zones', icon: <ZoneIcon />, path: '/zones' },
            { text: 'Caméras', icon: <CameraIcon />, path: '/cameras' },
            { text: 'Logs système', icon: <AlertIcon />, path: '/system-logs' }
        );
    }

    const drawer = (
        <Box sx={{ width: drawerWidth, p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#f5fbff', letterSpacing: '0.01em' }}>
                    Surveillance Industrielle
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(184, 216, 255, 0.86)' }}>
                    {user?.role === 'ADMIN' ? 'Admin' : 'Opérateur'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(184, 216, 255, 0.7)' }}>
                    {user?.email}
                </Typography>
            </Box>

            <Divider sx={{ mb: 2, borderColor: 'rgba(132, 196, 255, 0.16)' }} />

            <List>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        selected={location.pathname === item.path}
                        onClick={() => {
                            navigate(item.path);
                            if (!isMdUp) {
                                setMobileOpen(false);
                            }
                        }}
                        sx={{
                            borderRadius: 2.5,
                            mb: 1,
                            color: 'rgba(216, 233, 252, 0.9)',
                            '& .MuiListItemIcon-root': {
                                color: 'rgba(132, 196, 255, 0.92)',
                                minWidth: 40
                            },
                            '&:hover': {
                                bgcolor: 'rgba(81, 162, 255, 0.16)'
                            },
                            '&.Mui-selected': {
                                bgcolor: 'rgba(55, 182, 255, 0.2)',
                                border: '1px solid rgba(100, 190, 255, 0.4)',
                                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.24)'
                            },
                            '&.Mui-selected:hover': {
                                bgcolor: 'rgba(55, 182, 255, 0.26)'
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}
            </List>

            <Divider sx={{ my: 2, borderColor: 'rgba(132, 196, 255, 0.16)' }} />

            <List>
                <ListItemButton
                    key="profile"
                    selected={location.pathname === '/profile'}
                    onClick={() => {
                        navigate('/profile');
                        if (!isMdUp) {
                            setMobileOpen(false);
                        }
                    }}
                    sx={{
                        borderRadius: 2.5,
                        mb: 1,
                        color: 'rgba(216, 233, 252, 0.9)',
                        '& .MuiListItemIcon-root': {
                            color: 'rgba(132, 196, 255, 0.92)',
                            minWidth: 40
                        },
                        '&:hover': {
                            bgcolor: 'rgba(81, 162, 255, 0.16)'
                        },
                        '&.Mui-selected': {
                            bgcolor: 'rgba(55, 182, 255, 0.2)',
                            border: '1px solid rgba(100, 190, 255, 0.4)',
                            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.24)'
                        },
                        '&.Mui-selected:hover': {
                            bgcolor: 'rgba(55, 182, 255, 0.26)'
                        }
                    }}
                >
                    <ListItemIcon><ProfileIcon /></ListItemIcon>
                    <ListItemText primary="Mon Profil" />
                </ListItemButton>
            </List>

            <Divider sx={{ my: 2, borderColor: 'rgba(132, 196, 255, 0.16)' }} />

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start', px: 1 }}>
                <Tooltip title="Déconnexion">
                    <IconButton
                        onClick={handleLogout}
                        sx={{
                            color: '#73c7ff',
                            bgcolor: 'rgba(115, 199, 255, 0.1)',
                            border: '1px solid rgba(115, 199, 255, 0.22)',
                            '&:hover': {
                                bgcolor: 'rgba(115, 199, 255, 0.18)'
                            }
                        }}
                    >
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: shellBackground }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: 'rgba(7, 16, 31, 0.84)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(132, 196, 255, 0.16)'
                }}
            >
                <Toolbar>
                    {!isMdUp && (
                        <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, color: '#f5fbff' }}>
                        Surveillance Industrielle
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(184, 216, 255, 0.86)', display: { xs: 'none', sm: 'block' } }}>
                        {user?.role === 'ADMIN' ? 'Admin' : 'Opérateur'}
                    </Typography>
                </Toolbar>
            </AppBar>

            {isMdUp ? (
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            top: '64px',
                            background: panelBackground,
                            backdropFilter: 'blur(6px)',
                            borderRight: '1px solid rgba(132, 196, 255, 0.16)'
                        }
                    }}
                >
                    {drawer}
                </Drawer>
            ) : (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            background: panelBackground,
                            borderRight: '1px solid rgba(132, 196, 255, 0.16)'
                        }
                    }}
                >
                    {drawer}
                </Drawer>
            )}

            <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10, width: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#f5fbff', fontWeight: 700 }}>
                    {title}
                </Typography>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
