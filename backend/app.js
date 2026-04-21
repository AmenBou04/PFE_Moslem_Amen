const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/zones', require('./routes/zoneRoutes'));
app.use('/api/cameras', require('./routes/cameraRoutes'));
app.use('/api/alertes', require('./routes/alerteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api/system-logs', require('./routes/systemLogRoutes'));
app.use('/api/ai-server', require('./routes/aiServerRoutes'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Serveur en marche' });
});

module.exports = app;