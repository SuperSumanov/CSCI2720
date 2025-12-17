const express = require('express');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const allUsers = await User.find({});
    return res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (await User.findOne({ username }))
      return res.status(409).json({ error: 'Username already exists' });

    const user = new User({ username, role });
    await user.setPassword(password);
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:username', async (req, res) => {
  try {
    const { newName, password, role } = req.body;

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (newName) user.username = newName;
    if (password) await user.setPassword(password);
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:username', async (req, res) => {
  try {
    await User.findOneAndDelete({ username: req.params.username });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
