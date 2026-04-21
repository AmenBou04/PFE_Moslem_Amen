import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const OperatorDashboard = () => {
    const [stats, setStats] = useState({
        alertes: 0,
        alertesCritiques: 0,
        alertesNonTraitees: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const alertes = await api.get('/alertes');
                const alertesData = alertes.data;
                setStats({
                    alertes: alertesData.length,
                    alertesCritiques: alertesData.filter(a => a.gravite === 'CRITIQUE').length,
                    alertesNonTraitees: alertesData.filter(a => a.statut === 'NOUVELLE').length
                });
            } catch (error) {
                console.error('Erreur stats:', error);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Layout title="Dashboard Opérateur">
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#667eea', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h3">{stats.alertes}</Typography>
                            <Typography variant="body2">Total alertes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#e53e3e', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h3">{stats.alertesCritiques}</Typography>
                            <Typography variant="body2">Alertes critiques</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#ed8936', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h3">{stats.alertesNonTraitees}</Typography>
                            <Typography variant="body2">Alertes non traitées</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Layout>
    );
};

export default OperatorDashboard;