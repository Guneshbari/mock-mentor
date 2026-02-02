const express = require('express');
const cors = require('cors');
const interviewRoutes = require('./routes/interview.routes');

const app = express();

// ============================================
// RATE LIMITING MIDDLEWARE (Simple In-Memory)
// ============================================
const rateLimitStore = new Map();

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per window

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const requests = rateLimitStore.get(ip);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
    });
  }

  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);

  // Cleanup old entries periodically
  if (now % 1000 === 0) { // Every ~1000ms
    rateLimitStore.forEach((times, key) => {
      const valid = times.filter(time => now - time < windowMs);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, valid);
      }
    });
  }

  next();
};

// Apply rate limiting to all routes
app.use(rateLimit);

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001']; // Default for development

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ============================================
// SECURITY HEADERS
// ============================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// AUTH MIDDLEWARE
// ============================================
const extractUser = require('./middleware/auth.middleware');
app.use(extractUser); // Extract userId from Supabase JWT

// Ignore favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ============================================
// ENHANCED LOGGING MIDDLEWARE
// ============================================
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);

  // Log response when finished
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`[${timestamp}] Response ${res.statusCode} - ${req.method} ${req.path}`);

    // Log errors
    if (res.statusCode >= 400) {
      console.error(`[ERROR] ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${ip}`);
    }

    originalSend.call(this, data);
  };

  next();
};

app.use(logRequest);

// ============================================
// API ROUTES
// ============================================

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    message: 'MockMentor Backend API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      'POST /api/interview/start': 'Initialize a new interview session',
      'POST /api/interview/next': 'Process next step in interview',
      'GET /api/interview/report': 'Get final interview report (query param: sessionId)',
      'GET /health': 'Health check endpoint'
    },
    rateLimit: {
      window: '15 minutes',
      maxRequests: 100
    },
    note: 'This is an API-only backend. Use the frontend application to interact with the interview system.'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount interview routes
app.use('/api/interview', interviewRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] 404 - Route not found: ${req.method} ${req.path}`);

  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    timestamp,
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
  const timestamp = new Date().toISOString();
  const errorId = Date.now().toString(36); // Simple error ID

  // Log full error details
  console.error(`[${timestamp}] [ERROR_ID: ${errorId}]`);
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });

  // Send sanitized error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    errorId,
    timestamp
  });
});

module.exports = app;
