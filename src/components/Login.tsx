import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // For password visibility toggle
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (emailRef.current && passwordRef.current) {
        await login(emailRef.current.value, passwordRef.current.value);
        navigate("/");
      }
    } catch {
      setError("Failed to log in");
    }

    setLoading(false);
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 400 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Use Alert for error display */}
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
            type={showPassword ? "text" : "password"} // Toggle password visibility
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
        <div>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
        {/* Add a "Forgot Password" link */}
        <div>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </Paper>
    </Stack>
  );
}

export default Login;
