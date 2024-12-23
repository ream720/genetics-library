import React, { useState } from "react";
import { lightTheme, darkTheme } from "./theme";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  CssBaseline,
  ThemeProvider,
  Switch,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SeedsPage from "./pages/SeedsPage";
import { SeedProvider } from "./context/SeedContext";
import ClonesPage from "./pages/ClonesPage";
import { CloneProvider } from "./context/CloneContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import useIdleTimer from "./hooks/useIdleTimer";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// PrivateRoute component to protect routes that require authentication
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// AppWithRouter component with routing and theme
const AppWithRouter: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { currentUser, logout } = useAuth(); // Get currentUser and logout from context
  const navigate = useNavigate();

  const handleThemeChange = () => {
    setIsDarkMode(!isDarkMode);
  };

  const location = useLocation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Set timeout to 15 minutes (900000 milliseconds)
  const IDLE_TIMEOUT = 900000;

  // Call useIdleTimer hook
  useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: handleLogout, // Pass handleLogout as the onIdle callback
  });

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Genetics Library
          </Typography>
          <Tabs
            value={location.pathname}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Dashboard" value="/" />
            <Tab label="Profile" value="/profile" />
            <Tab label="Seeds" value="/seeds" />
            <Tab label="Clones" value="/clones" />
            {/* Conditionally render Login and Signup tabs */}
            {!currentUser && (
              <>
                <Tab label="Login" value="/login" />
                <Tab label="Signup" value="/signup" />
              </>
            )}
          </Tabs>
          <Switch
            checked={isDarkMode}
            onChange={handleThemeChange}
            color="default"
          />
          {/* Add logout button */}
          {currentUser && (
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 2 }}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/seeds"
            element={
              <PrivateRoute>
                <SeedsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clones"
            element={
              <PrivateRoute>
                <ClonesPage />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
};

// Main App component wrapped with Router and AuthProvider
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SeedProvider>
          <CloneProvider>
            <AppWithRouter />
          </CloneProvider>
        </SeedProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
