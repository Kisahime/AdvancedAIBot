require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const chatRoutes = require('./api/routes/chatRoutes');
const memoryRoutes = require('./api/routes/memoryRoutes');
const browsingRoutes = require('./api/routes/browsingRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import MongoDB Memory Server
const { MongoMemoryServer } = require('mongodb-memory-server');

// Connect to MongoDB using in-memory server with persistence
async function connectToMongoDB() {
  try {
    // Create an in-memory MongoDB instance that persists data between server restarts
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        // Set storage engine to persist data between server restarts
        storageEngine: 'wiredTiger',
        dbPath: path.join(__dirname, '../data/mongodb')
      }
    });
    
    const mongoUri = mongoServer.getUri();
    
    // Use the MongoDB URI from environment variables in production
    // or the in-memory MongoDB with persistence in development
    const uri = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : mongoUri;
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    console.log(`Using ${process.env.NODE_ENV === 'production' ? 'production database' : 'persistent in-memory database'}`);
    console.log(`Database path: ${process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : path.join(__dirname, '../data/mongodb')}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with failure
  }
}

// Initialize MongoDB connection
connectToMongoDB();

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/browsing', browsingRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});