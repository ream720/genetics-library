import React, { useState } from "react";
import { lightTheme, darkTheme } from "./theme";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
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
} from "@mui/material";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SeedsPage from "./pages/SeedsPage";
import { SeedProvider } from "./context/SeedContext";
import ClonesPage from "./pages/ClonesPage";
import { CloneProvider } from "./context/CloneContext";

// Wrap the entire application with Router
const AppWithRouter: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleThemeChange = () => {
    setIsDarkMode(!isDarkMode);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <SeedProvider>
        <CloneProvider>
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
              </Tabs>
              <Switch
                checked={isDarkMode}
                onChange={handleThemeChange}
                color="default"
              />
            </Toolbar>
          </AppBar>
          <Box sx={{ mt: 2 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/seeds" element={<SeedsPage />} />
              <Route path="/clones" element={<ClonesPage />} />
            </Routes>
          </Box>
        </CloneProvider>
      </SeedProvider>
    </ThemeProvider>
  );
};

// Wrap the AppWithRouter component with Router
const App: React.FC = () => {
  return (
    <Router>
      <AppWithRouter />
    </Router>
  );
};

export default App;
