import {
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Genetics Library Dashboard
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: "20px" }}>
        Manage your seeds, clones, and payment options here.
      </Typography>

      {/* Seeds and Clones Section */}
      <Card sx={{ marginBottom: "20px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manage Your Library
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

      {/* Profile Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/profile")}
              >
                View Profile
              </Button>
            </Grid>
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
