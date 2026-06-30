import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { UsernameAlreadyInUseError } from "../errors/UsernameAlreadyInUserError";
import { FirebaseError } from "firebase/app";
import AuthPanel from "./auth/AuthPanel";
import LegalAgreementCheckbox from "./auth/LegalAgreementCheckbox";

function Signup() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const { signup, currentUser, hasCurrentLegalAcceptance } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.username && hasCurrentLegalAcceptance) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser?.username, hasCurrentLegalAcceptance, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setError("");

      if (!acceptedLegalTerms) {
        setError(
          "Accept the Terms of Service and Privacy Policy to create an account."
        );
        return;
      }

      setLoading(true);
      if (emailRef.current && passwordRef.current && usernameRef.current) {
        await signup(
          emailRef.current.value,
          passwordRef.current.value,
          usernameRef.current.value
        );
      }
    } catch (err: unknown) {
      if (err instanceof UsernameAlreadyInUseError) {
        setError("That username is already taken. Please try again.");
      } else if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") {
          setError("That email is already in use. Please try a different one.");
        } else if (err.code === "auth/weak-password") {
          setError("Password is too weak. Use at least 6 characters.");
        } else {
          setError(`Signup failed: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Create account"
      title="Start building your genetics library."
      description="Catalog seeds and clones now, then use Projects to track hunts, washes, photos, and results over time."
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Typography component="h2" variant="h5">
            Sign up
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a username, email, and password.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && (
          <Alert
            severity="info"
            icon={<CircularProgress color="inherit" size={18} />}
          >
            Creating your account and preparing your dashboard...
          </Alert>
        )}

        <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Username"
            type="text"
            inputRef={usernameRef}
            required
            fullWidth
            autoComplete="username"
            disabled={loading}
          />
          <TextField
            label="Email"
            type="email"
            inputRef={emailRef}
            required
            fullWidth
            autoComplete="email"
            disabled={loading}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            inputRef={passwordRef}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Use at least 6 characters."
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((value) => !value)}
                    edge="end"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <LegalAgreementCheckbox
            checked={acceptedLegalTerms}
            disabled={loading}
            onChange={setAcceptedLegalTerms}
          />
          <Button disabled={loading} type="submit" variant="contained" fullWidth>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{" "}
          <MuiLink component={RouterLink} to="/login">
            Log in
          </MuiLink>
        </Typography>
      </Stack>
    </AuthPanel>
  );
}

export default Signup;
