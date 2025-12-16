const mongoose = require('mongoose');

const LocationSchema = mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  latitude: Number,
  longitude: Number,
  area: Number,
  eventNum: Number
});

module.exports = mongoose.model("Location", LocationSchema);
