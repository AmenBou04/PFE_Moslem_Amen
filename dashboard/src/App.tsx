import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  NotificationsActive as AlertIcon,
  Videocam as CameraIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Login from './Login';

// API URL
const API_URL = 'http://localhost:8000';

// Types
interface Alerte {
  id: number;
  type: string;
  gravite: string;
  zone_id: number;
  camera_id: number;
  description: string;
  statut: string;
  date_creation: string;
}

interface Statistiques {
  total_alertes: number;
  alertes_critiques: number;
  alertes_aujourdhui: number;
  cameras_actives: number;
}

const severityColors: { [key: string]: string } = {
  CRITIQUE: '#ff4444',
  ELEVEE: '#ff8800',
  MOYENNE: '#ffcc00',
  FAIBLE: '#44ff44'
};

const severityIcons: { [key: string]: React.ReactElement } = {
  CRITIQUE: <ErrorIcon sx={{ color: '#ff4444' }} />,
  ELEVEE: <WarningIcon sx={{ color: '#ff8800' }} />,
  MOYENNE: <WarningIcon sx={{ color: '#ffcc00' }} />,
  FAIBLE: <InfoIcon sx={{ color: '#44ff44' }} />
};

const typeLabels: { [key: string]: string } = {
  INTRUSION: 'Intrusion',
  ANOMALIE: 'Anomalie',
  CHUTE: 'Chute',
  FOULE: 'Foule',
  EQUIPEMENT: 'Équipement'
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(0);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques>({
    total_alertes: 0,
    alertes_critiques: 0,
    alertes_aujourdhui: 0,
    cameras_actives: 0
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAlerte, setNewAlerte] = useState({
    type: 'INTRUSION',
    gravite: 'CRITIQUE',
    zone_id: 3,
    camera_id: 3,
    description: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Récupérer les alertes
  const fetchAlertes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/alertes`);
      setAlertes(response.data);
      
      const total = response.data.length;
      const critiques = response.data.filter((a: Alerte) => a.gravite === 'CRITIQUE').length;
      const aujourdhui = response.data.filter((a: Alerte) => {
        const dateAlerte = new Date(a.date_creation);
        const aujourdhuiDate = new Date();
        return dateAlerte.toDateString() === aujourdhuiDate.toDateString();
      }).length;
      
      setStatistiques({
        total_alertes: total,
        alertes_critiques: critiques,
        alertes_aujourdhui: aujourdhui,
        cameras_actives: 3
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Créer une alerte
  const creerAlerte = async () => {
    try {
      await axios.post(`${API_URL}/api/alertes`, {
        type: newAlerte.type,
        gravite: newAlerte.gravite,
        zone_id: newAlerte.zone_id,
        camera_id: newAlerte.camera_id,
        description: newAlerte.description
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSnackbar({ open: true, message: 'Alerte créée avec succès', severity: 'success' });
      setOpenDialog(false);
      fetchAlertes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la création', severity: 'error' });
    }
  };

  const acquitterAlerte = async (id: number) => {
    setSnackbar({ open: true, message: 'Alerte acquittée', severity: 'success' });
    fetchAlertes();
  };

  const handleLogin = (token: string, role: string, uid: number) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(uid);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('');
    setUserId(0);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const uid = localStorage.getItem('userId');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role || '');
      setUserId(parseInt(uid || '0'));
    }
    fetchAlertes();
    const interval = setInterval(fetchAlertes, 5000);
    return () => clearInterval(interval);
  }, []);

  // Données pour le graphique
  const chartData = alertes.slice(0, 10).map((alerte, index) => ({
    name: `#${alerte.id}`,
    valeur: alerte.gravite === 'CRITIQUE' ? 4 : alerte.gravite === 'ELEVEE' ? 3 : alerte.gravite === 'MOYENNE' ? 2 : 1
  })).reverse();

  const pieData = [
    { name: 'Intrusion', value: alertes.filter(a => a.type === 'INTRUSION').length, color: '#ff4444' },
    { name: 'Anomalie', value: alertes.filter(a => a.type === 'ANOMALIE').length, color: '#ff8800' },
    { name: 'Chute', value: alertes.filter(a => a.type === 'CHUTE').length, color: '#ffcc00' },
    { name: 'Foule', value: alertes.filter(a => a.type === 'FOULE').length, color: '#44ff44' }
  ];

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#1a1a2e',
            color: 'white'
          }
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🏭 PFE Dashboard
          </Typography>
        </Toolbar>
        <List>
          {[
            { text: 'Dashboard', icon: <DashboardIcon />, active: true },
            { text: 'Alertes', icon: <AlertIcon />, active: false },
            { text: 'Caméras', icon: <CameraIcon />, active: false },
            { text: 'Paramètres', icon: <SettingsIcon />, active: false }
          ].map((item) => (
            <ListItem
              key={item.text}
              sx={{
                bgcolor: item.active ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <AppBar position="static" sx={{ mb: 3, borderRadius: 2, bgcolor: '#16213e' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Surveillance Industrielle - Temps réel
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {userRole === 'ADMIN' ? '👑 Admin' : '👁️ Opérateur'}
            </Typography>
            <IconButton color="inherit" onClick={fetchAlertes}>
              <RefreshIcon />
            </IconButton>
            <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              Déconnexion
            </Button>
          </Toolbar>
        </AppBar>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: '#1a1a2e', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{statistiques.total_alertes}</Typography>
                <Typography variant="body2">Total alertes</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: '#e74c3c', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{statistiques.alertes_critiques}</Typography>
                <Typography variant="body2">Alertes critiques</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: '#2ecc71', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{statistiques.alertes_aujourdhui}</Typography>
                <Typography variant="body2">Alertes aujourd'hui</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: '#3498db', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{statistiques.cameras_actives}</Typography>
                <Typography variant="body2">Caméras actives</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Évolution des alertes
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="valeur" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition des alertes
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alertes Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Alertes récentes
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenDialog(true)}
              >
                Nouvelle alerte
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Gravité</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertes.map((alerte) => (
                    <TableRow key={alerte.id}>
                      <TableCell>#{alerte.id}</TableCell>
                      <TableCell>{typeLabels[alerte.type] || alerte.type}</TableCell>
                      <TableCell>
                        <Chip
                          icon={severityIcons[alerte.gravite]}
                          label={alerte.gravite}
                          size="small"
                          sx={{ bgcolor: severityColors[alerte.gravite] + '20', color: severityColors[alerte.gravite] }}
                        />
                      </TableCell>
                      <TableCell>{alerte.description}</TableCell>
                      <TableCell>{new Date(alerte.date_creation).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={alerte.statut}
                          size="small"
                          color={alerte.statut === 'NOUVELLE' ? 'error' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        {alerte.statut === 'NOUVELLE' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => acquitterAlerte(alerte.id)}
                          >
                            Acquitter
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {alertes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Aucune alerte pour le moment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog Créer Alerte */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Créer une alerte</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remplissez les informations pour créer une nouvelle alerte.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type"
            fullWidth
            select
            value={newAlerte.type}
            onChange={(e) => setNewAlerte({ ...newAlerte, type: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="INTRUSION">Intrusion</option>
            <option value="ANOMALIE">Anomalie</option>
            <option value="CHUTE">Chute</option>
            <option value="FOULE">Foule</option>
          </TextField>
          <TextField
            margin="dense"
            label="Gravité"
            fullWidth
            select
            value={newAlerte.gravite}
            onChange={(e) => setNewAlerte({ ...newAlerte, gravite: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="FAIBLE">Faible</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="ELEVEE">Élevée</option>
            <option value="CRITIQUE">Critique</option>
          </TextField>
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newAlerte.description}
            onChange={(e) => setNewAlerte({ ...newAlerte, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={creerAlerte} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;