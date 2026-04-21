const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    nom: { 
        type: String, 
        required: true 
    },
    description: {
        type: String,
        default: ''
    },
    adresse_ip: { 
        type: String, 
        default: '' 
    },
    zone_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Zone' 
    },
    statut: { 
        type: String, 
        enum: ['ONLINE', 'OFFLINE', 'ERROR'], 
        default: 'OFFLINE' 
    },
    resolution: { 
        type: String, 
        default: '640x480' 
    },
    fps: { 
        type: Number, 
        default: 15 
    },
    dernier_heartbeat: { 
        type: Date, 
        default: null 
    }
}, { 
    timestamps: true 
});

// Index pour les performances
cameraSchema.index({ zone_id: 1 });
cameraSchema.index({ statut: 1 });

module.exports = mongoose.model('Camera', cameraSchema);