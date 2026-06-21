import React, { useState } from "react";
import { lightTheme, darkTheme } from "./theme";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
  Link as RouterLink,
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
  Stack,
  Link,
} from "@mui/material";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SeedsPage from "./pages/SeedsPage";
import PaymentsPage from "./pages/PaymentsPage";
import { SeedProvider } from "./context/SeedContext";
import ClonesPage from "./pages/ClonesPage";
import { CloneProvider } from "./context/CloneContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useUnsavedChanges } from "./context/UnsavedChangesContext";
import { UnsavedChangesProvider } from "./context/UnsavedChangesProvider";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import useIdleTimer from "./hooks/useIdleTimer";
import SearchPage from "./pages/SearchPage";
import Landing from "./pages/Landing";
import ContactInfo from "./pages/ContactInfo";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectCreatePage from "./pages/ProjectCreatePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectAnalyticsPage from "./pages/ProjectAnalyticsPage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Icons
import LogoutIcon from "@mui/icons-material/Logout";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ModeNightOutlinedIcon from "@mui/icons-material/ModeNightOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircleOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import LoginIcon from "@mui/icons-material/Login";
import TermsOfService from "./legal/TermsOfService";
import PrivacyPolicy from "./legal/PrivacyPolicy";

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
  const { confirmNavigation } = useUnsavedChanges();

  const handleThemeChange = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Decide which tab is active based on path
  const getActiveTabValue = () => {
    if (location.pathname === "/dashboard") return "/dashboard";
    if (location.pathname.startsWith("/search")) return "/search";
    if (
      location.pathname.startsWith("/projects") ||
      location.pathname.startsWith("/project-analytics")
    )
      return "/projects";
    if (!currentUser && location.pathname.startsWith("/login")) return "/login";
    if (location.pathname === "/profile") return "/profile";
    return false;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (confirmNavigation()) {
      navigate(newValue);
    }
  };

  const performLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleLogout = async () => {
    if (confirmNavigation()) {
      await performLogout();
    }
  };

  // Idle timer
  const IDLE_TIMEOUT = 900000; // 15 minutes
  useIdleTimer({ timeout: IDLE_TIMEOUT, onIdle: performLogout });

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
                <Link
                  component={RouterLink}
                  to="/"
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": {
                      textDecoration: "none",
                    },
                  }}
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
                </Link>
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
                value="/dashboard"
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

              {/* Projects Tab: only if logged in */}
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
                      <FolderIcon />
                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        Projects
                      </Typography>
                    </Box>
                  }
                  value="/projects"
                  aria-label="Projects"
                />
              )}

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
        <Box sx={{ flex: 1, mt: 2 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
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
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
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
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <ProjectsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <PrivateRoute>
                  <ProjectCreatePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <PrivateRoute>
                  <ProjectDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/:projectId/analytics"
              element={
                <PrivateRoute>
                  <ProjectAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/project-analytics"
              element={
                <PrivateRoute>
                  <ProjectAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </Box>
        {/* Footer content */}
        <Box component="footer" sx={{ py: 2 }}>
          <Stack>
            <Link component={RouterLink} to="/terms-of-service" align="center">
              Terms of Service
            </Link>
            <Link component={RouterLink} to="/privacy-policy" align="center">
              Privacy Policy
            </Link>
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 1, color: "text.secondary" }}
            >
              &copy; 2025 Genetics Library. All rights reserved.
            </Typography>
          </Stack>
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
            <UnsavedChangesProvider>
              <AppWithRouter />
            </UnsavedChangesProvider>
          </CloneProvider>
        </SeedProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
