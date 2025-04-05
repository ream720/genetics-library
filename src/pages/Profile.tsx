import {
  AccountTree,
  AttachMoney,
  BrokenImage,
  CurrencyBitcoin,
  EditNote,
  Info,
  Notes,
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
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import CashAppBadge from "../assets/cashapp-badge.svg";
import { useAuth } from "../context/AuthContext";
import { Clone, CultivarInfo, Seed } from "../types";
import CloseIcon from "@mui/icons-material/Close";

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
  { name: "Crypto", icon: <CurrencyBitcoin fontSize="medium" /> }, // Material UI icon
  { name: "Cash", icon: <AttachMoney fontSize="medium" /> }, // Material UI icon
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
  const [selectedCultivarInfo, setSelectedCultivarInfo] =
    useState<CultivarInfo | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [cultivarInfos, setCultivarInfos] = useState<CultivarInfo[]>([]);
  const isOwner = !userId || userId === currentUser?.uid;

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

  // Add effect to fetch cultivar infos
  useEffect(() => {
    const fetchCultivarInfos = async () => {
      if (loading || !userProfile) return;

      try {
        const userToFetch = userId || currentUser?.uid;
        if (!userToFetch) return;

        // Add a console.log to debug
        console.log("Fetching cultivar info for user:", userToFetch);

        const q = query(
          collection(db, "cultivarInfo"),
          where("userId", "==", userToFetch)
        );

        const querySnapshot = await getDocs(q);
        const infos = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as CultivarInfo)
        );

        console.log("Found cultivar infos:", infos.length);
        setCultivarInfos(infos);
      } catch (error) {
        console.error("Error fetching cultivar info:", error);
      }
    };

    fetchCultivarInfos();
  }, [userProfile, loading, currentUser, userId]);

  const filteredSeeds = profileSeeds.filter(
    (seed) =>
      seed.strain.toLowerCase().includes(seedSearchQuery.toLowerCase()) ||
      seed.breeder.toLowerCase().includes(seedSearchQuery.toLowerCase())
  );

  const filteredClones = profileClones.filter(
    (clone) =>
      clone.strain.toLowerCase().includes(cloneSearchQuery.toLowerCase()) ||
      clone.breeder.toLowerCase().includes(cloneSearchQuery.toLowerCase())
  );

  // Display to cultivar info
  const goToCultivarInfo = (itemType: "seed" | "clone", itemId: string) => {
    const existingInfo = cultivarInfos.find(
      (info) => info.itemType === itemType && info.itemId === itemId
    );

    if (existingInfo && existingInfo.id) {
      if (isOwner) {
        // Owner can edit - navigate to the edit page
        navigate(`/cultivar-info?existingId=${existingInfo.id}`);
      } else {
        // Non-owner views in modal
        setSelectedCultivarInfo(existingInfo);
        setInfoDialogOpen(true);
      }
    } else if (isOwner) {
      // Only owner can add new info
      navigate(`/cultivar-info?itemType=${itemType}&itemId=${itemId}`);
    }
  };

  console.log("Profile render - userId:", userId);
  console.log("Profile render - currentUser:", currentUser?.uid);
  console.log("Profile render - isOwner:", isOwner);

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

  const CultivarInfoDialog = () => {
    if (!selectedCultivarInfo) return null;

    // Find the corresponding item
    const item =
      selectedCultivarInfo.itemType === "seed"
        ? profileSeeds.find((seed) => seed.id === selectedCultivarInfo.itemId)
        : profileClones.find(
            (clone) => clone.id === selectedCultivarInfo.itemId
          );

    if (!item) return null;

    return (
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6">Cultivar Information</Typography>
          <IconButton onClick={() => setInfoDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {selectedCultivarInfo.itemType === "seed" ? "Seed" : "Clone"}:{" "}
              <strong>{item.strain}</strong> by {item.breeder}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {selectedCultivarInfo.growingMethod && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Growing Method</Typography>
                  <Typography variant="body1">
                    {selectedCultivarInfo.growingMethod}
                  </Typography>
                </Grid>
              )}

              {selectedCultivarInfo.potSize && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Pot Size</Typography>
                  <Typography variant="body1">
                    {selectedCultivarInfo.potSize}
                  </Typography>
                </Grid>
              )}

              {selectedCultivarInfo.nutrients && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Nutrients</Typography>
                  <Typography variant="body1">
                    {selectedCultivarInfo.nutrients}
                  </Typography>
                </Grid>
              )}

              {selectedCultivarInfo.feedSchedule && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Feed Schedule</Typography>
                  <Typography variant="body1">
                    {selectedCultivarInfo.feedSchedule}
                  </Typography>
                </Grid>
              )}

              {selectedCultivarInfo.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body1">
                    {selectedCultivarInfo.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  console.log("Cultivar infos:", cultivarInfos);

  return (
    <>
      {/* <GeminiTest /> */}
      <Box
        sx={{
          maxWidth: 1400,
          paddingBottom: "36px",
          margin: "auto",
          px: 2,
        }}
      >
        {/* User Info */}

        <Accordion
          defaultExpanded
          sx={{
            maxWidth: 420,
            borderRadius: 2,
            marginBottom: 2,
            "&:before": {
              display: "none", // Removes the default divider
            },
            "& .MuiAccordionSummary-root": {
              minHeight: "48px",
              padding: 1,
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <Tooltip title="Expand/Collapse">
                <ExpandMoreIcon />
              </Tooltip>
            }
            sx={{
              flexDirection: "row",
              "& .MuiAccordionSummary-content": {
                margin: 0,
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                src={userProfile?.photoURL || ""}
                alt={userProfile?.username || "User"}
                sx={{
                  width: 36,
                  height: 36,
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                }}
              />
              <Typography variant="h6" fontWeight={800}>
                {userProfile?.username}
              </Typography>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0, pb: 2 }}>
            {/* Payment Methods */}
            {userProfile?.paymentMethods &&
              userProfile?.paymentMethods?.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    sx={{
                      display: "block",
                    }}
                  >
                    Accepted Payment Methods:
                  </Typography>
                  <Box sx={{ padding: 1 }}>
                    <Stack direction="row" gap={0.5}>
                      {userProfile.paymentMethods.map((method) => {
                        const paymentMethod = paymentMethods.find(
                          (item) => item.name === method
                        );
                        return (
                          <Tooltip title={method} key={method}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                borderRadius: 1.5,
                                padding: 0.5,
                                transition: "background-color 0.2s",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.1)",
                                },
                              }}
                            >
                              {paymentMethod?.logo ? (
                                <img
                                  src={paymentMethod.logo}
                                  alt={method}
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
                  </Box>
                </Box>
              )}

            {/* Contact Info */}
            {userProfile?.contactInfo && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{
                    display: "block",
                  }}
                >
                  Contact Info:
                </Typography>
                <Box sx={{ px: 1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {userProfile.contactInfo}
                  </Typography>
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Seeds Section */}
        <Accordion
          square={false}
          defaultExpanded
          sx={{
            mb: 2,
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
            <Tooltip title="Search by Breeder or Strain">
              <TextField
                sx={{ flexGrow: 1, mb: 2 }}
                size="small"
                variant="outlined"
                placeholder="Seeds Search"
                value={seedSearchQuery}
                onChange={(e) => setSeedSearchQuery(e.target.value)}
              />
            </Tooltip>

            {profileSeeds.length === 0 ? ( // Check if no seeds are added
              <Typography color="text.secondary">
                No seeds added yet.
              </Typography>
            ) : filteredSeeds.length === 0 ? ( // Check if search yields no results
              <Typography color="text.secondary">
                No seeds match your search.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {filteredSeeds.map((seed) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
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
                      sx={{
                        height: 150, // Fixed height
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardHeader
                        sx={{
                          py: 1,
                          pb: 0,
                          "& .MuiCardHeader-content": {
                            overflow: "hidden",
                            minWidth: 0, // Enables truncation in flex container
                          },
                          "& .MuiCardHeader-action": {
                            marginTop: 0, // Align with title
                            marginRight: 0, // Remove default margin
                          },
                        }}
                        title={
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            minWidth={0}
                          >
                            <Tooltip
                              title={`${seed.feminized === true ? "♀" : ""} ${
                                seed.strain
                              }`}
                            >
                              <Typography
                                variant="subtitle1"
                                component="span"
                                sx={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  minWidth: 0,
                                }}
                              >
                                {`${seed.feminized === true ? "♀" : ""} ${
                                  seed.strain
                                }`}
                              </Typography>
                            </Tooltip>
                            {seed.open && (
                              <Tooltip title="Open Pack">
                                <BrokenImage
                                  color="warning"
                                  fontSize="small"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        action={
                          <Box display="flex" gap={1} ml={1}>
                            {seed.isMultiple && (
                              <Tooltip title="Number of packs available">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    bgcolor: "rgba(255, 255, 255, 0.1)",
                                    borderRadius: 1,
                                    px: 0.75,
                                    py: 0.25,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  x{seed.quantity}
                                </Box>
                              </Tooltip>
                            )}
                            {seed.lineage && (
                              <Tooltip
                                title={seed.lineage || "No lineage information"}
                              >
                                <AccountTree color="action" fontSize="small" />
                              </Tooltip>
                            )}

                            {seed.available ? (
                              <Tooltip title="Available">
                                <CheckCircleIcon
                                  color="success"
                                  fontSize="small"
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Unavailable">
                                <CancelIcon color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        }
                      />
                      <CardContent
                        sx={{
                          py: 0.5, // Reduced padding
                          flex: 1,
                        }}
                      >
                        <Stack spacing={0.5}>
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
                        </Stack>
                      </CardContent>
                      <CardActions
                        sx={{
                          justifyContent: "space-between",
                          py: 0.5,
                          px: 2,
                          mt: "auto",
                        }}
                      >
                        {/* Add Cultivar Info button */}
                        {cultivarInfos.some(
                          (info) =>
                            info.itemType === "seed" && info.itemId === seed.id
                        ) ? (
                          <Tooltip
                            title={
                              isOwner
                                ? "Edit Cultivar Info"
                                : "View Cultivar Info"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => goToCultivarInfo("seed", seed.id!)}
                            >
                              <Notes fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          isOwner && (
                            <Tooltip title="Add Cultivar Info">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  goToCultivarInfo("seed", seed.id!)
                                }
                              >
                                <EditNote fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )
                        )}

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
            <Tooltip title="Search by Breeder or Strain">
              <TextField
                sx={{ flexGrow: 1, mb: 2 }}
                size="small"
                variant="outlined"
                placeholder="Clone Search"
                value={cloneSearchQuery}
                onChange={(e) => setCloneSearchQuery(e.target.value)}
              />
            </Tooltip>
            {profileClones.length === 0 ? ( // Check if no clones are added
              <Typography color="text.secondary">
                No clones added yet.
              </Typography>
            ) : filteredClones.length === 0 ? ( // Check if search yields no results
              <Typography color="text.secondary">
                No clones match your search.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {filteredClones.map((clone) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
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
                      sx={{
                        height: 150, // Fixed height
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardHeader
                        sx={{
                          py: 1,
                          pb: 0,
                          "& .MuiCardHeader-content": {
                            overflow: "hidden",
                            minWidth: 0, // Enables truncation in flex container
                          },
                          "& .MuiCardHeader-action": {
                            marginTop: 0, // Align with title
                            marginRight: 0, // Remove default margin
                          },
                        }}
                        title={
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            minWidth={0}
                          >
                            <Tooltip
                              title={`${clone.sex === "Female" ? "♀" : ""} ${
                                clone.strain
                              }`}
                            >
                              <Typography
                                variant="subtitle1"
                                component="span"
                                sx={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  minWidth: 0,
                                }}
                              >
                                {`${clone.sex === "Female" ? "♀" : ""} ${
                                  clone.strain
                                }`}
                              </Typography>
                            </Tooltip>
                            {clone.breederCut && (
                              <Tooltip title="Breeder Cut">
                                <Verified
                                  color="action"
                                  fontSize="small"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        action={
                          <Box display="flex" gap={1}>
                            {clone.lineage && (
                              <Tooltip
                                title={
                                  clone.lineage || "No lineage information"
                                }
                              >
                                <AccountTree color="action" fontSize="small" />
                              </Tooltip>
                            )}

                            {clone.available ? (
                              <Tooltip title="Available">
                                <CheckCircleIcon
                                  color="success"
                                  fontSize="small"
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Unavailable">
                                <CancelIcon color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        }
                      />
                      <CardContent
                        sx={{
                          py: 0.5, // Reduced padding
                          flex: 1,
                        }}
                      >
                        <Stack spacing={0.5}>
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
                      <CardActions
                        sx={{
                          justifyContent: "space-between",
                          py: 0.5,
                          px: 2,
                          mt: "auto",
                        }}
                      >
                        {/* Add Cultivar Info button */}
                        {cultivarInfos.some(
                          (info) =>
                            info.itemType === "clone" &&
                            info.itemId === clone.id
                        ) ? (
                          <Tooltip
                            title={
                              isOwner
                                ? "Edit Cultivar Info"
                                : "View Cultivar Info"
                            }
                          >
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                goToCultivarInfo("clone", clone.id!)
                              }
                            >
                              <Info fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          isOwner && (
                            <Tooltip title="Add Cultivar Info">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  goToCultivarInfo("clone", clone.id!)
                                }
                              >
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )
                        )}

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
      <CultivarInfoDialog />
    </>
  );
}

export default Profile;
