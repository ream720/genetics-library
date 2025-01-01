import { Info } from "@mui/icons-material";
import {
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Box,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Card sx={{ padding: "20px" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Stack>
            <Typography sx={{ ml: "10px", mb: "10px" }} variant="h4">
              Dashboard
            </Typography>
            <Stack marginLeft={1} direction="row" spacing={1}>
              <Info fontSize="small" />
              <Typography variant="body1" sx={{ marginBottom: "20px" }}>
                Manage your seeds, clones, and payment options here.
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Manage Collections Section */}
        <Card raised sx={{ marginBottom: "20px" }}>
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
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" onClick={() => navigate("/seeds")}>
                Manage Seeds
              </Button>
              <Button variant="contained" onClick={() => navigate("/clones")}>
                Manage Clones
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <Card raised sx={{ marginBottom: "20px" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Manage Your Premium Options
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ marginBottom: "16px" }}
            >
              Update your accepted payment methods, and your preferred contact
              method.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                sx={{ maxWidth: "400px" }}
                variant="contained"
                onClick={() => navigate("/payments")}
              >
                Manage Payment Platforms
              </Button>
              <Button
                sx={{ maxWidth: "400px" }}
                variant="contained"
                onClick={() => navigate("/contact-info")}
              >
                Manage Contact Info
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Card>
    </Container>
  );
}

export default Dashboard;
