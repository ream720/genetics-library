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
  Avatar,
} from "@mui/material";

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
import ForgotPassword from "./components/ForgotPassword";
import useIdleTimer from "./hooks/useIdleTimer";
import SearchPage from "./pages/SearchPage";
import ContactInfo from "./pages/ContactInfo";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Icons
import LogoutIcon from "@mui/icons-material/Logout";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ModeNightOutlinedIcon from "@mui/icons-material/ModeNightOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircleOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LoginIcon from "@mui/icons-material/Login";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// PrivateRoute component to protect routes that require authentication
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  return currentUser?.username ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} />
  );
};

const AppWithRouter: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleThemeChange = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Decide which tab is active based on path
  const getActiveTabValue = () => {
    if (location.pathname === "/") return "/";
    if (location.pathname.startsWith("/search")) return "/search";
    if (!currentUser && location.pathname.startsWith("/login")) return "/login";
    if (location.pathname === "/profile") return "/profile";
    // Don’t return "/profile" for /profile/:userId
    // so the tab won't be highlighted.
    if (location.pathname.startsWith("/profile/")) return false;
    return false;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Idle timer
  const IDLE_TIMEOUT = 900000; // 15 minutes
  useIdleTimer({ timeout: IDLE_TIMEOUT, onIdle: handleLogout });

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
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Sticky header container */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1100,
            bgcolor: "background.default",
          }}
        >
          {/* -- LOGO / TOOLBAR (TOP BAR) -- */}
          <AppBar position="static">
            <Toolbar>
              {/* Left Box: Avatar and Username */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1, // Space between items
                  width: 100, // Match the right box width
                  overflow: "hidden",
                }}
              >
                {currentUser && (
                  <>
                    <Avatar
                      src={currentUser.photoURL || ""}
                      alt={currentUser.username || "User"}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography
                      fontWeight={700}
                      variant="caption"
                      color="inherit"
                      sx={{
                        whiteSpace: "nowrap", // Prevent text from wrapping to a new line
                        overflow: "hidden", // Hide overflowed text
                        textOverflow: "ellipsis", // Show ellipsis for overflowed text
                        maxWidth: 60, // Restrict the maximum width of the text
                      }}
                    >
                      {currentUser.username || "Guest"}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Center Box: Title */}
              <Box
                sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Great Vibes', cursive",
                    textAlign: "center",
                  }}
                >
                  Genetics Library
                </Typography>
              </Box>

              {/* Right Box: Icon Buttons */}
              <Box
                sx={{
                  width: 100,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <IconButton onClick={handleThemeChange} color="inherit">
                  {isDarkMode ? (
                    <ModeNightOutlinedIcon />
                  ) : (
                    <WbSunnyOutlinedIcon />
                  )}
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
              </Box>
            </Toolbar>
          </AppBar>

          {/* -- TABS BAR (SECOND BAR) -- */}
          <AppBar position="static" color="default" sx={{ mt: 0.5 }}>
            <Tabs
              value={getActiveTabValue()}
              onChange={handleTabChange}
              textColor="inherit"
              variant="fullWidth"
            >
              {/* Dashboard Tab: icon + text */}
              <Tab
                icon={
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <DashboardIcon />
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                      Dashboard
                    </Typography>
                  </Box>
                }
                value="/"
                aria-label="Dashboard"
              />

              {/* Search Tab: icon + text */}
              <Tab
                icon={
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <SearchIcon />
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                      Search
                    </Typography>
                  </Box>
                }
                value="/search"
                aria-label="Search"
              />

              {/* Profile Tab: only if logged in */}
              {currentUser && (
                <Tab
                  icon={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <AccountCircleIcon />
                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        Profile
                      </Typography>
                    </Box>
                  }
                  value="/profile"
                  aria-label="Profile"
                />
              )}

              {/* Login Tab: only if not logged in */}
              {!currentUser && (
                <Tab label="Login" icon={<LoginIcon />} value="/login" />
              )}
            </Tabs>
          </AppBar>
        </Box>

        {/* -- MAIN CONTENT -- */}
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
                  <PaymentsPage
                    onSave={savePaymentOptions}
                    currentUser={currentUser || undefined}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/contact-info"
              element={
                <PrivateRoute>
                  <ContactInfo />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Main App component
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
