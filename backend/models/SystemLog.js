const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    level: { type: String, enum: ['INFO', 'WARNING', 'ERROR'], default: 'INFO' },
    action: { type: String, required: true },
    message: { type: String, required: true },
    entity: { type: String },
    entityId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);