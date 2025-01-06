import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { TextField, Button, Stack, Paper, Typography } from "@mui/material";

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
    } catch (error) {
      console.error("Error during signup:", error);
      setError("email or username already exists - try again ");
    }

    setLoading(false);
  }

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 400 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sign Up
        </Typography>
        {error && <div>{error}</div>}
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
  );
}

export default Signup;
