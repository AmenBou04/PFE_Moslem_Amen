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

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 3.2,
            bgcolor: 'rgba(10, 20, 38, 0.76)',
            color: '#ecf3ff',
            '& fieldset': {
                borderColor: 'rgba(120, 172, 255, 0.28)'
            },
            '&:hover fieldset': {
                borderColor: 'rgba(126, 188, 255, 0.55)'
            },
            '&.Mui-focused fieldset': {
                borderWidth: '2px',
                borderColor: '#37b6ff',
                boxShadow: '0 0 0 4px rgba(55, 182, 255, 0.18)'
            }
        },
        '& .MuiInputBase-input::placeholder': {
            color: 'rgba(231, 241, 255, 0.56)',
            opacity: 1
        }
    };

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
                background: `
                    radial-gradient(circle at 18% 20%, rgba(32, 177, 255, 0.24), transparent 38%),
                    radial-gradient(circle at 86% 14%, rgba(255, 146, 87, 0.22), transparent 30%),
                    linear-gradient(130deg, #050b16 0%, #0b1b30 52%, #071423 100%)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 1.5, md: 3 }
            }}
        >
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: { xs: 4, md: 5 },
                        overflow: 'hidden',
                        border: '1px solid rgba(132, 196, 255, 0.22)',
                        bgcolor: 'rgba(7, 14, 27, 0.58)',
                        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.42)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Grid container>
                        <Grid
                            item
                            xs={12}
                            md={6}
                            sx={{
                                background: 'linear-gradient(180deg, rgba(7, 16, 31, 0.86), rgba(7, 16, 31, 0.65))',
                                p: { xs: 4, md: 6 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: '#1f9ee8', width: 58, height: 58, boxShadow: '0 12px 25px rgba(31, 158, 232, 0.38)' }}>
                                    <LockOutlined sx={{ color: '#06111f' }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f5fbff', letterSpacing: '0.01em' }}>
                                        Connexion
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'rgba(207, 223, 243, 0.86)', mt: 0.3 }}>
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
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 0.8, color: '#b8d8ff', fontWeight: 700, fontSize: 14 }}>
                                        Email
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        margin="none"
                                        required
                                        autoFocus
                                        placeholder="exemple@email.com"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlined sx={{ color: 'rgba(184, 216, 255, 0.8)' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={fieldSx}
                                    />
                                </Box>

                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ mb: 0.8, color: '#b8d8ff', fontWeight: 700, fontSize: 14 }}>
                                        Mot de passe
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        margin="none"
                                        required
                                        placeholder="Saisissez votre mot de passe"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlined sx={{ color: 'rgba(184, 216, 255, 0.8)' }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        sx={{ color: 'rgba(184, 216, 255, 0.75)' }}
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={fieldSx}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        py: 1.8,
                                        borderRadius: 3,
                                        fontWeight: 800,
                                        letterSpacing: '0.01em',
                                        background: 'linear-gradient(140deg, #22b7ff 0%, #2f8eff 55%, #4e6bff 100%)',
                                        boxShadow: '0 14px 32px rgba(43, 133, 255, 0.36)',
                                        '&:hover': {
                                            background: 'linear-gradient(140deg, #3bc0ff 0%, #3d9dff 55%, #5e7aff 100%)'
                                        }
                                    }}
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
                                background: `
                                    radial-gradient(circle at 76% 20%, rgba(87, 177, 255, 0.45), transparent 40%),
                                    linear-gradient(135deg, #0d2840 0%, #15426a 48%, #1f5d8f 100%)
                                `,
                                color: 'white',
                                p: { xs: 4, md: 6 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.2 }}>
                                Bienvenue sur PFE Dashboard
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, opacity: 0.92, fontSize: '1.1rem', color: 'rgba(227, 243, 255, 0.92)' }}>
                                Surveillez les alertes industrielles, suivez les événements et assurez la sécurité de votre usine depuis une interface moderne.
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(203, 230, 255, 0.24)' }}>
                                    <Typography variant="subtitle1" sx={{ opacity: 0.96, fontWeight: 700 }}>
                                        Interface claire et responsive
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(203, 230, 255, 0.24)' }}>
                                    <Typography variant="subtitle1" sx={{ opacity: 0.96, fontWeight: 700 }}>
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
