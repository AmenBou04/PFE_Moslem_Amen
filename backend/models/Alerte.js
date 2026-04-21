const mongoose = require('mongoose');

const alerteSchema = new mongoose.Schema({
    type: { type: String, enum: ['INTRUSION', 'ANOMALIE', 'CHUTE', 'FOULE', 'EQUIPEMENT'], required: true },
    gravite: { type: String, enum: ['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'], required: true },
    zone_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    camera_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Camera' },
    ids_personnes: [Number],
    description: { type: String, required: true },
    image_capture: { type: String },
    statut: { type: String, enum: ['NOUVELLE', 'ACQUITTEE', 'ESCALADEE', 'RESOLUE'], default: 'NOUVELLE' },
    traitee_par: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentaire: String
}, { timestamps: true });

// Index pour les performances
alerteSchema.index({ createdAt: -1 });
alerteSchema.index({ statut: 1 });

module.exports = mongoose.model('Alerte', alerteSchema);
