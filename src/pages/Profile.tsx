import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { Seed, Clone } from "../types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface UserProfile {
  email: string;
  username: string;
  photoURL?: string;
  paymentMethods?: string[];
}

function Profile() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileSeeds, setProfileSeeds] = useState<Seed[]>([]);
  const [clones, setClones] = useState<Clone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useParams<{ userId: string }>();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Reset loading state on new fetch
      setError(null); // Reset error state on new fetch

      const userToFetch = userId || currentUser?.uid;

      if (!userToFetch) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const userDocRef = doc(db, "users", userToFetch);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);

          // Fetch user's seeds
          const seedsQuery = query(
            collection(db, "seeds"),
            where("userId", "==", userToFetch)
          );
          const seedsSnapshot = await getDocs(seedsQuery);
          const seedsData = seedsSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Seed)
          );
          setProfileSeeds(seedsData);

          // Fetch user's clones
          const clonesQuery = query(
            collection(db, "clones"),
            where("userId", "==", userToFetch)
          );
          const clonesSnapshot = await getDocs(clonesQuery);
          const clonesData = clonesSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Clone)
          );
          setClones(clonesData);
        } else {
          setError("User profile not found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, userId]); // Dependencies include userId to refetch when it changes

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      {/* Profile Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
          gap: 2,
        }}
      >
        {/* User Info */}
        <Box display="flex" gap={1} sx={{ flexGrow: 1 }}>
          <Avatar
            src={userProfile?.photoURL || ""}
            alt={userProfile?.username || "User"}
            sx={{ width: 32, height: 32 }}
          />
          {/* Flex-grow to align other elements */}
          <Typography variant="h6" fontWeight="bold">
            {userProfile?.username}
          </Typography>
        </Box>

        {/* Payment Methods */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
            maxWidth: 300,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" fontWeight="bold" mb={1}>
            Accepted Payment Methods
          </Typography>
          {!userProfile?.paymentMethods ||
          userProfile.paymentMethods.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No payment methods selected.
            </Typography>
          ) : (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              {userProfile.paymentMethods.map((method) => (
                <Chip
                  key={method}
                  label={method}
                  variant="outlined"
                  sx={{
                    fontSize: "0.75rem",
                    padding: "0 6px",
                    height: "22px",
                  }}
                />
              ))}
            </Stack>
          )}
        </Card>
      </Box>

      {/* Seeds Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Seeds Collection
          </Typography>
          {profileSeeds.length === 0 ? (
            <Typography color="text.secondary">No seeds added yet.</Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {profileSeeds.map((seed) => (
                <Box
                  key={seed.id}
                  sx={{
                    width: { xs: "100%", sm: "48%", md: "30%" }, // Responsive widths
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        {/* Seed Title and Availability */}
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap", // Allows content to wrap to the next line if necessary
                            gap: 1,
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Strain Name */}
                          <Chip
                            label={seed.strain}
                            sx={{
                              // Restrict the width of the Chip
                              overflow: "hidden", // Hide overflowing text
                              textOverflow: "ellipsis", // Add ellipsis for overflow
                              whiteSpace: "nowrap", // Prevent text wrapping
                            }}
                          />

                          {/* Icons */}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              flexShrink: 0, // Prevent icons from shrinking
                            }}
                          >
                            {seed.feminized && (
                              <Tooltip title="Feminized">
                                <Chip
                                  label="♀"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "1rem" }}
                                />
                              </Tooltip>
                            )}
                            {seed.available ? (
                              <Tooltip title="Available">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Unavailable">
                                <CancelIcon color="error" />
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>

                        {/* Seed Details */}
                        <Typography variant="body2">
                          <strong>Breeder:</strong> {seed.breeder}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Seeds:</strong> {seed.numSeeds}
                        </Typography>
                        {seed.generation && (
                          <Typography variant="body2">
                            <strong>Generation:</strong> {seed.generation}
                          </Typography>
                        )}

                        {/* Seed Tags */}
                        <Stack paddingTop={1} direction="row" spacing={1}>
                          {seed.open && (
                            <Chip
                              label="Open Pack"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {/* Date Added */}
                        <Typography color="text.secondary" variant="body2">
                          Added:{" "}
                          {new Date(seed.dateAcquired).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Clones Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Clones Collection
          </Typography>
          {clones.length === 0 ? (
            <Typography color="text.secondary">No clones added yet.</Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {clones.map((clone) => (
                <Box
                  key={clone.id}
                  sx={{
                    width: { xs: "100%", sm: "48%", md: "30%" }, // Responsive widths
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        {/* Clone Title and Availability */}
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Strain Name */}
                          <Chip
                            label={clone.strain}
                            sx={{
                              overflow: "hidden", // Hide overflowing text
                              textOverflow: "ellipsis", // Add ellipsis for overflow
                              whiteSpace: "nowrap", // Prevent text wrapping
                            }}
                          />

                          {/* Icons */}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              flexShrink: 0, // Prevent icons from shrinking
                            }}
                          >
                            <Tooltip title="Female">
                              <Chip
                                label="♀"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "1rem" }}
                              />
                            </Tooltip>
                            {clone.available ? (
                              <Tooltip title="Available">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Unavailable">
                                <CancelIcon color="error" />
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>

                        {/* Clone Details */}
                        <Typography variant="body2">
                          <strong>Breeder:</strong> {clone.breeder}
                        </Typography>
                        {clone.cutName && (
                          <Typography variant="body2">
                            <strong>Cut Name:</strong> {clone.cutName}
                          </Typography>
                        )}
                        {clone.breederCut && (
                          <Chip
                            sx={{ maxWidth: "40%" }}
                            label="Breeder Cut"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {clone.generation && (
                          <Typography variant="body2">
                            <strong>Generation:</strong> {clone.generation}
                          </Typography>
                        )}

                        {/* Date Added */}
                        <Typography color="text.secondary" variant="body2">
                          Added:{" "}
                          {new Date(clone.dateAcquired).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Profile;
