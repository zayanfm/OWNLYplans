const express = require('express');
const cors = require('cors');
const env = require('./config/env');

const authRoutes = require('./routes/auth');
const sgfindexRoutes = require('./routes/sgfindex');
const financeRoutes = require('./routes/finance');
const configRoutes = require('./routes/config');
const agentsRoutes = require('./routes/agents');
const rmRoutes = require('./routes/rm');

const app = express();

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    version: '1.0.0',
    service: 'OWNLYplans AI Core Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sgfindex', sgfindexRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/rm', rmRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Export app for testing
if (process.env.NODE_ENV !== 'test') {
  const PORT = env.PORT;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`  OWNLYplans API Engine Running on port ${PORT}`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
