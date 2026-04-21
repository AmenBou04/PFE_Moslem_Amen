const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: { type: String, default: '' },
    localisation: { type: String, default: '' },
    niveau_acces: { type: String, enum: ['PUBLIQUE', 'RESTREINTE', 'INTERDITE'], default: 'PUBLIQUE' },
    seuil_alerte: { type: Number, default: 0.85 },
    coordonnees: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Zone', zoneSchema);
