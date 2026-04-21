import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper
} from '@mui/material';

const levelStyles = {
    INFO: { bg: '#dbeafe', color: '#1e3a8a' },
    WARNING: { bg: '#fef3c7', color: '#92400e' },
    ERROR: { bg: '#fee2e2', color: '#991b1b' }
};

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [level, setLevel] = useState('ALL');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await api.get('/system-logs?limit=100');
                setLogs(response.data || []);
            } catch (error) {
                console.error('Erreur chargement logs système:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        if (level === 'ALL') {
            return logs;
        }

        return logs.filter((log) => log.level === level);
    }, [logs, level]);

    return (
        <Layout title="Logs système">
            <Card sx={{ mb: 3, borderRadius: 3, bgcolor: '#f8fbff', color: '#0f172a' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                Journal des événements
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Historique des actions système enregistrées côté serveur.
                            </Typography>
                        </Box>

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Niveau</InputLabel>
                            <Select value={level} label="Niveau" onChange={(event) => setLevel(event.target.value)}>
                                <MenuItem value="ALL">Tous</MenuItem>
                                <MenuItem value="INFO">Info</MenuItem>
                                <MenuItem value="WARNING">Warning</MenuItem>
                                <MenuItem value="ERROR">Erreur</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Niveau</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>Entité</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!loading && filteredLogs.map((log) => {
                            const style = levelStyles[log.level] || levelStyles.INFO;
                            return (
                                <TableRow key={log._id} hover>
                                    <TableCell>{log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.level}
                                            size="small"
                                            sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell sx={{ maxWidth: 360 }}>{log.message}</TableCell>
                                    <TableCell>{log.userEmail || log.userId?.email || '—'}</TableCell>
                                    <TableCell>{log.entity ? `${log.entity}${log.entityId ? ` / ${log.entityId}` : ''}` : '—'}</TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && filteredLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    Aucun log trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Layout>
    );
};

export default SystemLogs;