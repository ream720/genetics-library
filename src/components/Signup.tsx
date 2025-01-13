import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { TextField, Button, Stack, Paper, Alert, Box } from "@mui/material";
import { UsernameAlreadyInUseError } from "../errors/UsernameAlreadyInUserError";
import { FirebaseError } from "firebase/app";

function Signup() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null); // Add username ref
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (emailRef.current && passwordRef.current && usernameRef.current) {
        // Call signup and get the userCredential
        await signup(
          emailRef.current.value,
          passwordRef.current.value,
          usernameRef.current.value
        );

        navigate("/");
      }
    } catch (err: unknown) {
      // We now discriminate the 'err' type with instanceof checks
      if (err instanceof UsernameAlreadyInUseError) {
        setError("That username is already taken. Please try again.");
      } else if (err instanceof FirebaseError) {
        // For any Firebase-specific errors, we check the code property
        if (err.code === "auth/email-already-in-use") {
          setError("That email is already in use. Please try a different one.");
        } else {
          setError(`Firebase error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        // Fallback for other unexpected JS errors
        setError(err.message);
      } else {
        // Just in case it's something truly unknown
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              sx={{ mb: 2 }}
              label="Username"
              type="text"
              placeholder="Username"
              inputRef={usernameRef} // Add username field
              required
              fullWidth
            />
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
              type="password"
              placeholder="Password"
              inputRef={passwordRef}
              required
              fullWidth
            />
            <Button
              sx={{ mb: 2 }}
              disabled={loading}
              type="submit"
              variant="contained"
            >
              Sign Up
            </Button>
          </form>
          <div>
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </Paper>
      </Stack>
    </Box>
  );
}

export default Signup;
