import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Container,
  Snackbar,
} from "@mui/material";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app, logAnalyticsEvent } from "../../firebaseConfig";
import { Link } from "react-router-dom";
import { Seed, Clone } from "../types";

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
}

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

      // Get user profiles for seeds and clones
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

      // Transform results into unified format
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
        // Update seed and clone mappings to include profilePicture
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
        profilePicture: userData.photoURL || userData.profilePicture, // Check both possible field names
      };
    });
  };

  const searchSeeds = async (queryText: string): Promise<Seed[]> => {
    // Get all seeds that might be relevant (we'll filter more precisely client-side)
    const seedsRef = collection(db, "seeds");

    try {
      // Get all seeds (this is a temporary solution - we should implement pagination for larger datasets)
      const snapshot = await getDocs(seedsRef);

      const seeds = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seed[];

      // Filter client-side for case-insensitive partial matches
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
      // Get all clones (this is a temporary solution - we should implement pagination for larger datasets)
      const snapshot = await getDocs(clonesRef);

      const clones = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Clone[];

      // Filter client-side for case-insensitive partial matches
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
            profilePicture: userData?.photoURL || userData?.profilePicture, // Check both possible field names
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

  const filteredResults = searchResults.filter((result) => {
    if (activeTab === 0) return result.type === "user"; // Show only users
    if (activeTab === 1) return result.type === "seed"; // Show only seeds
    if (activeTab === 2) return result.type === "clone"; // Show only clones
    return false;
  });

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
        secondary: `${result.breeder} • @${result.username}`,
      };
    }

    // Handle seed display
    let secondary = result.breeder;

    if (result.isMultiple && result.quantity && result.quantity > 1) {
      secondary = `${result.breeder} • ${result.quantity} Packs Available`;
    }

    return {
      primary: result.strain,
      secondary: `${secondary} • @${result.username}`,
    };
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <TextField
            size="medium"
            label="Search Users, Seeds, or Clones"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            fullWidth
            sx={{ mr: 1 }}
          />
          <Button
            size="medium"
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
          >
            Search
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        {searchResults.length > 0 && (
          <Paper sx={{ mt: 1, p: 1 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                label={`Users (${
                  searchResults.filter((r) => r.type === "user").length
                })`}
              />
              <Tab
                label={`Seeds (${
                  searchResults.filter((r) => r.type === "seed").length
                })`}
              />
              <Tab
                label={`Clones (${
                  searchResults.filter((r) => r.type === "clone").length
                })`}
              />
            </Tabs>
          </Paper>
        )}

        <List sx={{ mt: 1 }}>
          {filteredResults.map((result) => (
            <ListItem
              key={`${result.type}-${result.id}`}
              component={Link}
              to={`/profile/${result.userId}?itemType=${result.type}&itemId=${result.id}`}
              sx={{
                bgcolor: "background.paper",
                mb: 0.5,
                borderRadius: 1,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar src={result.profilePicture}>
                  {result.type === "user"
                    ? result.username?.charAt(0)
                    : result.strain?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText {...getResultContent(result)} />
            </ListItem>
          ))}
        </List>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={2200}
          onClose={() => setShowSnackbar(false)}
          message={snackbarMessage}
        />
      </Box>
    </Container>
  );
}

export default SearchPage;
