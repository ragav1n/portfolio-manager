import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Investment {
  id: string;
  asset_name: string;
  type: string;
  value: number;
  risk: 'Low' | 'Medium' | 'High';
  sector: string;
}

const INVESTMENT_TYPES = ['Real Estate', 'Stocks', 'Bonds', 'Crypto', 'Deposits'];
const RISK_LEVELS = ['Low', 'Medium', 'High'];
const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial'];

export default function Investments() {
  const { user } = useAuthStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    type: '',
    value: '',
    risk: '',
    sector: '',
  });

  const columns: GridColDef[] = [
    { field: 'asset_name', headerName: 'Asset Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    {
      field: 'value',
      headerName: 'Value',
      flex: 1,
      renderCell: (params) => `$${params.value.toLocaleString()}`,
    },
    { field: 'risk', headerName: 'Risk Level', flex: 1 },
    { field: 'sector', headerName: 'Sector', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchInvestments();
  }, [user]);

  const fetchInvestments = async () => {
    if (!user) return;

    try {
      // First, ensure user has a portfolio
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
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);

      if (investmentsError) throw investmentsError;
      setInvestments(investmentsData || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      asset_name: investment.asset_name,
      type: investment.type,
      value: investment.value.toString(),
      risk: investment.risk,
      sector: investment.sector,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get or create portfolio
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user!.id);

      if (portfolioError) throw portfolioError;

      let portfolioId;
      if (!portfolios || portfolios.length === 0) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert([
            {
              user_id: user!.id,
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

      const investment = {
        user_id: user!.id,
        portfolio_id: portfolioId,
        asset_name: formData.asset_name,
        type: formData.type,
        value: parseFloat(formData.value),
        risk: formData.risk as 'Low' | 'Medium' | 'High',
        sector: formData.sector,
      };

      if (editingInvestment) {
        const { error } = await supabase
          .from('investments')
          .update(investment)
          .eq('id', editingInvestment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('investments')
          .insert([investment]);
        if (error) throw error;
      }

      // Update portfolio total
      const { data: currentInvestments, error: investmentsError } = await supabase
        .from('investments')
        .select('value')
        .eq('portfolio_id', portfolioId);

      if (investmentsError) throw investmentsError;

      const totalInvestments = (currentInvestments || [])
        .reduce((sum, inv) => sum + inv.value, 0);

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({ total_investments: totalInvestments })
        .eq('id', portfolioId);

      if (updateError) throw updateError;

      setOpenDialog(false);
      setEditingInvestment(null);
      setFormData({
        asset_name: '',
        type: '',
        value: '',
        risk: '',
        sector: '',
      });
      await fetchInvestments();
    } catch (error) {
      console.error('Error saving investment:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Investments</Typography>
          <Button
            variant="contained"
            onClick={() => {
              setEditingInvestment(null);
              setFormData({
                asset_name: '',
                type: '',
                value: '',
                risk: '',
                sector: '',
              });
              setOpenDialog(true);
            }}
          >
            Add Investment
          </Button>
        </Grid>
        <Grid item xs={12}>
          <DataGrid
            rows={investments}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
          />
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingInvestment ? 'Edit Investment' : 'Add Investment'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Asset Name"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Risk Level"
                  value={formData.risk}
                  onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                  required
                >
                  {RISK_LEVELS.map((risk) => (
                    <MenuItem key={risk} value={risk}>
                      {risk}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  required
                >
                  {SECTORS.map((sector) => (
                    <MenuItem key={sector} value={sector}>
                      {sector}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInvestment ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}