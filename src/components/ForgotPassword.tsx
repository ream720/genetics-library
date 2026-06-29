import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FirebaseError } from "firebase/app";
import AuthPanel from "./auth/AuthPanel";

function ForgotPassword() {
  const emailRef = useRef<HTMLInputElement>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const { resetPassword } = useAuth();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (emailRef.current) {
      const email = emailRef.current.value.trim();

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

        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/login");
        }, 5000);
      } catch (err) {
        if (err instanceof FirebaseError) {
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
          console.error("Reset Password Error:", err);
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter the email attached to your Genetics Library account and we will send a password reset link."
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Typography component="h2" variant="h5">
            Forgot password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We will email a secure reset link if the account exists.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {message && (
          <Alert severity="success">
            {message} You will be sent back to login shortly.
          </Alert>
        )}

        <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            inputRef={emailRef}
            required
            fullWidth
            autoComplete="email"
          />
          <Button
            disabled={loading || Boolean(message)}
            type="submit"
            variant="contained"
            fullWidth
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </Stack>

        <Stack spacing={1} alignItems="center">
          {message && (
            <Button variant="outlined" onClick={() => navigate("/login")}>
              Go to login
            </Button>
          )}
          <MuiLink component={RouterLink} to="/login" variant="body2">
            Back to login
          </MuiLink>
        </Stack>
      </Stack>
    </AuthPanel>
  );
}

export default ForgotPassword;
