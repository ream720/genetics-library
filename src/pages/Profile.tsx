import {
  AttachMoney,
  BrokenImage,
  CurrencyBitcoin,
  Verified,
} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import CashAppBadge from "../assets/cashapp-badge.svg";
import { useAuth } from "../context/AuthContext";
import { Clone, Seed } from "../types";

interface UserProfile {
  email: string;
  username: string;
  photoURL?: string;
  paymentMethods?: string[];
  contactInfo?: string;
}

// Map payment methods to their logos/icons
const paymentMethods = [
  {
    name: "PayPal",
    logo: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg",
  },
  { name: "CashApp", logo: CashAppBadge }, // Local SVG
  { name: "Crypto", icon: <CurrencyBitcoin fontSize="large" /> }, // Material UI icon
  { name: "Cash", icon: <AttachMoney fontSize="large" /> }, // Material UI icon
];

function Profile() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileSeeds, setProfileSeeds] = useState<Seed[]>([]);
  const [profileClones, setProfileClones] = useState<Clone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useParams<{ userId: string }>();
  const [seedSearchQuery, setSeedSearchQuery] = useState<string>("");
  const [cloneSearchQuery, setCloneSearchQuery] = useState<string>("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Get item info from query params
  const itemType = searchParams.get("itemType"); // possible values: "seed" or "clone"
  const itemId = searchParams.get("itemId");

  useEffect(() => {
    if (!loading && itemType && itemId) {
      const elementId = `${itemType}-${itemId}`;
      const target = document.getElementById(elementId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedId(elementId);
        // Optionally clear highlight after 2-3 seconds
        setTimeout(() => setHighlightedId(null), 2000);
      }
    }
  }, [loading, itemType, itemId]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

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
          setProfileClones(clonesData);
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
  }, [currentUser, userId]);

  const filteredSeeds = profileSeeds.filter((seed) =>
    seed.strain.toLowerCase().includes(seedSearchQuery.toLowerCase())
  );

  const filteredClones = profileClones.filter((clone) =>
    clone.strain.toLowerCase().includes(cloneSearchQuery.toLowerCase())
  );

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
          <Typography variant="h6" fontWeight="bold">
            {userProfile?.username}
          </Typography>
        </Box>

        {/* Payment Methods */}
        {userProfile?.paymentMethods &&
        userProfile?.paymentMethods?.length > 0 ? (
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

            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              {userProfile.paymentMethods.map((method) => {
                const paymentMethod = paymentMethods.find(
                  (item) => item.name === method
                );

                return (
                  <Tooltip title={method} key={method}>
                    <Box
                      key={method}
                      sx={{
                        width: 50,
                        height: 50,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        borderRadius: "35%",
                        padding: 1,
                      }}
                    >
                      {paymentMethod?.logo ? (
                        <img
                          src={paymentMethod.logo}
                          alt={`${method} Logo`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        paymentMethod?.icon
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          </Card>
        ) : null}

        {/* Contact Info */}
        {userProfile?.contactInfo ? (
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
              Contact Info
            </Typography>

            <Typography variant="body2">{userProfile.contactInfo}</Typography>
          </Card>
        ) : null}
      </Box>

      {/* Seeds Section */}
      <Accordion
        square={false}
        defaultExpanded
        sx={{
          mb: 4,
          borderRadius: 2,
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)", // Matches Card's shadow
          overflow: "hidden",
          transition: "all 0.3s ease", // Smooth animation
        }}
      >
        <AccordionSummary
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          expandIcon={
            <Tooltip title="Expand/Collapse">
              <ExpandMoreIcon />
            </Tooltip>
          }
        >
          <Typography variant="h6">Seeds Collection</Typography>
        </AccordionSummary>

        <AccordionDetails>
          {/* Search Input */}
          <TextField
            sx={{ flexGrow: 1, mb: 2 }}
            size="small"
            variant="outlined"
            placeholder="Search seeds by strain..."
            value={seedSearchQuery}
            onChange={(e) => setSeedSearchQuery(e.target.value)}
          />

          {profileSeeds.length === 0 ? ( // Check if no seeds are added
            <Typography color="text.secondary">No seeds added yet.</Typography>
          ) : filteredSeeds.length === 0 ? ( // Check if search yields no results
            <Typography color="text.secondary">
              No seeds match your search.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredSeeds.map((seed) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={seed.id}
                  id={`seed-${seed.id}`}
                >
                  <Card
                    className={
                      highlightedId === `seed-${seed.id}`
                        ? "highlight-animate"
                        : ""
                    }
                    variant="outlined"
                  >
                    <CardHeader
                      title={`${seed.feminized === true ? "♀" : ""} ${
                        seed.strain
                      }`}
                      action={
                        // Icons for availability
                        seed.available ? (
                          <Tooltip title="Available">
                            <CheckCircleIcon color="success" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Unavailable">
                            <CancelIcon color="error" />
                          </Tooltip>
                        )
                      }
                    />
                    <CardContent sx={{ paddingY: 1 }}>
                      <Stack>
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
                        {seed.open && (
                          <Tooltip title="Open Pack">
                            <BrokenImage color="warning" />
                          </Tooltip>
                        )}
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-end" }}>
                      {/* Date Added */}
                      <Typography color="text.secondary" variant="caption">
                        Added:{" "}
                        {new Date(seed.dateAcquired).toLocaleDateString()}
                      </Typography>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Clones Section */}
      <Accordion
        square={false}
        defaultExpanded
        sx={{
          mb: 4,
          borderRadius: 2,
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)", // Matches Card's shadow
          overflow: "hidden",
          transition: "all 0.3s ease", // Smooth animation
        }}
      >
        <AccordionSummary
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          expandIcon={
            <Tooltip title="Expand/Collapse">
              <ExpandMoreIcon />
            </Tooltip>
          }
        >
          <Typography variant="h6">Clones Collection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Search Input */}
          <TextField
            sx={{ flexGrow: 1, mb: 2 }}
            size="small"
            variant="outlined"
            placeholder="Search clones by strain..."
            value={cloneSearchQuery}
            onChange={(e) => setCloneSearchQuery(e.target.value)}
          />
          {profileClones.length === 0 ? ( // Check if no clones are added
            <Typography color="text.secondary">No clones added yet.</Typography>
          ) : filteredClones.length === 0 ? ( // Check if search yields no results
            <Typography color="text.secondary">
              No clones match your search.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredClones.map((clone) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={clone.id}
                  id={`clone-${clone.id}`}
                >
                  <Card
                    className={
                      highlightedId === `clone-${clone.id}`
                        ? "highlight-animate"
                        : ""
                    }
                    variant="outlined"
                  >
                    <CardHeader
                      title={`${clone.sex === "Female" ? "♀" : ""} ${
                        clone.strain
                      }`}
                      subheader={
                        clone.breederCut ? (
                          <Chip
                            sx={{ mt: 1 }}
                            size="small"
                            label="Breeder Cut"
                            variant="outlined"
                            icon={<Verified />}
                          />
                        ) : null
                      }
                      action={
                        // Icons for availability
                        clone.available ? (
                          <Tooltip title="Available">
                            <CheckCircleIcon color="success" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Unavailable">
                            <CancelIcon color="error" />
                          </Tooltip>
                        )
                      }
                    />
                    <CardContent sx={{ paddingY: 1 }}>
                      <Stack>
                        {/* Clone Details */}
                        <Typography variant="body2">
                          <strong>Breeder:</strong> {clone.breeder}
                        </Typography>
                        {clone.cutName && (
                          <Typography variant="body2">
                            <strong>Cut Name:</strong> {clone.cutName}
                          </Typography>
                        )}
                        {clone.generation && (
                          <Typography variant="body2">
                            <strong>Generation:</strong> {clone.generation}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-end" }}>
                      {/* Date Added */}
                      <Typography color="text.secondary" variant="caption">
                        Added:{" "}
                        {new Date(clone.dateAcquired).toLocaleDateString()}
                      </Typography>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default Profile;
