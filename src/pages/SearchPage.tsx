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
import { app } from "../../firebaseConfig";
import { Link } from "react-router-dom";
import { Seed, Clone } from "../types";

const db = getFirestore(app);

interface UserProfile {
  id: string;
  username: string;
}

interface SearchResult {
  type: "user" | "seed" | "clone";
  id: string;
  userId: string;
  username?: string;
  strain?: string;
  breeder?: string;
}

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearch = async () => {
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
          })
        ),
      ];

      setSearchResults(transformedResults);
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
      where("username", ">=", lowerQuery),
      where("username", "<=", lowerQuery + "\uf8ff")
    );
    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      username: doc.data().username,
    }));
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
          return {
            id: userId,
            username: userDocSnap.data()?.username,
          };
        }
        return null;
      })
    );
    return profiles.filter(
      (profile): profile is UserProfile => profile !== null
    );
  };

  const filteredResults = searchResults.filter((result) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return result.type === "user";
    if (activeTab === 2) return result.type === "seed";
    if (activeTab === 3) return result.type === "clone";
    return false;
  });

  const getResultContent = (result: SearchResult) => {
    if (result.type === "user") {
      return {
        primary: result.username,
        secondary: "User Profile",
      };
    }
    return {
      primary: result.strain,
      secondary: `${result.type === "seed" ? "Seed" : "Clone"} • ${
        result.breeder
      } • by ${result.username}`,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TextField
          label="Search Users, Seeds, or Clones"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          fullWidth
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
        >
          Search
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {searchResults.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label={`All (${searchResults.length})`} />
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

      <List>
        {filteredResults.map((result) => (
          <ListItem
            key={`${result.type}-${result.id}`}
            component={Link}
            to={`/profile/${result.userId}`}
            sx={{
              bgcolor: "background.paper",
              mb: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemAvatar>
              <Avatar>
                {result.type === "user"
                  ? result.username?.charAt(0)
                  : result.strain?.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText {...getResultContent(result)} />
          </ListItem>
        ))}
      </List>

      {!loading && searchResults.length === 0 && searchQuery && (
        <Typography
          sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
        >
          No results found for "{searchQuery}"
        </Typography>
      )}
    </Box>
  );
}

export default SearchPage;
