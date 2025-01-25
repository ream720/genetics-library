import { Info } from "@mui/icons-material";
import {
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Box,
  Stack,
  Alert,
  Modal,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleContactSupport = () => setIsModalOpen(true);

  const handleClose = () => {
    setIsModalOpen(false);
    setMessage("");
    setSubmitStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      window.location.href = `mailto:geneticslibrary@gmail.com?subject=Support Request&body=${encodeURIComponent(
        message
      )}`;
      setSubmitStatus("success");
      setTimeout(handleClose, 2000);
    } catch (error: unknown) {
      // Explicitly type the error
      console.error("Failed to open email client:", error); // Log the error
      setSubmitStatus("error");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Card sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Dashboard
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Info fontSize="small" />
            <Typography variant="body1">
              Manage your seeds, clones, and payment options here.
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {/* Manage Collections Section */}
          <Card raised sx={{ bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Manage Your Collections
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, maxWidth: "600px" }}
                >
                  Organize and keep track of your seeds and clones for easy
                  access.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="flex-start">
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => navigate("/seeds")}
                >
                  Manage Seeds
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => navigate("/clones")}
                >
                  Manage Clones
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {/* Premium Options Section */}
          <Card raised sx={{ bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Manage Your Premium Options
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, maxWidth: "600px" }}
                >
                  Update your accepted payment methods, and your preferred
                  contact method.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="flex-start">
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => navigate("/payments")}
                >
                  Manage Payment Platforms
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => navigate("/contact-info")}
                >
                  Manage Contact Info
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {/* Contact Support Section */}
          <Card raised sx={{ bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Support
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, maxWidth: "600px" }}
                >
                  Send us a message with any issues you're experiencing. Let us
                  know if you have any feedback, such as new features you'd like
                  to see.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="flex-start">
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleContactSupport}
                >
                  Send Message
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Card>
      <Modal
        open={isModalOpen}
        onClose={handleClose}
        aria-labelledby="contact-support-modal"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            borderRadius: 1,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Contact Support
          </Typography>

          {submitStatus === "success" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Opening email client...
            </Alert>
          )}

          {submitStatus === "error" && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to open email client. Please try again.
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!message.trim() || submitStatus === "success"}
            >
              Send Message
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Container>
  );
}

export default Dashboard;
