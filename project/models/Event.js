const mongoose = require('mongoose');

const EventSchema = mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  locId: String,
  time: String,
  description: String,
  presenter: String
});

module.exports = mongoose.model("Event", EventSchema);
