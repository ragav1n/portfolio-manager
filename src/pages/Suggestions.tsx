import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AnalysisReport {
  id: string;
  risk: 'Low' | 'Medium' | 'High';
  prediction: string;
  created_at: string;
}

export default function Suggestions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const navigate = useNavigate();

  const fetchReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const generateSuggestions = async () => {
    if (!user) return;

    setAnalyzing(true);
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
        throw new Error('No investments found');
      }

      // Calculate portfolio metrics
      const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
      const riskScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
      const avgRisk = investments.reduce((sum, inv) => sum + riskScores[inv.risk], 0) / investments.length;
      const currentRisk = avgRisk <= 1.5 ? 'Low' : avgRisk <= 2.5 ? 'Medium' : 'High';

      // Generate suggestions based on portfolio analysis
      let suggestions = [];
      const assetTypes = new Set(investments.map(inv => inv.type));
      const sectors = new Set(investments.map(inv => inv.sector));

      // Diversification suggestions
      if (assetTypes.size < 3) {
        suggestions.push('Consider diversifying into more asset types to reduce risk.');
      }
      if (sectors.size < 4) {
        suggestions.push('Adding investments in different sectors could improve portfolio balance.');
      }

      // Risk-based suggestions
      if (currentRisk === 'Low') {
        suggestions.push('Your portfolio is conservative. Consider adding some growth investments for potentially higher returns.');
      } else if (currentRisk === 'High') {
        suggestions.push('Your portfolio is aggressive. Consider adding some stable investments to balance risk.');
      }

      // Create analysis report
      const { error: insertError } = await supabase
        .from('analysis_reports')
        .insert([{
          user_id: user.id,
          portfolio_id: portfolioId,
          risk: currentRisk as 'Low' | 'Medium' | 'High',
          prediction: suggestions.join(' '),
        }]);

      if (insertError) throw insertError;
      await fetchReports();
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Portfolio Suggestions</Typography>
          <Button
            variant="contained"
            onClick={generateSuggestions}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Generate New Suggestions'}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography gutterBottom>
              No analysis reports available.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/investments')}
              sx={{ mt: 2 }}
            >
              Add Investments First
            </Button>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Portfolio Suggestions</Typography>
        <Button
          variant="contained"
          onClick={generateSuggestions}
          disabled={analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Generate New Suggestions'}
        </Button>
      </Grid>

      {reports.map((report) => (
        <Grid item xs={12} key={report.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Analysis Report
                </Typography>
                <Typography color="text.secondary">
                  {new Date(report.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={`Risk Level: ${report.risk}`}
                  color={
                    report.risk === 'Low' ? 'success' :
                    report.risk === 'Medium' ? 'warning' : 'error'
                  }
                />
              </Box>
              <Typography variant="body1">
                {report.prediction}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}