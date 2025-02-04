import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import axios from 'axios';

interface MarketData {
  _id: string;
  symbol: string;
  price: number;
  timestamp: string;
}

export default function MarketData() {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMarketData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/market-data');

        if (mounted && response.data) {
          setMarketData(response.data);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching market data:', err);
          setError('Failed to fetch market data. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMarketData();

    const interval = setInterval(fetchMarketData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Group market data by symbol
  const groupedData: Record<string, MarketData[]> = marketData.reduce((acc, data) => {
    if (!acc[data.symbol]) {
      acc[data.symbol] = [];
    }
    acc[data.symbol].push(data);
    return acc;
  }, {} as Record<string, MarketData[]>);

  const fillMissingData = (data: MarketData[]) => {
    if (data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const timestamps = sortedData.map((entry) => new Date(entry.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    const filledData: { timestamp: number; price: number }[] = [];
    let lastKnownPrice = sortedData[0].price;
    const interval = 60 * 1000;

    for (let time = minTime; time <= maxTime; time += interval) {
      const existingData = sortedData.find((d) => new Date(d.timestamp).getTime() === time);

      if (existingData) {
        lastKnownPrice = existingData.price;
      } else {
        // Simulate a slight upward or downward trend if no data for this timestamp
        lastKnownPrice += Math.random() > 0.5 ? 0.5 : -0.5; // Random small price change
      }

      filledData.push({ timestamp: time, price: lastKnownPrice });
    }

    return filledData;
  };

  const renderChart = (data: MarketData[]) => {
    const filledData = fillMissingData(data);
    const timestamps = filledData.map((entry) => entry.timestamp);
    const prices = filledData.map((entry) => entry.price);

    return (
      <LineChart
        xAxis={[{
          data: timestamps,
          valueFormatter: (value) => new Date(value).toLocaleString(),
        }]}
        series={[{
          data: prices,
          area: true,
          label: data[0].symbol,
        }]}
        height={200}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!marketData || marketData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6">No market data available</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Market Data
        </Typography>
      </Grid>

      {Object.entries(groupedData).map(([symbol, data]) => (
        <Grid item xs={12} md={6} key={symbol}>
          <Card
            sx={{
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: expandedCard === symbol ? 'scale(1.1)' : 'scale(1)',
              boxShadow: expandedCard === symbol ? 10 : 3,
              cursor: 'pointer',
            }}
            onMouseEnter={() => setExpandedCard(symbol)}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <CardActionArea>
              <CardContent>
                <Typography variant="h6">{symbol}</Typography>
                <Typography variant="h5" color="primary">
                  ${data[data.length - 1].price.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(data[data.length - 1].timestamp).toLocaleString()}
                </Typography>
                {/* Expand to show graph when hovered */}
                {expandedCard === symbol && (
                  <Box mt={2}>
                    {renderChart(data)}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
