import {
  Info,
  Grass,
  Payments,
  ContactMail,
  Email,
  SpaOutlined,
} from "@mui/icons-material";
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
  Snackbar,
} from "@mui/material";
import ProfileSection from "../components/ProfileSection";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import Icon from "@mdi/react";
import { mdiSeed } from "@mdi/js";

function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleContactSupport = () => setIsModalOpen(true);

  const handleClose = () => {
    setIsModalOpen(false);
    setMessage("");
    setSubmitStatus("idle");
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");

    try {
      const functions = getFunctions();
      const sendEmail = httpsCallable(functions, "sendSupportEmail");
      await sendEmail({ message });
      setSubmitStatus("success");
      setSnackbar({
        open: true,
        message: "Message sent successfully!",
        severity: "success",
      });
      setTimeout(handleClose, 1000);
    } catch (error: unknown) {
      // Only log errors in development
      if (process.env.NODE_ENV === "development") {
        console.error("Support email error:", error);
      }
      setSubmitStatus("error");
      setSnackbar({
        open: true,
        message:
          "Failed to send message. Please try again or contact us on Instagram @genetics_library",
        severity: "error",
      });
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
            <Typography variant="subtitle2">
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
                  Your Collections
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
                  startIcon={<Icon path={mdiSeed} size={0.7} />}
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/seeds")}
                >
                  Seeds
                </Button>
                <Button
                  startIcon={<Grass />}
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/clones")}
                >
                  Clones
                </Button>
                <Button
                  startIcon={<SpaOutlined />}
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/cultivar-info")}
                >
                  Add Cultivar Info
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {/* Premium Options Section */}
          <Card raised sx={{ bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Premium Options
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
                  startIcon={<Payments />}
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/payments")}
                >
                  Payment Platforms
                </Button>
                <Button
                  startIcon={<ContactMail />}
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/contact-info")}
                >
                  Contact Info
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
                  startIcon={<Email />}
                  variant="contained"
                  size="small"
                  onClick={handleContactSupport}
                >
                  Send Message
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <ProfileSection />
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Dashboard;
