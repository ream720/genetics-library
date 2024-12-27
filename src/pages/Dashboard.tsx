import { Button, Typography, Container, Box, Card } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container>
      <Box>
        <Typography variant="h4">Genetics Library Dashboard</Typography>
        <Typography variant="body1">
          Manage your seeds, clones, and payment options here.
        </Typography>
        <Card sx={{ marginTop: "20px" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/seeds")}
            sx={{ margin: "10px" }}
          >
            Manage Seeds
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/clones")}
            sx={{ margin: "10px" }}
          >
            Manage Clones
          </Button>
        </Card>
        <Card sx={{ marginTop: "20px" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/profile")}
            sx={{ margin: "10px" }}
          >
            View Profile
          </Button>
        </Card>
      </Box>
    </Container>
  );
}

export default Dashboard;
