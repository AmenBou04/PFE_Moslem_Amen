const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },  // ← champ "password"
    prenom: { type: String, default: '' },
    nom: { type: String, default: '' },
    role: { type: String, enum: ['ADMIN', 'OPERATEUR'], default: 'OPERATEUR' },
    est_actif: { type: Boolean, default: true }
}, { timestamps: true });


userSchema.pre('save', async function () {
    // ⚠️ Vérification CRUCIALE : ne hache que si le mot de passe a changé
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);