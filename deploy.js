
// #!/usr/bin/env node

/**
 * Deployment script for SISAF
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting deployment process...');

try {
  // Build the application
  console.log('Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  
  // Create a simple server for production
  const serverContent = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Add health check endpoint for Replit deployments
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Make sure to bind to 0.0.0.0 for Replit deployments
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Production server running on port \${PORT} (http://0.0.0.0:\${PORT})\`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`;

  // Ensure the directory exists
  fs.mkdirSync('dist/server', { recursive: true });
  
  // Write the simple production server - always update to ensure latest config
  const productionFilePath = 'dist/server/index.js';
  fs.writeFileSync(productionFilePath, serverContent);
  console.log('Created production server file');
  
  // Make sure the server file is executable
  try {
    fs.chmodSync(productionFilePath, '755');
    console.log('Made server file executable');
  } catch (error) {
    console.warn('Could not make server file executable:', error);
  }
  
  console.log('Deployment preparation complete!');
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
