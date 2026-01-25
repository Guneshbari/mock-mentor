const express = require('express');
const cors = require('cors');
const interviewRoutes = require('./routes/interview.routes');

const app = express();

// Enable CORS with proper configuration
// Allow all origins in development (restrict in production)
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // true allows all origins
  credentials: true,
}));

// Enable JSON parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ignore favicon requests (API-only backend)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint - API information (must be before other routes)
app.get('/', (req, res) => {
  res.json({
    message: 'MockMentor Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'POST /api/interview/start': 'Initialize a new interview session',
      'POST /api/interview/next': 'Process next step in interview',
      'GET /api/interview/report': 'Get final interview report (query param: sessionId)',
      'GET /health': 'Health check endpoint'
    },
    note: 'This is an API-only backend. Use the frontend application to interact with the interview system.'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount interview routes at /api/interview
app.use('/api/interview', interviewRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path,
    availableRoutes: [
      'GET /',
      'POST /api/interview/start',
      'POST /api/interview/next',
      'GET /api/interview/report',
      'GET /health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
