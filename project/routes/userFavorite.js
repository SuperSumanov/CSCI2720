const express = require('express');
const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Location = require('../models/Location');
const { requireAuth, requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /favorite/my-all
// 当前user的所有收藏
router.get('/my-all', requireAuth, requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId }).sort({ timestamp: -1 });

    const locationIds = favorites.map(fav => fav.locationId);
    const locations = await Location.find({ id: { $in: locationIds } });

    const favoriteLocations = favorites.map(favorite => {
      const location = locations.find(loc => loc.id === favorite.locationId);
      return {
        favoriteId: favorite._id,
        locationId: favorite.locationId,
        timestamp: favorite.timestamp,
        location: location || null
      };
    });

    res.json(favoriteLocations);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /favorite/loc-num/:id
// 单个location被收藏的次数（不需要鉴权）
router.get('/loc-num/:id', async (req, res) => {
  try {
    const locationId = req.params.id;

    if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const count = await Favorite.countDocuments({ locationId: locationId.trim() });
    res.json({ locationId: locationId.trim(), favoriteCount: count });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /favorite/:id
// 执行收藏
router.get('/:id', requireAuth, requireUser, async (req, res) => {
  try {
    const locationId = req.params.id;

    if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const trimmedLocationId = locationId.trim();
    const userId = req.user._id;

    const location = await Location.findOne({ id: trimmedLocationId });
    if (!location) return res.status(404).json({ error: 'Location not found' });

    const existingFavorite = await Favorite.findOne({ userId, locationId: trimmedLocationId });
    if (existingFavorite) {
      return res.status(409).json({ error: 'Already favorited' });
    }

    const favorite = new Favorite({ userId, locationId: trimmedLocationId });
    await favorite.save();

    res.status(201).json({ message: 'Location favorited successfully', favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already favorited' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /favorite/:id
// 取消收藏
router.delete('/:id', requireAuth, requireUser, async (req, res) => {
  try {
    const locationId = req.params.id;

    if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const trimmedLocationId = locationId.trim();
    const userId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({ userId, locationId: trimmedLocationId });
    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

