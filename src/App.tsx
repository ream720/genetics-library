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
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SeedsPage from "./pages/SeedsPage";
import PaymentsPage from "./pages/PaymentsPage";
import { SeedProvider } from "./context/SeedContext";
import ClonesPage from "./pages/ClonesPage";
import { CloneProvider } from "./context/CloneContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import useIdleTimer from "./hooks/useIdleTimer";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ModeNightOutlinedIcon from "@mui/icons-material/ModeNightOutlined";
import SearchPage from "./pages/SearchPage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// PrivateRoute component to protect routes that require authentication
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  // If the user is not logged in, redirect to the login page with the current location's pathname as state
  return currentUser ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} />
  );
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

  // Function to determine the active tab value based on the current path
  const getActiveTabValue = () => {
    if (location.pathname === "/") return "/";
    if (location.pathname.startsWith("/search")) return "/search";
    if (location.pathname.startsWith("/login")) return "/login";
    return false; // Return false if no match (to indicate no active tab)
  };

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

  const savePaymentOptions = async (methods: string[]) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { paymentMethods: methods }, { merge: true });
      } catch (error) {
        console.error("Error saving payment methods:", error);
      }
    }
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Genetics Library
          </Typography>
          <Tabs
            value={getActiveTabValue()} // Use the function to get active tab value
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Dashboard" value="/" />
            <Tab label="Search" value="/search" />
            {/* Conditionally render Login tab */}
            {!currentUser && <Tab label="Login" value="/login" />}
          </Tabs>
          <IconButton onClick={handleThemeChange}>
            {isDarkMode ? <ModeNightOutlinedIcon /> : <WbSunnyOutlinedIcon />}
          </IconButton>
          {currentUser && (
            <Tooltip title="Logout">
              <IconButton
                aria-description="Logout"
                color="inherit"
                onClick={handleLogout}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
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
            path="/profile/:userId"
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
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <SearchPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <PaymentsPage onSave={savePaymentOptions} />
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
