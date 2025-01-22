import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import axios from 'axios';

import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

// Types
interface Investment {
  id: string;
  type: 'Real Estate' | 'Stocks' | 'Bonds' | 'Crypto' | 'Deposits';
  value: number;
  risk: 'Low' | 'Medium' | 'High';
  sector: string;
  asset_name: string;
  portfolio_id: string;
}

interface MarketData {
  _id: string;
  ticker: string;
  close: number;
  timestamp: string;
}

interface AnalysisReport {
  id: string;
  risk: 'Low' | 'Medium' | 'High';
  prediction: string;
  created_at: string;
}

// Constants
const DEFAULT_STOCK_SUGGESTIONS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
] as const;

const RISK_SCORES = {
  'Low': 1,
  'Medium': 2,
  'High': 3,
} as const;

const ASSET_TYPES = ['Real Estate', 'Stocks', 'Bonds', 'Crypto', 'Deposits'] as const;

export default function Suggestions() {
  // Hooks
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  // Data Fetching Functions
  const fetchMarketData = async () => {
    try {
      const response = await axios.get<MarketData[]>('http://localhost:5000/api/market-data', {
        timeout: 5000
      });
      
      const transformedData = response.data.map(item => ({
        _id: item._id,
        ticker: item.ticker,
        close: item.close,
        timestamp: item.timestamp
      }));
      
      setMarketData(transformedData);
    } catch {
      setMarketData([]); // Silently fail and use default suggestions
    }
  };

  const fetchInvestments = async () => {
    if (!user) return;

    try {
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id);

      if (portfoliosError) throw portfoliosError;
      
      if (!portfolios?.length) {
        setInvestments([]);
        return;
      }

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .in('portfolio_id', portfolios.map(p => p.id));

      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      console.error('Error fetching investments:', (err as Error).message);
    }
  };

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
    } catch (err) {
      console.error('Error fetching reports:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Suggestion Generation Functions
  const generateDiversificationSuggestions = (investments: Investment[]) => {
    const suggestions: string[] = [];
    const assetTypes = new Set(investments.map(inv => inv.type));
    const sectors = new Set(investments.map(inv => inv.sector));
    
    const missingAssetTypes = ASSET_TYPES.filter(type => !assetTypes.has(type));
    
    if (missingAssetTypes.length) {
      suggestions.push(
        `Consider diversifying into ${missingAssetTypes.join(', ')} to create a more balanced portfolio.`
      );
    }

    if (sectors.size < 4) {
      suggestions.push('Your portfolio could benefit from broader sector diversification.');
    }

    return suggestions;
  };

  const generateMarketBasedSuggestions = (marketData: MarketData[]) => {
    if (marketData.length) {
      const sortedStocks = [...marketData]
        .sort((a, b) => b.close - a.close)
        .slice(0, 3);
      
      return [
        `Consider these trending stocks based on market data: ${
          sortedStocks.map(s => s.ticker).join(', ')
        }.`
      ];
    }

    const randomStocks = [...DEFAULT_STOCK_SUGGESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    return [
      `Consider these well-established stocks: ${
        randomStocks.map(s => `${s.ticker} (${s.name})`).join(', ')
      }.`
    ];
  };

  const generateRiskBasedSuggestions = (investments: Investment[]) => {
    if (!investments.length) {
      return ['Start building your portfolio with a mix of low and medium risk investments.'];
    }
    
    const avgRisk = investments.reduce((sum, inv) => sum + RISK_SCORES[inv.risk], 0) / investments.length;
    
    if (avgRisk <= 1.5) {
      return [
        'Your portfolio is conservative. Consider adding growth investments for potentially higher returns:',
        '• Look into technology sector ETFs',
        '• Consider small-cap stocks for growth potential',
        '• Explore emerging market investments',
      ];
    }
    
    if (avgRisk >= 2.5) {
      return [
        'Your portfolio is aggressive. Consider adding stability:',
        '• Add government bonds for safety',
        '• Consider blue-chip dividend stocks',
        '• Look into real estate investment trusts (REITs)',
      ];
    }

    return [];
  };

  const generateAlternativeInvestments = () => [
    'Alternative investment opportunities to consider:',
    '• Real Estate: Commercial properties, REITs, or rental properties',
    '• Precious Metals: Gold, silver, or platinum as inflation hedges',
    '• Peer-to-Peer Lending: Consider platforms for direct lending',
    '• Art and Collectibles: Research high-value collectibles markets',
    '• Green Energy Projects: Solar and wind energy investments',
  ];

  // Main Generation Function
  const generateSuggestions = async () => {
    if (!user) return;

    setAnalyzing(true);
    setError(null);
    
    try {
      await Promise.all([fetchInvestments(), fetchMarketData()]);

      if (!investments) {
        throw new Error('No investment data available');
      }

      const allSuggestions = [
        ...generateDiversificationSuggestions(investments),
        ...generateMarketBasedSuggestions(marketData),
        ...generateRiskBasedSuggestions(investments),
        ...generateAlternativeInvestments(),
      ];

      const selectedSuggestions = [...allSuggestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const avgRisk = investments.length
        ? investments.reduce((sum, inv) => sum + RISK_SCORES[inv.risk], 0) / investments.length
        : 1;
      const currentRisk = avgRisk <= 1.5 ? 'Low' : avgRisk <= 2.5 ? 'Medium' : 'High';

      let portfolioId = investments[0]?.portfolio_id;
      
      if (!portfolioId) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert([{ user_id: user.id, total_investments: 0 }])
          .select()
          .single();

        if (createError) throw createError;
        portfolioId = newPortfolio.id;
      }

      const { error: insertError } = await supabase
        .from('analysis_reports')
        .insert([{
          user_id: user.id,
          portfolio_id: portfolioId,
          risk: currentRisk as 'Low' | 'Medium' | 'High',
          prediction: selectedSuggestions.join('\n\n'),
        }]);

      if (insertError) throw insertError;
      await fetchReports();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Effects
  useEffect(() => {
    if (user) {
      Promise.all([fetchInvestments(), fetchMarketData(), fetchReports()]);
    }
  }, [user]);

  // Loading State
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render
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

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {(!reports?.length) && (
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
      )}

      {reports.map((report) => (
        <Grid item xs={12} key={report.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Portfolio Analysis Report
                </Typography>
                <Typography color="text.secondary">
                  {new Date(report.created_at).toLocaleString()}
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
              
              {report.prediction.split('\n\n').map((suggestion, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    mb: 1,
                    pl: suggestion.startsWith('•') ? 2 : 0
                  }}
                >
                  {suggestion}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}