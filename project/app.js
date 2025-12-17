const express = require('express');
const session = require('express-session');
const db = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Location = require('./models/Location');

const authRoutes = require('./routes/auth');
const adminEventRoutes = require('./routes/adminEvents');
const adminUserRoutes = require('./routes/adminUsers');
const userFavoriteRoutes = require('./routes/userFavorite');
const userCommentRoutes = require('./routes/userComments');

const { fetchAndStoreData } = require('./services/saveData');
const { UpdateEventNumForLocations } = require('./services/getEventNum');
const { UpdateLocationArea } = require('./services/updateLocationArea');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'CSCI2720',
  resave: false,
  saveUninitialized: false
}));

// Load user from session
app.use((req, res, next) => {
  if (req.session.user) req.user = req.session.user;
  next();
});

// Routes
app.use('/login', authRoutes);
app.use('/logout', authRoutes);
app.use('/admin/events', adminEventRoutes);
app.use('/admin/users', adminUserRoutes);
app.use('/favorite', userFavoriteRoutes);
app.use('/comment', userCommentRoutes);

// Default route
app.use((req, res) => {
  res.send('Hello World!');
});

// Run startup tasks AFTER DB is connected
db.connection.once('open', async () => {
  console.log('MongoDB connected. Running startup tasks...');

  await User.deleteMany({});
  await Location.deleteMany({});
  await Event.deleteMany({});

  const username="admin";
  const password="admin";
  const role="admin";
  
  const admin = new User({ username:username, role:role });
  await admin.setPassword(password);
  await admin.save();

  const username2="user";
  const password2="user";
  const role2="user";
  
  const user = new User({ username:username2, role:role2 });
  await user.setPassword(password2);
  await user.save();

  try {
    await fetchAndStoreData();
    console.log('XML data fetched and stored.');
  } catch (err) {
    console.error('Failed to fetch XML data:', err);
  }

  try {
    await UpdateEventNumForLocations();
    console.log('EventNum updated for all locations.');
  } catch (err) {
    console.error('Failed to update event numbers:', err);
  }

  try {
    await UpdateLocationArea();
    console.log('Location Areas updated for all locations.');
  } catch (err) {
    console.error('Failed to update location areas:', err);
  }
});

module.exports = app;
