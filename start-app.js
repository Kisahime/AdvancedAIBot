const { spawn } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  server: '\x1b[36m', // Cyan
  client: '\x1b[32m', // Green
  error: '\x1b[31m', // Red
  info: '\x1b[33m',  // Yellow
  reset: '\x1b[0m'   // Reset
};

// Log with timestamp and color
function log(source, message, isError = false) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const color = isError ? colors.error : (source === 'Server' ? colors.server : colors.client);
  console.log(`${colors.info}[${timestamp}]${colors.reset} ${color}[${source}]${colors.reset} ${message}`);
}

// Store child processes to handle cleanup
const processes = [];

// Handle graceful shutdown
function cleanup() {
  log('App', 'Shutting down all processes...', false);
  processes.forEach(process => {
    if (!process.killed) {
      process.kill();
    }
  });
}

// Set up cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Start the server
function startServer() {
  return new Promise((resolve, reject) => {
    log('App', 'Starting server...');
    
    const serverProcess = spawn('node', ['server/index.js'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true
    });
    
    processes.push(serverProcess);
    
    // Handle server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      log('Server', output);
      
      // Check for server ready message
      if (output.includes('Server running on port')) {
        log('App', 'Server started successfully!');
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      log('Server', data.toString().trim(), true);
    });
    
    serverProcess.on('error', (error) => {
      log('Server', `Failed to start server: ${error.message}`, true);
      reject(error);
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        log('Server', `Server process exited with code ${code}`, true);
        reject(new Error(`Server process exited with code ${code}`));
      }
    });
    
    // Set a timeout in case the server doesn't start properly
    setTimeout(() => {
      if (!serverProcess.killed) {
        log('App', 'Server startup timeout - continuing anyway...', true);
        resolve(serverProcess);
      }
    }, 10000); // 10 seconds timeout
  });
}

// Start the client
function startClient() {
  return new Promise((resolve, reject) => {
    log('App', 'Starting client...');
    
    const clientProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'client'),
      stdio: 'pipe',
      shell: true
    });
    
    processes.push(clientProcess);
    
    // Handle client output
    clientProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      log('Client', output);
      
      // Check for client ready message
      if (output.includes('Compiled successfully') || output.includes('Local:')) {
        log('App', 'Client started successfully!');
        resolve(clientProcess);
      }
    });
    
    clientProcess.stderr.on('data', (data) => {
      log('Client', data.toString().trim(), true);
    });
    
    clientProcess.on('error', (error) => {
      log('Client', `Failed to start client: ${error.message}`, true);
      reject(error);
    });
    
    clientProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        log('Client', `Client process exited with code ${code}`, true);
        reject(new Error(`Client process exited with code ${code}`));
      }
    });
  });
}

// Main function to start both server and client
async function startApp() {
  try {
    log('App', 'Starting application...');
    
    // Start server first
    await startServer();
    
    // Then start client
    await startClient();
    
    log('App', 'Both server and client are running!');
    log('App', 'Press Ctrl+C to stop all processes.');
  } catch (error) {
    log('App', `Error starting application: ${error.message}`, true);
    cleanup();
    process.exit(1);
  }
}

// Start the application
startApp();