import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthGuard } from './components/AuthGuard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Form from './pages/Form';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Investments from './pages/Investments';
import MarketData from './pages/MarketData';
import Suggestions from './pages/Suggestions';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected form route */}
          <Route
            path="/form"
            element={
              <AuthGuard>
                <Form />
              </AuthGuard>
            }
          />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="investments" element={<Investments />} />
            <Route path="market-data" element={<MarketData />} />
            <Route path="suggestions" element={<Suggestions />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
