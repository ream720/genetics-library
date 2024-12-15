import React from "react";
import { Box, Typography, Button } from "@mui/material";

const Dashboard: React.FC = () => {
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start", // Align content to the top left
        minHeight: "100vh", // Ensure it stretches the viewport height
      }}
    >
      <Typography variant="h4" gutterBottom>
        Genetics Library Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Manage and track your seeds, clones, and mother plants.
      </Typography>
      <Button variant="contained" color="primary">
        Add New Entry
      </Button>
    </Box>
  );
};

export default Dashboard;
