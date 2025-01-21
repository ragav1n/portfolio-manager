import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography component="h1" variant="h2" align="center" sx={{ mb: 2 }}>
          Welcome to Portfolio Manager
        </Typography>

        <Typography variant="h5" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Track, manage, and analyze your investments in one place
        </Typography>

        <Paper 
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Get Started
          </Typography>

          <Box sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate(‘/Register')}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Create Account
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate(‘/Login')}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Take control of your financial future with our comprehensive portfolio management tools.
        </Typography>
      </Box>
    </Container>
  );
}