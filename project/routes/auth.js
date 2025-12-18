const express = require('express');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const { fetchAndStoreData } = require('../services/saveData');
const { UpdateEventNumForLocations } = require('../services/getEventNum');

const router = express.Router();

function formatDate(date) { 
  const pad = n => n.toString().padStart(2, '0'); 
  const year = date.getFullYear(); 
  const month = pad(date.getMonth() + 1); 
  const day = pad(date.getDate()); 
  const hour = pad(date.getHours()); 
  const minute = pad(date.getMinutes()); 
  const second = pad(date.getSeconds()); 
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`; 
}
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    _id: req.session.user._id,
    username: req.session.user.username,
    role: req.session.user.role,
    login_time: req.session.user.login_time,
    // 添加其他需要的用户信息
  });
});

router.post('/', async (req, res) => {
  const { username, password, token } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const ok = await user.checkPassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid username or password" });

  // with 2FA
  if (user.twoFactorEnabled) {
    if (!token) {
      req.session.pending2FA = {
        userId: user._id.toString(),
        username: user.username
      };
      return res.status(200).json({
        requires2FA: true,
        message: "2FA token required"
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(500).json({ error: "2FA not properly configured" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: "Invalid 2FA token" });
    }
  }

  req.session.user = { _id: user._id, username: user.username, role: user.role, login_time: formatDate(new Date()) };
  req.session.pending2FA = null;

  // (async () => {
  //   try {
  //     console.log("Updating events & locations...");
  //     await fetchAndStoreData();
  //     await UpdateEventNumForLocations();
  //     console.log("Update completed.");
  //   } catch (err) {
  //     console.error("Update failed:", err);
  //   }
  // })();

  res.json({
    message: "Login successful",
    user: {
      _id: user._id,
      username: user.username,
      role: user.role
    }, 
    login_time: formatDate(new Date()) 
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

module.exports = router;
