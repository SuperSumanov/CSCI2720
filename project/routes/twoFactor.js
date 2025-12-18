const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/setup', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled. Please disable it first if you want to reset.' });
    }

    const secret = speakeasy.generateSecret({
      name: `${user.username} (CSCI2720)`,
      length: 32
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.username,
      issuer: 'CSCI2720',
      encoding: 'base32'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    user.twoFactorSecret = secret.base32;
    
    // 如果是管理员，生成紧急重置码
    const response = {
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32
    };
    
    if (user.role === 'admin') {
      const code = crypto.randomBytes(8).toString('hex').toUpperCase();
      const hashedCode = await bcrypt.hash(code, 10);
      
      user.emergencyResetCodes = [hashedCode];
      response.emergencyResetCode = code;
    }
    
    await user.save();

    res.json(response);
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

router.post('/enable', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFactorSecret) return res.status(400).json({ error: '2FA not set up. Please setup first.' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    user.twoFactorEnabled = true;
    await user.save();

    // 在 enable 阶段不再生成或更新紧急恢复码
    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    console.error('2FA enable error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});


router.post('/disable', requireAuth, async (req, res) => {
  try {
    const { password, token } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    if (!token) return res.status(400).json({ error: '2FA token required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const passwordValid = await user.checkPassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.twoFactorSecret) {
      return res.status(500).json({ error: '2FA not properly configured' });
    }

    const tokenVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!tokenVerified) {
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      twoFactorEnabled: user.twoFactorEnabled || false
    });
  } catch (err) {
    console.error('2FA status error:', err);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// 使用紧急重置码重置管理员自己的 2FA（在未登录状态下）
// 场景：管理员因为丢失 2FA 设备而无法登录，此时可使用 username + password + emergencyCode 来关闭自己的 2FA
router.post('/reset-with-emergency-code', async (req, res) => {
  try {
    const { username, emergencyCode, password } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    if (!emergencyCode) return res.status(400).json({ error: 'Emergency code required' });
    if (!password) return res.status(400).json({ error: 'Password required' });

    // 这里不依赖登录态，而是通过用户名找到对应管理员账号
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can use emergency reset codes' });
    }

    const passwordValid = await user.checkPassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    if (!user.emergencyResetCodes || user.emergencyResetCodes.length === 0) {
      return res.status(400).json({ error: 'No emergency reset codes available' });
    }

    let codeMatched = false;
    let matchedIndex = -1;
    
    for (let i = 0; i < user.emergencyResetCodes.length; i++) {
      const isValid = await bcrypt.compare(emergencyCode, user.emergencyResetCodes[i]);
      if (isValid) {
        codeMatched = true;
        matchedIndex = i;
        break;
      }
    }

    if (!codeMatched) {
      return res.status(401).json({ error: 'Invalid emergency reset code' });
    }

    // 使用后清空紧急恢复码
    user.emergencyResetCodes = [];

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.json({ 
      message: '2FA disabled successfully using emergency code'
    });
  } catch (err) {
    console.error('Emergency reset error:', err);
    res.status(500).json({ error: 'Failed to reset 2FA with emergency code' });
  }
});

module.exports = router;

