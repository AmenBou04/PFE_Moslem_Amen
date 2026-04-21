import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                background: 'radial-gradient(circle at top left, rgba(95,108,255,0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(123,97,255,0.18), transparent 30%), #081126'
            }}
        >
            <Box
                sx={{
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    p: 4,
                    borderRadius: 4,
                    boxShadow: 24,
                    maxWidth: 520,
                    width: '100%'
                }}
            >
                <Typography variant="h2" component="h1" gutterBottom>
                    404
                </Typography>
                <Typography variant="h5" gutterBottom>
                    Page non trouvée
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    L’URL saisie ne correspond à aucune page de l’application.
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
                    Retour au tableau de bord
                </Button>
            </Box>
        </Box>
    );
};

export default NotFound;
