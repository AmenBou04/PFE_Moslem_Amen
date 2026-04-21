import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    Container,
    Avatar,
    Paper,
    Grid
} from '@mui/material';
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined } from '@mui/icons-material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at top left, #5f6cff, #7851ff 30%, #bd71ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}
        >
            <Container maxWidth="md">
                <Paper elevation={12} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Grid container>
                        <Grid
                            item
                            xs={12}
                            md={6}
                            sx={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
                                p: { xs: 4, md: 6 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: '#5f6cff', width: 56, height: 56 }}>
                                    <LockOutlined />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        Connexion
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Accédez à votre espace PFE en toute sécurité.
                                    </Typography>
                                </Box>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    margin="normal"
                                    required
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailOutlined color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.85)', borderRadius: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    margin="normal"
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.85)', borderRadius: 2 }}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                    sx={{ mt: 3, py: 1.75, borderRadius: 3, fontWeight: 700 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
                                </Button>
                            </Box>

                            
                        </Grid>

                        <Grid
                            item
                            xs={12}
                            md={6}
                            sx={{
                                background: 'linear-gradient(135deg, #2b2d7e 0%, #3f4ac8 45%, #7b6cff 100%)',
                                color: 'white',
                                p: { xs: 4, md: 6 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2,fontFamily: 'verdana' }}>
                                Bienvenue sur PFE Dashboard
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                                Surveillez les alertes industrielles, suivez les événements et assurez la sécurité de votre usine depuis une interface moderne.
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                                <Paper elevation={3} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.12)' }}>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                                        Interface claire et responsive
                                    </Typography>
                                </Paper>
                                <Paper elevation={3} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.12)' }}>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                                        Informations en temps réel
                                    </Typography>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
