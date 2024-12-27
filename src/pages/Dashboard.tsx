import {
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ padding: "20px", position: "relative" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <Typography variant="h4">Genetics Library Dashboard</Typography>
        <Button
          variant="contained"
          size="small"
          sx={{ alignSelf: "flex-start" }}
          onClick={() => navigate("/profile")}
        >
          View Profile
        </Button>
      </Box>

      <Typography variant="body1" sx={{ marginBottom: "20px" }}>
        Manage your seeds, clones, and payment options here.
      </Typography>

      {/* Manage Collections Section */}
      <Card sx={{ marginBottom: "20px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manage Your Collections
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ marginBottom: "16px" }}
          >
            Organize and keep track of your seeds and clones for easy access.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/seeds")}
              >
                Manage Seeds
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/clones")}
              >
                Manage Clones
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Settings Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Settings
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ marginBottom: "16px" }}
          >
            Update your payment options or adjust your preferences.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/payments")}
              >
                Manage Payment Options
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Dashboard;
