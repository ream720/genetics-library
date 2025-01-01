import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Snackbar } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

function ContactInfo() {
  const [contactInfo, setContactInfo] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();

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
    if (!contactInfo.trim()) return;

    try {
      await saveContactInfo(contactInfo);
      console.log("Contact Info:", contactInfo);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving contact info:", error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
    <Box
      sx={{
        maxWidth: 400,
        margin: "0 auto",
        mt: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Set Contact Info
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <TextField
            fullWidth
            label="Contact Info"
            variant="outlined"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Enter your contact information"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleButtonClick}
            disabled={loading}
          >
            Set Contact Info
          </Button>
        </>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="Contact info saved!"
      />
    </Box>
  );
}

export default ContactInfo;
