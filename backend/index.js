const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Basic Route
app.get('/', (req, res) => {
  res.send('FlexAI Backend API is running...');
});

// Routes Placeholder
app.use('/api/auth',     require('./src/routes/auth.routes'));
app.use('/api/users',    require('./src/routes/user.routes'));
app.use('/api/workouts', require('./src/routes/workout.routes'));
app.use('/api/meals',    require('./src/routes/meal.routes'));
app.use('/api/foods',    require('./src/routes/food.routes'));
app.use('/api/water',    require('./src/routes/water.routes'));
app.use('/api/chat',     require('./src/routes/chat.routes'));

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep process alive
setInterval(() => {}, 60000);
