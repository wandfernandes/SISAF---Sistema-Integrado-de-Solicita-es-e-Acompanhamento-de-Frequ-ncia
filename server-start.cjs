
/**
 * Server bootstrap file to start the application
 * Compatible with CommonJS to ensure it works in all environments
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting SISAF server...');

// Check if we're in production or development
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('Running in production mode');
  // Run the production server (built version)
  const server = spawn('node', ['dist/server/index.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  server.on('error', (err) => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
} else {
  console.log('Running in development mode');
  // For development, use tsx to run TypeScript directly
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    }
  });
  
  server.on('error', (err) => {
    console.error('Failed to start development server:', err);
    process.exit(1);
  });
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
