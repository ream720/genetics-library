import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

function ContactInfo() {
  const [contactInfo, setContactInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { currentUser } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchContactInfo = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!isMounted) {
          return;
        }

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setContactInfo(
            typeof data.contactInfo === "string" ? data.contactInfo : ""
          );
        }
      } catch (fetchError) {
        console.error("Error fetching contact info:", fetchError);
        if (isMounted) {
          setError("Failed to load contact info. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchContactInfo();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSave = async () => {
    try {
      setError("");
      setIsSaving(true);
      await saveContactInfo(contactInfo.trim());
      navigate("/dashboard");
    } catch (saveError) {
      console.error("Error saving contact info:", saveError);
      setError("Failed to save contact info. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveContactInfo = async (info: string) => {
    if (!currentUser) {
      throw new Error("Cannot save contact info without an authenticated user.");
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, { contactInfo: info }, { merge: true });
  };

  return (
    <PageContainer maxWidth="sm">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Account details"
          title="Contact info"
          description="Add optional ways for other users to reach you from your public profile."
          backLabel="Back to dashboard"
          onBack={() => navigate("/dashboard")}
        />

        <SectionCard
          title="Public contact details"
          description="This appears on your public profile. Leave it blank if you do not want to show contact information."
          action={<Chip label="Public profile" variant="outlined" color="primary" />}
        >
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            {isLoading ? (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minHeight: 96 }}
              >
                <CircularProgress size={22} />
                <Typography color="text.secondary">Loading contact info...</Typography>
              </Stack>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Contact info"
                  value={contactInfo}
                  onChange={(event) => setContactInfo(event.target.value)}
                  placeholder="Email, Instagram, website, Discord, or other preferred contact details"
                  helperText={`${contactInfo.length}/500 characters. Clear this field and save to remove contact info from your profile.`}
                  inputProps={{ maxLength: 500 }}
                  multiline
                  minRows={5}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save contact info"}
                </Button>
              </>
            )}
          </Stack>
        </SectionCard>
      </Stack>
    </PageContainer>
  );
}

export default ContactInfo;
