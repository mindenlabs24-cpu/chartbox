const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: { type: String, required: false },
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, enum: ['text', 'image', 'video', 'audio', 'unknown'], default: 'text' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
