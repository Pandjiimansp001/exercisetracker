const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // For parsing JSON bodies
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// In-memory store for demonstration
const users = {}; // Will store user data and their exercises

// Route to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const userId = Date.now().toString(); // Simple unique user ID
  users[userId] = { username, exercises: [] };
  res.json({ username, _id: userId });
});

// Route to get all users
app.get('/api/users', (req, res) => {
  const allUsers = Object.keys(users).map(userId => ({
    _id: userId,
    username: users[userId].username
  }));
  res.json(allUsers);
});

// Route to add exercises for a specific user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const exercise = {
    description,
    duration: parseInt(duration, 10),
    date: date || new Date().toISOString().split('T')[0] // Default to current date if not provided
  };

  users[userId].exercises.push(exercise);

  // Return the user object with the newly added exercise
  res.json({
    username: users[userId].username,
    _id: userId,
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString() // Ensure the date format is consistent
  });
});

// Route to get user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  if (!users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  let exercises = users[userId].exercises;

  // Filter exercises based on 'from' and 'to' dates
  if (from) {
    exercises = exercises.filter(ex => new Date(ex.date) >= new Date(from));
  }
  if (to) {
    exercises = exercises.filter(ex => new Date(ex.date) <= new Date(to));
  }

  // Apply limit
  if (limit) {
    exercises = exercises.slice(0, parseInt(limit, 10));
  }

  // Format date as a string in dateString format
  exercises = exercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString() // Convert to dateString format
  }));

  res.json({
    _id: userId,
    username: users[userId].username,
    count: exercises.length,
    log: exercises
  });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
