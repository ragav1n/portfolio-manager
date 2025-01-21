import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
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

  const renderChart = (data: MarketData) => {
    try {
      const timestamp = new Date(data.timestamp).getTime();

      return (
        <LineChart
          xAxis={[{
            data: [timestamp],
            valueFormatter: (value) => new Date(value).toLocaleString(),
          }]}
          series={[{
            data: [data.price],
            area: true,
            label: data.symbol,
          }]}
          height={300}
        />
      );
    } catch (err) {
      console.error('Error rendering chart:', err);
      return (
        <Typography color="error" align="center">
          Error displaying chart
        </Typography>
      );
    }
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

  // Remove duplicate stocks
  const uniqueStocks = Array.from(
    new Map(marketData.map((item) => [item.symbol, item])).values()
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Market Data
        </Typography>
      </Grid>

      {uniqueStocks.map((data) => (
        <Grid item xs={12} md={6} key={data._id}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {data.symbol}
            </Typography>
            <Box sx={{ height: 300 }}>
              {renderChart(data)}
            </Box>
            <Typography variant="h6" color="primary" align="right">
              Current Price: ${data.price.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="right">
              Last Updated: {new Date(data.timestamp).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
  