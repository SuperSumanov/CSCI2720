const express = require('express');
const Location = require('../models/Location'); // model with { id, name, latitude, longitude, area }

const router = express.Router();

/**
 * For consistency with app.js:
 * This route file is used under `/api/locations`
 * Example full endpoints:
 *   GET    /api/locations
 *   POST   /api/locations
 *   PUT    /api/locations/:id
 *   DELETE /api/locations/:id
 */

// ✅ GET all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 }); // sort alphabetically by name
    res.json(locations);
  } catch (err) {
    console.error('[GET /locations] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ GET one location by id
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ id: req.params.id });
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (err) {
    console.error('[GET /api/locations/:id] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ POST create a new location
router.post('/', async (req, res) => {
  try {
    const { id, name, latitude, longitude, area } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID and Name are required' });
    }

    if (await Location.findOne({ id })) {
      return res.status(409).json({ error: 'Location with this ID already exists' });
    }

    const location = new Location({ id, name, latitude, longitude, area });
    await location.save();

    res.status(201).json(location);
  } catch (err) {
    console.error('[POST /api/locations] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PUT update a location by id
router.put('/:id', async (req, res) => {
  try {
    const { name, latitude, longitude, area } = req.body;
    const location = await Location.findOne({ id: req.params.id });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (name !== undefined) location.name = name;
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (area !== undefined) location.area = area;

    await location.save();
    res.json(location);
  } catch (err) {
    console.error('[PUT /api/locations/:id] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE a location by id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Location.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/locations/:id] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;