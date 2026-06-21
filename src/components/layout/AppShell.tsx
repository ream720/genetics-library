import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { ReactNode, useCallback, useState } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useColorMode } from "../../context/ColorModeContext";
import { useUnsavedChanges } from "../../context/UnsavedChangesContext";
import useIdleTimer from "../../hooks/useIdleTimer";

const SIDEBAR_WIDTH = 232;

const navItems = [
  {
    label: "Dashboard",
    value: "/dashboard",
    icon: <DashboardOutlinedIcon />,
  },
  { label: "Search", value: "/search", icon: <SearchOutlinedIcon /> },
  { label: "Projects", value: "/projects", icon: <FolderOutlinedIcon /> },
  {
    label: "Profile",
    value: "/profile",
    icon: <AccountCircleOutlinedIcon />,
  },
];

const AppShell = ({ children }: { children: ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const { mode, toggleMode } = useColorMode();
  const { confirmNavigation } = useUnsavedChanges();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const activePath = location.pathname.startsWith("/projects")
    ? "/projects"
    : navItems.find((item) => location.pathname.startsWith(item.value))
        ?.value ?? false;

  const navigateSafely = (path: string) => {
    if (confirmNavigation()) {
      navigate(path);
      setAccountAnchor(null);
    }
  };

  const performLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }, [logout, navigate]);

  const handleLogout = useCallback(async () => {
    if (confirmNavigation()) {
      setAccountAnchor(null);
      await performLogout();
    }
  }, [confirmNavigation, performLogout]);

  useIdleTimer({ timeout: 900000, onIdle: performLogout });

  const wordmark = (
    <Link
      component={RouterLink}
      to={currentUser ? "/dashboard" : "/"}
      color="inherit"
      underline="none"
      aria-label="Genetics Library home"
    >
      <Typography
        sx={{
          fontFamily: '"Great Vibes", cursive',
          fontSize: { xs: "1.85rem", lg: "2rem" },
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Genetics Library
      </Typography>
    </Link>
  );

  if (!currentUser) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Paper
          component="header"
          square
          elevation={0}
          sx={{
            position: "sticky",
            top: 0,
            zIndex: "appBar",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}
          >
            {wordmark}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={`Use ${mode === "dark" ? "light" : "dark"} mode`}>
                <IconButton onClick={toggleMode} aria-label="Toggle color mode">
                  {mode === "dark" ? (
                    <LightModeOutlinedIcon />
                  ) : (
                    <DarkModeOutlinedIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Button
                component={RouterLink}
                to="/login"
                startIcon={<LoginOutlinedIcon />}
              >
                Log in
              </Button>
            </Stack>
          </Stack>
        </Paper>
        <Box component="main" id="main-content" sx={{ flex: 1 }}>
          {children}
        </Box>
        <Stack
          component="footer"
          direction="row"
          justifyContent="center"
          spacing={2}
          sx={{ px: 2, py: 3 }}
        >
          <Link component={RouterLink} to="/terms-of-service">
            Terms
          </Link>
          <Link component={RouterLink} to="/privacy-policy">
            Privacy
          </Link>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <Box
        component="a"
        href="#main-content"
        sx={(theme) => ({
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: theme.zIndex.tooltip + 1,
          transform: "translateY(-140%)",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          px: 2,
          py: 1,
          textDecoration: "none",
          "&:focus": { transform: "translateY(0)" },
        })}
      >
        Skip to main content
      </Box>

      <Paper
        component="aside"
        square
        elevation={0}
        sx={(theme) => ({
          display: { xs: "none", lg: "flex" },
          position: "fixed",
          inset: 0,
          right: "auto",
          width: SIDEBAR_WIDTH,
          zIndex: theme.zIndex.drawer,
          flexDirection: "column",
          bgcolor: theme.palette.navigation.background,
          color: theme.palette.navigation.text,
          borderRight: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>{wordmark}</Box>
        <List component="nav" aria-label="Primary navigation" sx={{ px: 1.5 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.value}
              selected={activePath === item.value}
              onClick={() => navigateSafely(item.value)}
              sx={(theme) => ({
                minHeight: 48,
                mb: 0.5,
                borderRadius: 3,
                color:
                  activePath === item.value
                    ? theme.palette.mode === "light"
                      ? theme.palette.navigation.background
                      : theme.palette.navigation.text
                    : theme.palette.navigation.muted,
                "&.Mui-selected": {
                  bgcolor: theme.palette.navigation.selected,
                  color: theme.palette.navigation.text,
                  "&:hover": {
                    bgcolor: theme.palette.navigation.selected,
                  },
                },
              })}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 680 }}
              />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: "auto", p: 1.5 }}>
          <Divider
            sx={(theme) => ({
              mb: 1.5,
              borderColor: theme.palette.navigation.selected,
            })}
          />
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1 }}>
            <Avatar
              src={currentUser.photoURL || ""}
              alt={currentUser.username || "User"}
              sx={{ width: 38, height: 38 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700} noWrap>
                {currentUser.username || "Account"}
              </Typography>
              <Typography
                variant="caption"
                sx={(theme) => ({ color: theme.palette.navigation.muted })}
              >
                Private library
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            <Button
              color="inherit"
              startIcon={
                mode === "dark" ? (
                  <LightModeOutlinedIcon />
                ) : (
                  <DarkModeOutlinedIcon />
                )
              }
              onClick={toggleMode}
              sx={{ justifyContent: "flex-start" }}
            >
              {mode === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button
              color="inherit"
              startIcon={<LogoutOutlinedIcon />}
              onClick={handleLogout}
              sx={{ justifyContent: "flex-start" }}
            >
              Log out
            </Button>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ px: 1, pt: 1.5 }}>
            <Link
              component={RouterLink}
              to="/terms-of-service"
              variant="caption"
              sx={(theme) => ({
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                color: theme.palette.navigation.muted,
              })}
            >
              Terms
            </Link>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              variant="caption"
              sx={(theme) => ({
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                color: theme.palette.navigation.muted,
              })}
            >
              Privacy
            </Link>
          </Stack>
        </Box>
      </Paper>

      <Paper
        component="header"
        square
        elevation={0}
        sx={{
          display: { xs: "block", lg: "none" },
          position: "sticky",
          top: 0,
          zIndex: "appBar",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            minHeight: 62,
            px: 2,
            pt: "env(safe-area-inset-top)",
          }}
        >
          {wordmark}
          <IconButton
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            aria-label="Open account menu"
            aria-controls={accountAnchor ? "account-menu" : undefined}
            aria-expanded={Boolean(accountAnchor)}
          >
            <Avatar
              src={currentUser.photoURL || ""}
              alt={currentUser.username || "User"}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
        </Stack>
      </Paper>

      <Menu
        id="account-menu"
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem disabled>{currentUser.username || "Account"}</MenuItem>
        <Divider />
        <MenuItem onClick={toggleMode}>
          {mode === "dark" ? (
            <LightModeOutlinedIcon sx={{ mr: 1.5 }} />
          ) : (
            <DarkModeOutlinedIcon sx={{ mr: 1.5 }} />
          )}
          {mode === "dark" ? "Light mode" : "Dark mode"}
        </MenuItem>
        <MenuItem onClick={() => navigateSafely("/terms-of-service")}>
          Terms of Service
        </MenuItem>
        <MenuItem onClick={() => navigateSafely("/privacy-policy")}>
          Privacy Policy
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutOutlinedIcon sx={{ mr: 1.5 }} />
          Log out
        </MenuItem>
      </Menu>

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          ml: { xs: 0, lg: `${SIDEBAR_WIDTH}px` },
          minHeight: "100dvh",
          pb: {
            xs: "calc(84px + env(safe-area-inset-bottom))",
            lg: 0,
          },
          outline: "none",
        }}
      >
        {children}
      </Box>

      <Paper
        component="nav"
        square
        elevation={8}
        aria-label="Primary navigation"
        sx={{
          display: { xs: "block", lg: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: "appBar",
          pb: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNavigation
          value={activePath}
          onChange={(_event, nextPath) => navigateSafely(nextPath)}
          showLabels
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default AppShell;
