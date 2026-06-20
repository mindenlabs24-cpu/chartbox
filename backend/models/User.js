const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  wallpaper: { type: String, default: "" },
  status: { type: String, default: "Available" }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
