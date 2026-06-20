const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

router.post('/settings', authenticate, async (req, res) => {
  try {
    const { username, profilePicture, wallpaper } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { username, profilePicture, wallpaper } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: "Settings updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/all', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const Message = require('../models/Message');

router.get('/messages/:contactId', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: contactId },
        { senderId: contactId, receiverId: req.userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
