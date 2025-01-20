import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import { PieChart } from '@mui/x-charts';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Investment {
  id: string;
  asset_name: string;
  type: string;
  value: number;
  risk: 'Low' | 'Medium' | 'High';
  sector: string;
}

interface PortfolioData {
  totalValue: number;
  investments: Investment[];
  assetAllocation: {
    type: string;
    value: number;
  }[];
  sectorAllocation: {
    sector: string;
    value: number;
  }[];
}

export default function Portfolio() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user) return;

      try {
        // Ensure user has a portfolio
        const { data: portfolios, error: portfolioError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', user.id);

        if (portfolioError) throw portfolioError;

        // Create portfolio if it doesn't exist
        let portfolioId;
        if (!portfolios || portfolios.length === 0) {
          const { data: newPortfolio, error: createError } = await supabase
            .from('portfolios')
            .insert([
              {
                user_id: user.id,
                total_investments: 0
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          portfolioId = newPortfolio.id;
        } else {
          portfolioId = portfolios[0].id;
        }

        // Fetch investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('*')
          .eq('portfolio_id', portfolioId);

        if (investmentsError) throw investmentsError;

        if (!investments || investments.length === 0) {
          setPortfolioData({
            totalValue: 0,
            investments: [],
            assetAllocation: [],
            sectorAllocation: [],
          });
          setLoading(false);
          return;
        }

        const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);

        // Calculate asset allocation
        const assetAllocation = investments.reduce((acc: any[], inv) => {
          const existing = acc.find(a => a.type === inv.type);
          if (existing) {
            existing.value += inv.value;
          } else {
            acc.push({ type: inv.type, value: inv.value });
          }
          return acc;
        }, []);

        // Calculate sector allocation
        const sectorAllocation = investments.reduce((acc: any[], inv) => {
          const existing = acc.find(a => a.sector === inv.sector);
          if (existing) {
            existing.value += inv.value;
          } else {
            acc.push({ sector: inv.sector, value: inv.value });
          }
          return acc;
        }, []);

        setPortfolioData({
          totalValue,
          investments,
          assetAllocation,
          sectorAllocation,
        });
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!portfolioData || portfolioData.investments.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" gutterBottom>No investments in your portfolio</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/investments')}
        >
          Add Your First Investment
        </Button>
      </Box>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Portfolio Analysis
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Asset Allocation
          </Typography>
          <Box sx={{ height: 300 }}>
            <PieChart
              series={[
                {
                  data: portfolioData.assetAllocation.map(item => ({
                    id: item.type,
                    value: item.value,
                    label: item.type,
                  })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30 },
                },
              ]}
              height={300}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sector Allocation
          </Typography>
          <Box sx={{ height: 300 }}>
            <PieChart
              series={[
                {
                  data: portfolioData.sectorAllocation.map(item => ({
                    id: item.sector,
                    value: item.value,
                    label: item.sector,
                  })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30 },
                },
              ]}
              height={300}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Investment Details
        </Typography>
        <Grid container spacing={2}>
          {portfolioData.investments.map((investment) => (
            <Grid item xs={12} sm={6} md={4} key={investment.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {investment.asset_name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {investment.type}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    ${investment.value.toLocaleString()}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={investment.risk}
                      color={getRiskColor(investment.risk) as any}
                      size="small"
                    />
                    <Chip
                      label={investment.sector}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}