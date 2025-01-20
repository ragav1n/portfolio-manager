const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI; // Use connection string from .env
const DATABASE_NAME = 'Portfolio_Management';
const COLLECTION_NAME = 'realtime_prices';

app.use(cors());

// API route to fetch the latest market data
app.get('/api/market-data/latest', async (req, res) => {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // MongoDB aggregation pipeline to fetch the latest data for each stock
    const pipeline = [
      { $sort: { timestamp: -1 } }, // Sort by latest timestamp
      {
        $group: {
          _id: '$symbol', // Group by stock symbol
          symbol: { $first: '$symbol' },
          price: { $first: '$price' },
          timestamp: { $first: '$timestamp' },
        },
      },
    ];

    const latestData = await collection.aggregate(pipeline).toArray();

    // Convert data to a key-value format
    const formattedData = latestData.reduce((acc, item) => {
      acc[item.symbol] = {
        symbol: item.symbol,
        price: item.price,
        timestamp: item.timestamp,
      };
      return acc;
    }, {});

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
