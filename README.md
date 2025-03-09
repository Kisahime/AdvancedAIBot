# Advanced AI Chatbot

An intelligent chatbot with web browsing capabilities, advanced memory management, and autonomous reasoning.

## Features

- **Natural Language Understanding**: Advanced NLP for understanding complex user queries
- **Web Browsing**: Ability to search and extract information from the web
- **Memory Management**: Short-term and long-term memory for contextual conversations
- **Autonomous Reasoning**: Independent thinking and problem-solving capabilities
- **Responsive UI**: Modern, user-friendly interface

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB for memory storage
- **NLP**: Transformer-based models for language understanding
- **Web Scraping**: Puppeteer for web browsing capabilities

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
   This will install both server and client dependencies.
3. Set up environment variables:
   - Copy the `.env.example` file to `.env` (if available) or create a new `.env` file
   - Update the environment variables with your own values, especially the MongoDB connection string and OpenAI API key

## Starting the Application

You can start the application in several ways:

### Option 1: Development Mode (Separate Server and Client)

Run the development server with:
```
npm run dev
```
This will start both the backend server and frontend client in development mode with hot reloading.

### Option 2: Using the Start Script (Combined Server and Client)

For a simpler startup process, use:
```
node start-app.js
```
Or use the provided batch file (Windows):
```
start.bat
```

This script will:
1. Start the backend server
2. Start the frontend client
3. Provide colored console output for both processes
4. Automatically handle process cleanup on exit

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Batch Files (Windows)

The project includes two batch files for easy setup and execution on Windows systems:

### install.bat

This batch file automates the installation process:
- Checks if Node.js is installed
- Creates necessary directories
- Installs server dependencies
- Installs client dependencies

To use it, simply double-click the file or run it from the command prompt:
```
install.bat
```

### start.bat

This batch file provides an easy way to start the application:
- Checks if Node.js is installed
- Runs the start-app.js script which launches both server and client
- Provides clear console output

To use it, simply double-click the file or run it from the command prompt:
```
start.bat
```

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Node.js server
- `/server/models` - Data models and database schemas
- `/server/services` - Core services (memory, reasoning, web browsing)
- `/server/api` - API routes and controllers