const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/myDatabase');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => console.log("MongoDB connected"));

module.exports = mongoose;
