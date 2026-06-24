import { type FormEvent, useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Button,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import AuthPanel from "./auth/AuthPanel";

interface LocationState {
  from?: {
    pathname: string;
  };
}

function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const { login, signInWithGoogle, completeGoogleSignup, currentUser } =
    useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileError, setProfileError] = useState("");

  const location = useLocation() as { state?: LocationState };
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.username) {
      navigate(location.state?.from?.pathname || "/dashboard");
    }
  }, [currentUser, navigate, location.state?.from]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (emailRef.current && passwordRef.current) {
        await login(emailRef.current.value, passwordRef.current.value);
      }
    } catch {
      setError("Failed to log in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      const { requiresProfile } = await signInWithGoogle();

      if (requiresProfile) {
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!usernameRef.current?.value) {
      setProfileError("Username is required");
      return;
    }

    try {
      setProfileError("");
      setLoading(true);
      await completeGoogleSignup(usernameRef.current.value);
      setShowProfileDialog(false);
    } catch (error) {
      if (error instanceof Error) {
        setProfileError(error.message);
      } else {
        setProfileError("Failed to complete profile setup");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((value) => !value);

  return (
    <AuthPanel
      eyebrow="Welcome back"
      title="Log in to your genetics library."
      description="Access your private Projects, seed collection, clone library, photos, and completed analytics."
      supportTitle="Your working data stays private"
      supportItems={[
        "Projects never appear on public profiles.",
        "Seeds and clones remain available for your collection workflows.",
        "Completed projects feed your personal analytics.",
      ]}
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Typography component="h2" variant="h5">
            Log in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use email and password or continue with Google.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            inputRef={emailRef}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            inputRef={passwordRef}
            required
            fullWidth
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button disabled={loading} type="submit" variant="contained" fullWidth>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          fullWidth
        >
          Continue with Google
        </Button>

        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Need an account?{" "}
            <MuiLink component={RouterLink} to="/signup">
              Sign up
            </MuiLink>
          </Typography>
          <MuiLink component={RouterLink} to="/forgot-password" variant="body2">
            Forgot password?
          </MuiLink>
        </Stack>
      </Stack>

      <Dialog open={showProfileDialog} onClose={() => {}} fullWidth maxWidth="xs">
        <DialogTitle>Complete your profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Choose a username so your library profile can be created.
            </Typography>
            {profileError && <Alert severity="error">{profileError}</Alert>}
            <TextField
              autoFocus
              label="Username"
              type="text"
              fullWidth
              inputRef={usernameRef}
              required
              autoComplete="username"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleProfileSubmit}
            disabled={loading}
            variant="contained"
          >
            {loading ? "Saving..." : "Complete setup"}
          </Button>
        </DialogActions>
      </Dialog>
    </AuthPanel>
  );
}

export default Login;
