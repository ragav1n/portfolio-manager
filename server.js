import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not defined in the environment variables');
  process.exit(1);
}

const client = new MongoClient(uri);
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    db = client.db('Portfolio_Management'); // Explicitly specify the database name
    console.log('Connected to MongoDB');
    
    // Test the connection by accessing the collection
    const collection = db.collection('realtime_prices');
    const testDoc = await collection.findOne({});
    if (testDoc) {
      console.log('Successfully accessed the "realtime_prices" collection.');
    } else {
      console.warn('The "realtime_prices" collection is empty.');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the process if unable to connect
  }
}

// Ensure the database connection is established before handling requests
async function ensureDBConnection(req, res, next) {
  if (!db) {
    console.log('Re-establishing database connection...');
    try {
      await connectToMongoDB();
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return res.status(500).json({ error: 'Database connection failed.' });
    }
  }
  next();
}

// Initialize database connection
connectToMongoDB().catch(console.error);

// API to get market data
app.get('/api/market-data', ensureDBConnection, async (req, res) => {
  try {
    console.log('Fetching market data...');
    const collection = db.collection('realtime_prices');
    const data = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    if (!data || data.length === 0) {
      console.warn('No data found in the "realtime_prices" collection.');
      return res.status(404).json({ error: 'No market data available.' });
    }

    // Transform the data to match the expected format
    const transformedData = data.map(item => ({
      _id: item._id.toString(),
      symbol: item.ticker || 'Unknown',
      price: item.close || item.price || 0,
      timestamp: item.timestamp || new Date().toISOString(),
    }));

    console.log('Fetched Data:', transformedData);

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server only after establishing the database connection
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
