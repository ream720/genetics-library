// ForgotPassword.tsx
import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { TextField, Button, Stack, Paper, Alert, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";

function ForgotPassword() {
  const emailRef = useRef<HTMLInputElement>(null);
  const { resetPassword } = useAuth();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailRef.current) {
      const email = emailRef.current.value.trim();

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      try {
        setMessage("");
        setError("");
        setLoading(true);
        await resetPassword(email);
        setMessage("Check your inbox for further instructions.");

        // Optional: Redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 5000); // Redirect after 5 seconds
      } catch (err) {
        // Handle the error without using 'any'
        if (err instanceof FirebaseError) {
          // Specific Firebase error handling
          switch (err.code) {
            case "auth/user-not-found":
              setError("No user found with this email.");
              break;
            case "auth/invalid-email":
              setError("Invalid email address.");
              break;
            case "auth/too-many-requests":
              setError("Too many requests. Please try again later.");
              break;
            default:
              setError("Failed to reset password. Please try again later.");
          }
        } else {
          // Generic error handling
          console.error("Reset Password Error:", err);
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "30vh",
      }}
    >
      <Stack spacing={3} sx={{ p: 3, maxWidth: 400, width: "100%" }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <h2>Reset Password</h2>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              sx={{ mb: 2 }}
              label="Email"
              type="email"
              placeholder="Enter your email"
              inputRef={emailRef}
              required
              fullWidth
              aria-label="Email Address"
            />
            <Button
              sx={{ mb: 2 }}
              disabled={loading}
              type="submit"
              variant="contained"
              fullWidth
              aria-label="Reset Password"
            >
              {loading ? "Sending..." : "Reset Password"}
            </Button>
          </form>

          {message && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link to="/login">Back to Login</Link>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

export default ForgotPassword;
