import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Box,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google"; // Import Google Icon

interface LocationState {
  from?: {
    pathname: string;
  };
}

function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login, signInWithGoogle, currentUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const location = useLocation() as { state?: LocationState };
  const navigate = useNavigate();

  // Redirect to the intended page if the user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(location.state?.from?.pathname || "/");
    }
  }, [currentUser, navigate, location.state?.from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (emailRef.current && passwordRef.current) {
        await login(emailRef.current.value, passwordRef.current.value);
      }
    } catch {
      setError("Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      // Redirect is handled by useEffect
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError("Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "30vh", // fills the full viewport height
      }}
    >
      <Stack spacing={3} sx={{ p: 3, maxWidth: 400 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              sx={{ mb: 2 }}
              label="Email"
              type="email"
              placeholder="Email"
              inputRef={emailRef}
              required
              fullWidth
            />
            <TextField
              sx={{ mb: 2 }}
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              inputRef={passwordRef}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              sx={{ mb: 2 }}
              disabled={loading}
              type="submit"
              variant="contained"
            >
              Login
            </Button>
          </form>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Sign in with Google
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <div>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
            <div style={{ marginTop: "8px" }}>
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

export default Login;
