const express = require('express');
const User = require('../models/User');
const { fetchAndStoreData } = require('../services/saveData');
const { UpdateEventNumForLocations } = require('../services/getEventNum');

const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const ok = await user.checkPassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid username or password" });

  req.session.user = { _id: user._id, username: user.username, role: user.role };

  (async () => {
    try {
      console.log("Updating events & locations...");
      await fetchAndStoreData();
      await UpdateEventNumForLocations();
      console.log("Update completed.");
    } catch (err) {
      console.error("Update failed:", err);
    }
  })();

  res.json({ message: "Login successful" });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

module.exports = router;
