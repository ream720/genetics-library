import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Avatar, Typography, Box, Stack } from "@mui/material";
import { CrisisAlert } from "@mui/icons-material";

interface UserProfile {
  email: string;
  username: string;
}

function Profile() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          setError("User profile not found.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Avatar
        src={`https://source.unsplash.com/random`}
        alt={userProfile?.username}
        sx={{ width: 80, height: 80, mb: 2 }}
      />
      <Typography variant="h4" gutterBottom>
        {userProfile?.username}
      </Typography>
      <Typography variant="body1">Email: {userProfile?.email}</Typography>
      {/* Add more profile information here */}
      <Stack direction="row" spacing={1} alignItems="center">
        <CrisisAlert color="error"></CrisisAlert>
        <Typography variant="h6" gutterBottom color="yellow">
          this page basically doesn't work yet
        </Typography>
      </Stack>
    </Box>
  );
}

export default Profile;
