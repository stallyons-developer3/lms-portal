require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

console.log('=================================');
console.log('🚀 server.js LOADED successfully!');
console.log('=================================');

const app = express();

connectDB();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({ message: 'LMS API is running' });
});

app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Pong! Backend is working perfectly 🎉',
    timestamp: new Date().toISOString(),
    server: 'Vercel Serverless',
    project: 'LMS Portal',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));

app.use((err, req, res, next) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ GLOBAL ERROR HANDLER');
  console.error('Message:', err?.message);
  console.error('Name:', err?.name);
  console.error('Stack:', err?.stack);
  console.error('Full:', JSON.stringify(err, Object.getOwnPropertyNames(err || {}), 2));
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const status = err?.status || err?.statusCode || 500;
  res.status(status).json({
    message: err?.message || 'Server error',
    name: err?.name,
    code: err?.code,
  });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
