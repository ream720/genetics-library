import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GrassOutlinedIcon from "@mui/icons-material/GrassOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import Icon from "@mdi/react";
import { mdiSeed } from "@mdi/js";
import ProfileSection from "../components/ProfileSection";
import { useCloneContext } from "../context/CloneContext";
import { useSeedContext } from "../context/SeedContext";
import {
  ActionCard,
  PageContainer,
  PageHeader,
  ResponsiveDialog,
  SectionCard,
} from "../components/ui";

const Dashboard = () => {
  const navigate = useNavigate();
  const { seeds } = useSeedContext();
  const { clones } = useCloneContext();
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

  const handleClose = () => {
    setIsModalOpen(false);
    setMessage("");
    setSubmitStatus("idle");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitStatus("idle");

    try {
      const functions = getFunctions();
      const sendEmail = httpsCallable(functions, "sendSupportEmail");
      await sendEmail({ message });
      setSubmitStatus("success");
      setSnackbar({
        open: true,
        message: "Message sent successfully.",
        severity: "success",
      });
      window.setTimeout(handleClose, 800);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Support email error:", error);
      }
      setSubmitStatus("error");
      setSnackbar({
        open: true,
        message:
          "Message could not be sent. Try again or contact @genetics_library.",
        severity: "error",
      });
    }
  };

  return (
    <PageContainer maxWidth="lg">
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <PageHeader
          eyebrow="Private workspace"
          title="Your genetics workspace"
          description="Add seeds and clones to build your source library, then select them when creating private Projects."
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <ActionCard
            title="Seeds"
            description="Browse and manage seed packs in your private collection."
            icon={<Icon path={mdiSeed} size={0.9} />}
            meta={
              <Typography variant="caption" color="text.secondary">
                {seeds.length} {seeds.length === 1 ? "entry" : "entries"}
              </Typography>
            }
            onClick={() => navigate("/seeds")}
          />
          <ActionCard
            title="Clones"
            description="Track clone-only genetics and promoted Pheno Hunt keepers."
            icon={<GrassOutlinedIcon />}
            meta={
              <Typography variant="caption" color="text.secondary">
                {clones.length} {clones.length === 1 ? "entry" : "entries"}
              </Typography>
            }
            onClick={() => navigate("/clones")}
          />
          <ActionCard
            title="Projects"
            description="Continue Pheno Hunt and Wash/Process work from one place."
            icon={<FolderOutlinedIcon />}
            meta={
              <Typography variant="caption" color="secondary.main">
                Open project workspace
              </Typography>
            }
            onClick={() => navigate("/projects")}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <SectionCard
            title="Account details"
            description="Manage profile contact and payment preferences."
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                startIcon={<PaymentsOutlinedIcon />}
                variant="outlined"
                onClick={() => navigate("/payments")}
              >
                Payment platforms
              </Button>
              <Button
                startIcon={<ContactMailOutlinedIcon />}
                variant="outlined"
                onClick={() => navigate("/contact-info")}
              >
                Contact info
              </Button>
            </Stack>
          </SectionCard>

          <SectionCard
            title="Support"
            description="Report a problem or share feedback with the Genetics Library team."
          >
            <Button
              startIcon={<SupportAgentOutlinedIcon />}
              variant="outlined"
              onClick={() => setIsModalOpen(true)}
            >
              Send a message
            </Button>
          </SectionCard>
        </Box>

        <ProfileSection />
      </Stack>

      <ResponsiveDialog
        open={isModalOpen}
        onClose={handleClose}
        title="Contact support"
        actions={
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!message.trim() || submitStatus === "success"}
            >
              {submitStatus === "success" ? "Sent" : "Send message"}
            </Button>
          </>
        }
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            label="How can we help?"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            autoFocus
          />
        </Box>
      </ResponsiveDialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() =>
            setSnackbar((current) => ({ ...current, open: false }))
          }
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default Dashboard;
