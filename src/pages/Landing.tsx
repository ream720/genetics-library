import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Timestamp } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

interface BreederInfo {
  name: string; // Breeder name (e.g., "Raw Genetics")
  logoURL: string; // URL to their logo in Firebase Storage
  verified: boolean; // Whether this is an official/verified breeder
  createdAt: Timestamp; // When this breeder was added to our system
}

interface PopularItem {
  name: string;
  totalEntries: number;
  breederInfo?: BreederInfo; // Add this to include logo URLs and verification status
}

const Landing: React.FC = () => {
  const [topBreeders, setTopBreeders] = useState<PopularItem[]>([]);
  const [topStrains, setTopStrains] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPopularItems = async () => {
    try {
      setIsLoading(true);

      // Get all seeds and clones
      const seedsSnapshot = await getDocs(collection(db, "seeds"));
      const clonesSnapshot = await getDocs(collection(db, "clones"));

      // Get breeder info and convert storage paths to download URLs
      const breederInfoSnapshot = await getDocs(collection(db, "breederInfo"));
      console.log(
        "Breeder info docs:",
        breederInfoSnapshot.docs.map((doc) => doc.data())
      ); // Debug log

      const storage = getStorage();
      const breederInfoMap = new Map();

      for (const doc of breederInfoSnapshot.docs) {
        const data = doc.data() as BreederInfo;
        console.log(
          "Processing breeder:",
          data.name,
          "with URL:",
          data.logoURL
        ); // Debug log

        if (data.logoURL && data.logoURL.startsWith("gs://")) {
          const storagePath = data.logoURL.replace(
            "gs://genetics-library.firebasestorage.app/",
            ""
          );
          console.log("Converting storage path:", storagePath); // Debug log

          try {
            const storageRef = ref(storage, storagePath);
            const downloadURL = await getDownloadURL(storageRef);
            console.log("Got download URL:", downloadURL); // Debug log
            data.logoURL = downloadURL;
          } catch (error) {
            console.error(
              `Error getting download URL for ${data.name}:`,
              error
            );
          }
        }
        breederInfoMap.set(data.name.toLowerCase(), data);
      }

      // Create maps to count frequencies
      const breederCounts = new Map<string, number>();
      const strainCounts = new Map<string, number>();

      // Count seeds
      seedsSnapshot.docs.forEach((doc) => {
        const seed = doc.data();
        const { breeder, strain } = seed;
        if (breeder) {
          breederCounts.set(breeder, (breederCounts.get(breeder) || 0) + 1);
        }
        if (strain) {
          strainCounts.set(strain, (strainCounts.get(strain) || 0) + 1);
        }
      });

      // Count clones
      clonesSnapshot.docs.forEach((doc) => {
        const clone = doc.data();
        const { breeder, strain } = clone;
        if (breeder) {
          breederCounts.set(breeder, (breederCounts.get(breeder) || 0) + 1);
        }
        if (strain) {
          strainCounts.set(strain, (strainCounts.get(strain) || 0) + 1);
        }
      });

      // Convert to arrays and sort by count, now including breeder info
      const sortedBreeders = Array.from(breederCounts.entries())
        .map(([name, totalEntries]) => ({
          name,
          totalEntries,
          breederInfo: breederInfoMap.get(name.toLowerCase()),
        }))
        .sort((a, b) => b.totalEntries - a.totalEntries)
        .slice(0, 5);

      const sortedStrains = Array.from(strainCounts.entries())
        .map(([name, totalEntries]) => ({ name, totalEntries }))
        .sort((a, b) => b.totalEntries - a.totalEntries)
        .slice(0, 5);

      setTopBreeders(sortedBreeders);
      setTopStrains(sortedStrains);
    } catch (error) {
      console.error("Error fetching popular items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularItems();
  }, []);

  const PopularItemsSection = ({
    title,
    items,
  }: {
    title: string;
    items: PopularItem[];
  }) => (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom align="center">
        {title}
      </Typography>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    src={
                      title === "Top Breeders"
                        ? item.breederInfo?.logoURL
                        : undefined
                    }
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 2,
                      "& img": {
                        objectFit: "contain",
                        p: 0.5,
                      },
                    }}
                  >
                    {item.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.totalEntries} entries
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4, textAlign: "center" }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Genetics Library
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Connect with top breeders and explore genetic lineages
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <PopularItemsSection title="Top Breeders" items={topBreeders} />
          <Divider sx={{ my: 4 }} />
          <PopularItemsSection title="Top Strains" items={topStrains} />
        </>
      )}
    </Container>
  );
};

export default Landing;
