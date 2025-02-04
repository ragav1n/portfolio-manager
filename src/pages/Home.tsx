import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, TextField } from '@mui/material';
import { supabase } from '../lib/supabase'; // Make sure this import path is correct

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Sign Up function
  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      navigate('/login'); // Navigate to login page on successful signup
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  // Sign In function
  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate('/dashboard'); // Navigate to dashboard page on successful login
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

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
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              variant="outlined"
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <Typography color="error">{error}</Typography>}

             <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleSignIn}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Sign In
            </Button>
            <div class="flex items-center">
            <p>OR</p>
            </div>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSignUp}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Create Account
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
