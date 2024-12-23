import React from "react";
import { Box, Typography, Button, Card, Stack } from "@mui/material";
import { CrisisAlert, MonetizationOnOutlined } from "@mui/icons-material";

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
      <Card sx={{ p: 2, mb: 2, maxWidth: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CrisisAlert color="error"></CrisisAlert>
          <Typography variant="h6" gutterBottom color="yellow">
            this page basically doesn't work yet
          </Typography>
        </Stack>

        <Typography variant="body1" gutterBottom>
          Welcome to the Genetics Library Dashboard! Set your top 3 seeds,
          clones, and mother plants so that other users can easily see them on
          your Profile! Manage your contact options and 3rd party app ($)
          guidelines.
        </Typography>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <div>list of seeds</div>
        <Button variant="contained" color="primary">
          Set Top Seeds
        </Button>
      </Card>
      <Card sx={{ p: 2, mb: 2 }}>
        <div>list of clones</div>
        <Button variant="contained" color="primary">
          Set Top Clones
        </Button>
      </Card>
      <Card sx={{ p: 2, mb: 2 }}>
        <div>list of mothers</div>
        <Button variant="contained" color="primary">
          Set Top Mother Plants
        </Button>
      </Card>
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex" }}>
          <MonetizationOnOutlined />
          <div>list of accepted payment options/apps</div>
        </Box>
        <Button variant="contained" color="primary">
          Set Top Payment Options
        </Button>
      </Card>
    </Box>
  );
};

export default Dashboard;
