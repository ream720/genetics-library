import React, { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { app, logAnalyticsEvent } from "../../firebaseConfig";
import { EmptyState, PageContainer, PageHeader, SectionCard } from "../components/ui";
import { Clone, Seed } from "../types";

const db = getFirestore(app);

interface UserProfile {
  id: string;
  username: string;
  profilePicture?: string;
}

interface SearchResult {
  type: "user" | "seed" | "clone";
  id: string;
  userId: string;
  username?: string;
  strain?: string;
  breeder?: string;
  profilePicture?: string;
  isMultiple?: boolean;
  quantity?: number;
  phenoHunted?: boolean;
}

const resultTabs: Array<{ label: string; type: SearchResult["type"] }> = [
  { label: "Users", type: "user" },
  { label: "Seeds", type: "seed" },
  { label: "Clones", type: "clone" },
];

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearch = async () => {
    logAnalyticsEvent("search", {
      search_term: searchQuery,
      active_tab: activeTab,
    });
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const [users, seeds, clones] = await Promise.all([
        searchUsers(searchQuery),
        searchSeeds(searchQuery),
        searchClones(searchQuery),
      ]);

      const userIdsSet = new Set([
        ...seeds
          .filter((seed) => seed.userId)
          .map((seed) => seed.userId as string),
        ...clones
          .filter((clone) => clone.userId)
          .map((clone) => clone.userId as string),
      ]);

      const userProfiles = await fetchUserProfiles(Array.from(userIdsSet));
      const userProfileMap = new Map(
        userProfiles.map((profile) => [profile.id, profile])
      );

      const transformedResults: SearchResult[] = [
        ...users.map(
          (user): SearchResult => ({
            type: "user",
            id: user.id,
            userId: user.id,
            username: user.username,
            profilePicture: user.profilePicture,
          })
        ),
        ...seeds.map(
          (seed): SearchResult => ({
            type: "seed",
            id: seed.id ?? "",
            userId: seed.userId ?? "",
            strain: seed.strain,
            breeder: seed.breeder,
            username: userProfileMap.get(seed.userId ?? "")?.username,
            profilePicture: userProfileMap.get(seed.userId ?? "")
              ?.profilePicture,
            isMultiple: seed.isMultiple,
            quantity: seed.quantity,
          })
        ),
        ...clones.map(
          (clone): SearchResult => ({
            type: "clone",
            id: clone.id ?? "",
            userId: clone.userId ?? "",
            strain: clone.strain,
            breeder: clone.breeder,
            username: userProfileMap.get(clone.userId ?? "")?.username,
            profilePicture: userProfileMap.get(clone.userId ?? "")
              ?.profilePicture,
            phenoHunted: clone.phenoHunted,
          })
        ),
      ];

      setSearchResults(transformedResults);

      if (transformedResults.length === 0) {
        setSnackbarMessage("No search results found.");
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError("Failed to perform search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (queryText: string): Promise<UserProfile[]> => {
    const lowerQuery = queryText.toLowerCase();
    const usersQuery = query(
      collection(db, "users"),
      where("userNameLower", ">=", lowerQuery),
      where("userNameLower", "<=", lowerQuery + "\uf8ff")
    );
    const usersSnapshot = await getDocs(usersQuery);

    return usersSnapshot.docs.map((doc): UserProfile => {
      const userData = doc.data();
      return {
        id: doc.id,
        username: userData.username || "",
        profilePicture: userData.photoURL || userData.profilePicture,
      };
    });
  };

  const searchSeeds = async (queryText: string): Promise<Seed[]> => {
    const seedsRef = collection(db, "seeds");

    try {
      const snapshot = await getDocs(seedsRef);
      const seeds = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seed[];

      const lowerQuery = queryText.toLowerCase().trim();
      return seeds.filter(
        (seed) =>
          seed.strain.toLowerCase().includes(lowerQuery) ||
          seed.breeder.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error("Error searching seeds:", error);
      return [];
    }
  };

  const searchClones = async (queryText: string): Promise<Clone[]> => {
    const clonesRef = collection(db, "clones");

    try {
      const snapshot = await getDocs(clonesRef);
      const clones = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Clone[];

      const lowerQuery = queryText.toLowerCase().trim();
      return clones.filter(
        (clone) =>
          clone.strain.toLowerCase().includes(lowerQuery) ||
          clone.breeder.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error("Error searching clones:", error);
      return [];
    }
  };

  const fetchUserProfiles = async (
    userIds: string[]
  ): Promise<UserProfile[]> => {
    const profiles = await Promise.all(
      userIds.map(async (userId) => {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const profile: UserProfile = {
            id: userId,
            username: userData?.username || "",
            profilePicture: userData?.photoURL || userData?.profilePicture,
          };
          return profile;
        }
        return null;
      })
    );

    return profiles.filter(
      (profile): profile is UserProfile => profile !== null
    );
  };

  const activeResultType = resultTabs[activeTab].type;
  const filteredResults = searchResults.filter(
    (result) => result.type === activeResultType
  );

  const countByType = (type: SearchResult["type"]) =>
    searchResults.filter((result) => result.type === type).length;

  const getResultContent = (result: SearchResult) => {
    if (result.type === "user") {
      return {
        primary: result.username,
        secondary: "User Profile",
      };
    }

    if (result.type === "clone") {
      return {
        primary: result.strain,
        secondary: `${result.breeder}${
          result.phenoHunted ? " - Pheno Hunted" : ""
        } - @${result.username}`,
      };
    }

    let secondary = result.breeder;

    if (result.isMultiple && result.quantity && result.quantity > 1) {
      secondary = `${result.breeder} - ${result.quantity} packs available`;
    }

    return {
      primary: result.strain,
      secondary: `${secondary} - @${result.username}`,
    };
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={2.5}>
        <PageHeader
          eyebrow="Community database"
          title="Search"
          description="Find users and public seed or clone entries by username, strain, breeder, or lineage."
        />

        <SectionCard title="Search Library" contentPadding={2.5}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Search users, seeds, or clones"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Search
              </Button>
            </Stack>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {searchResults.length > 0 ? (
              <>
                <Box
                  sx={(theme) => ({
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 3,
                    bgcolor: theme.palette.surface.subtle,
                  })}
                >
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                  >
                    {resultTabs.map((tab) => (
                      <Tab
                        key={tab.type}
                        label={`${tab.label} (${countByType(tab.type)})`}
                      />
                    ))}
                  </Tabs>
                </Box>

                {filteredResults.length === 0 ? (
                  <EmptyState
                    title={`No ${resultTabs[activeTab].label.toLowerCase()} found`}
                    description="Try another result type or search term."
                  />
                ) : (
                  <List disablePadding>
                    {filteredResults.map((result) => {
                      const content = getResultContent(result);

                      return (
                        <ListItem
                          key={`${result.type}-${result.id}`}
                          component={Link}
                          to={`/profile/${result.userId}?itemType=${result.type}&itemId=${result.id}`}
                          sx={(theme) => ({
                            minHeight: 68,
                            mb: 1,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 3,
                            color: "text.primary",
                            textDecoration: "none",
                            bgcolor: theme.palette.surface.subtle,
                            transition:
                              "background-color 180ms ease, border-color 180ms ease",
                            "&:hover": {
                              bgcolor: "action.hover",
                              borderColor: "primary.main",
                            },
                          })}
                        >
                          <ListItemAvatar>
                            <Avatar src={result.profilePicture}>
                              {result.type === "user"
                                ? result.username?.charAt(0)
                                : result.strain?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={content.primary}
                            secondary={content.secondary}
                            primaryTypographyProps={{ fontWeight: 800 }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </>
            ) : !loading ? (
              <EmptyState
                title="Search the community"
                description="Enter a username, breeder, or strain to find public Genetics Library records."
              />
            ) : null}
          </Stack>
        </SectionCard>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={2200}
          onClose={() => setShowSnackbar(false)}
          message={snackbarMessage}
        />
      </Stack>
    </PageContainer>
  );
}

export default SearchPage;
