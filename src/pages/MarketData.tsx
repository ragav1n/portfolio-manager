import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { supabase } from '../lib/supabase';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: string;
}

export default function MarketData() {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<Record<string, MarketData[]>>({});

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data, error } = await supabase
          .from('market_data')
          .select('*')
          .order('timestamp', { ascending: true });

        if (error) throw error;

        // Group data by symbol
        const groupedData = (data || []).reduce((acc: Record<string, MarketData[]>, item) => {
          if (!acc[item.symbol]) {
            acc[item.symbol] = [];
          }
          acc[item.symbol].push(item);
          return acc;
        }, {});

        setMarketData(groupedData);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
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

      {Object.entries(marketData).map(([symbol, data]) => (
        <Grid item xs={12} md={6} key={symbol}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {symbol}
            </Typography>
            <Box sx={{ height: 300 }}>
              <LineChart
                xAxis={[{
                  data: data.map((_, index) => index),
                  valueFormatter: (index) => new Date(data[index].timestamp).toLocaleDateString(),
                }]}
                series={[{
                  data: data.map(d => d.price),
                  area: true,
                }]}
                height={300}
              />
            </Box>
            <Typography variant="h6" color="primary" align="right">
              Current Price: ${data[data.length - 1].price.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}