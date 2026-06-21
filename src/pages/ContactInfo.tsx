import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

function ContactInfo() {
  const [contactInfo, setContactInfo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setContactInfo(data.contactInfo || ""); // Set contact info or empty string
          }
        } catch (error) {
          console.error("Error fetching contact info:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchContactInfo();
  }, [currentUser]);

  const handleButtonClick = async () => {
    try {
      await saveContactInfo(contactInfo.trim()); // Trim the value but allow empty string
      navigate("/dashboard");
    } catch (error) {
      alert("Failed to save contact info - try again.");
      console.error("Error saving contact info:", error);
    }
  };

  const saveContactInfo = async (info: string) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { contactInfo: info }, { merge: true });
      } catch (error) {
        console.error("Error saving contact info:", error);
      }
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Account details"
          title="Contact info"
          description="Provide the contact details displayed on your public profile."
          backLabel="Back to dashboard"
          onBack={() => navigate("/dashboard")}
        />
        <SectionCard>
          {loading ? (
            <Typography color="text.secondary">Loading contact info...</Typography>
          ) : (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Contact info"
                value={contactInfo}
                onChange={(event) => setContactInfo(event.target.value)}
                placeholder="Discord, Signal, email, or preferred contact"
                multiline
                minRows={3}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  onClick={handleButtonClick}
                  disabled={loading}
                >
                  Save contact info
                </Button>
                <Tooltip
                  title="Clear this field and save to remove contact info from your profile."
                  arrow
                >
                  <IconButton aria-label="How to remove contact info">
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          )}
        </SectionCard>
      </Stack>
    </PageContainer>
  );
}

export default ContactInfo;
