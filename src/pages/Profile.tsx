import {
  AttachMoney,
  CurrencyBitcoin,
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
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
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import CashAppBadge from "../assets/cashapp-badge.svg";
import GeneticsCard from "../components/genetics/GeneticsCard";
import { EmptyState, PageContainer, PageHeader, SectionCard } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { Clone, Seed } from "../types";

interface UserProfile {
  email: string;
  username: string;
  photoURL?: string;
  paymentMethods?: string[];
  contactInfo?: string;
}

const paymentMethods = [
  {
    name: "PayPal",
    logo: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg",
  },
  { name: "CashApp", logo: CashAppBadge },
  { name: "Crypto", icon: <CurrencyBitcoin fontSize="medium" /> },
  { name: "Cash", icon: <AttachMoney fontSize="medium" /> },
];

const collectionGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(3, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1.5,
};

const PROFILE_COLLECTION_INITIAL_LIMIT = 12;
const PROFILE_COLLECTION_INCREMENT = 12;

function Profile() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileSeeds, setProfileSeeds] = useState<Seed[]>([]);
  const [profileClones, setProfileClones] = useState<Clone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useParams<{ userId: string }>();
  const profileUserId = userId ?? currentUser?.uid;
  const [seedSearchQuery, setSeedSearchQuery] = useState("");
  const [cloneSearchQuery, setCloneSearchQuery] = useState("");
  const [seedDisplayLimit, setSeedDisplayLimit] = useState(
    PROFILE_COLLECTION_INITIAL_LIMIT
  );
  const [cloneDisplayLimit, setCloneDisplayLimit] = useState(
    PROFILE_COLLECTION_INITIAL_LIMIT
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [shareSnackbarMessage, setShareSnackbarMessage] = useState("");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const itemType = searchParams.get("itemType");
  const itemId = searchParams.get("itemId");

  useEffect(() => {
    if (!loading && itemType && itemId) {
      const elementId = `${itemType}-${itemId}`;
      const target = document.getElementById(elementId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedId(elementId);
        window.setTimeout(() => setHighlightedId(null), 2000);
      }
    }
  }, [cloneDisplayLimit, itemId, itemType, loading, seedDisplayLimit]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      const userToFetch = profileUserId;

      if (!userToFetch) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", userToFetch);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);

          const seedsQuery = query(
            collection(db, "seeds"),
            where("userId", "==", userToFetch)
          );
          const seedsSnapshot = await getDocs(seedsQuery);
          const seedsData = seedsSnapshot.docs.map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id,
              } as Seed)
          );
          setProfileSeeds(seedsData);

          const clonesQuery = query(
            collection(db, "clones"),
            where("userId", "==", userToFetch)
          );
          const clonesSnapshot = await getDocs(clonesQuery);
          const clonesData = clonesSnapshot.docs.map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id,
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
  }, [profileUserId]);

  useEffect(() => {
    setSeedDisplayLimit(PROFILE_COLLECTION_INITIAL_LIMIT);
  }, [seedSearchQuery]);

  useEffect(() => {
    setCloneDisplayLimit(PROFILE_COLLECTION_INITIAL_LIMIT);
  }, [cloneSearchQuery]);

  const filteredSeeds = useMemo(
    () =>
      profileSeeds.filter(
        (seed) =>
          seed.strain
            .toLowerCase()
            .includes(seedSearchQuery.toLowerCase()) ||
          seed.breeder.toLowerCase().includes(seedSearchQuery.toLowerCase())
      ),
    [profileSeeds, seedSearchQuery]
  );

  const filteredClones = useMemo(
    () =>
      profileClones.filter(
        (clone) =>
          clone.strain
            .toLowerCase()
            .includes(cloneSearchQuery.toLowerCase()) ||
          clone.breeder.toLowerCase().includes(cloneSearchQuery.toLowerCase())
      ),
    [cloneSearchQuery, profileClones]
  );

  useEffect(() => {
    if (itemType !== "seed" || !itemId) {
      return;
    }

    const linkedSeedIndex = filteredSeeds.findIndex((seed) => seed.id === itemId);
    if (linkedSeedIndex >= 0) {
      setSeedDisplayLimit((currentLimit) =>
        linkedSeedIndex >= currentLimit ? linkedSeedIndex + 1 : currentLimit
      );
    }
  }, [filteredSeeds, itemId, itemType]);

  useEffect(() => {
    if (itemType !== "clone" || !itemId) {
      return;
    }

    const linkedCloneIndex = filteredClones.findIndex(
      (clone) => clone.id === itemId
    );
    if (linkedCloneIndex >= 0) {
      setCloneDisplayLimit((currentLimit) =>
        linkedCloneIndex >= currentLimit ? linkedCloneIndex + 1 : currentLimit
      );
    }
  }, [filteredClones, itemId, itemType]);

  const displayedSeeds = filteredSeeds.slice(0, seedDisplayLimit);
  const displayedClones = filteredClones.slice(0, cloneDisplayLimit);
  const hasMoreSeeds = displayedSeeds.length < filteredSeeds.length;
  const hasMoreClones = displayedClones.length < filteredClones.length;
  const profileSummary = `${profileSeeds.length} seed ${
    profileSeeds.length === 1 ? "entry" : "entries"
  } and ${profileClones.length} clone ${
    profileClones.length === 1 ? "entry" : "entries"
  }`;
  const hasProfileDetails = Boolean(
    userProfile?.paymentMethods?.length || userProfile?.contactInfo
  );

  const handleShare = (itemType: "seed" | "clone", itemId: string) => {
    if (!profileUserId) {
      setShareSnackbarMessage("Unable to create share link.");
      setShareSnackbarOpen(true);
      return;
    }

    const shareUrl = `${window.location.origin}/profile/${encodeURIComponent(
      profileUserId
    )}?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(
      itemId
    )}`;

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setShareSnackbarMessage("Link copied to clipboard.");
        setShareSnackbarOpen(true);
      })
      .catch(() => {
        setShareSnackbarMessage("Unable to copy link.");
        setShareSnackbarOpen(true);
      });
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="lg">
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer maxWidth="xl">
        <Stack spacing={2.5}>
          <PageHeader
            eyebrow={userId ? "Public profile" : "Your profile"}
            title={userProfile?.username ?? "Profile"}
            description={profileSummary}
            actions={
              <Avatar
                src={userProfile?.photoURL || ""}
                alt={userProfile?.username || "User"}
                sx={{ width: 56, height: 56 }}
              />
            }
          />

          {hasProfileDetails && (
            <SectionCard contentPadding={2.5}>
              <Stack spacing={2}>
                {userProfile?.paymentMethods?.length ? (
                  <Box>
                    <Typography variant="caption" fontWeight={800}>
                      Accepted payment methods
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 1 }}
                    >
                      {userProfile.paymentMethods.map((method) => {
                        const paymentMethod = paymentMethods.find(
                          (item) => item.name === method
                        );

                        return (
                          <Tooltip title={method} key={method}>
                            <Box
                              sx={(theme) => ({
                                width: 44,
                                height: 44,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: theme.palette.surface.subtle,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                color: "text.secondary",
                              })}
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
                ) : null}

                {userProfile?.contactInfo && (
                  <Box>
                    <Typography variant="caption" fontWeight={800}>
                      Contact
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                    >
                      {userProfile.contactInfo}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </SectionCard>
          )}

          <Accordion defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.5, sm: 1.5 }}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Typography variant="h6">Seeds Collection</Typography>
                <Chip
                  label={
                    hasMoreSeeds
                      ? `${displayedSeeds.length} of ${filteredSeeds.length}`
                      : `${filteredSeeds.length} shown`
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="Search seeds"
                  value={seedSearchQuery}
                  onChange={(event) => setSeedSearchQuery(event.target.value)}
                  fullWidth
                />

                {profileSeeds.length === 0 ? (
                  <EmptyState
                    title="No seeds yet"
                    description="This profile does not have any public seed entries."
                  />
                ) : filteredSeeds.length === 0 ? (
                  <EmptyState
                    title="No seeds match"
                    description="Try searching by another breeder or strain."
                  />
                ) : (
                  <>
                    <Box sx={collectionGridSx}>
                      {displayedSeeds.map((seed) => (
                        <Box key={seed.id} id={`seed-${seed.id}`}>
                          <GeneticsCard
                            type="seed"
                            item={seed}
                            highlighted={highlightedId === `seed-${seed.id}`}
                            onShare={handleShare}
                          />
                        </Box>
                      ))}
                    </Box>
                    {hasMoreSeeds ? (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          setSeedDisplayLimit((currentLimit) =>
                            currentLimit + PROFILE_COLLECTION_INCREMENT
                          )
                        }
                        sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                      >
                        Show next{" "}
                        {Math.min(
                          PROFILE_COLLECTION_INCREMENT,
                          filteredSeeds.length - displayedSeeds.length
                        )}{" "}
                        seeds
                      </Button>
                    ) : null}
                  </>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.5, sm: 1.5 }}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Typography variant="h6">Clones Collection</Typography>
                <Chip
                  label={
                    hasMoreClones
                      ? `${displayedClones.length} of ${filteredClones.length}`
                      : `${filteredClones.length} shown`
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="Search clones"
                  value={cloneSearchQuery}
                  onChange={(event) => setCloneSearchQuery(event.target.value)}
                  fullWidth
                />

                {profileClones.length === 0 ? (
                  <EmptyState
                    title="No clones yet"
                    description="This profile does not have any public clone entries."
                  />
                ) : filteredClones.length === 0 ? (
                  <EmptyState
                    title="No clones match"
                    description="Try searching by another breeder or strain."
                  />
                ) : (
                  <>
                    <Box sx={collectionGridSx}>
                      {displayedClones.map((clone) => (
                        <Box key={clone.id} id={`clone-${clone.id}`}>
                          <GeneticsCard
                            type="clone"
                            item={clone}
                            highlighted={highlightedId === `clone-${clone.id}`}
                            onShare={handleShare}
                          />
                        </Box>
                      ))}
                    </Box>
                    {hasMoreClones ? (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          setCloneDisplayLimit((currentLimit) =>
                            currentLimit + PROFILE_COLLECTION_INCREMENT
                          )
                        }
                        sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                      >
                        Show next{" "}
                        {Math.min(
                          PROFILE_COLLECTION_INCREMENT,
                          filteredClones.length - displayedClones.length
                        )}{" "}
                        clones
                      </Button>
                    ) : null}
                  </>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </PageContainer>

      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setShareSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShareSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {shareSnackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Profile;
