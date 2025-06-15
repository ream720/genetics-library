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
import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Timestamp } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import StarIcon from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GrassIcon from "@mui/icons-material/Grass";
import UploadFileIcon from "@mui/icons-material/UploadFile";

// interface Article {
//   title: string;
//   description: string;
//   imageUrl?: string;
//   date: string;
//   author: string;
// }

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
  // const [articles] = useState<Article[]>([
  //   {
  //     title: "Understanding Cannabis Genetics",
  //     description:
  //       "A comprehensive guide to cannabis genetics and breeding techniques.",
  //     date: "2024-03-20",
  //     author: "Dr. Jane Smith",
  //   },
  //   {
  //     title: "The Future of Cannabis Breeding",
  //     description:
  //       "Exploring new trends and technologies in cannabis breeding.",
  //     date: "2024-03-18",
  //     author: "John Doe",
  //   },
  //   {
  //     title: "Sustainable Breeding Practices",
  //     description:
  //       "How to implement eco-friendly practices in cannabis breeding.",
  //     date: "2024-03-15",
  //     author: "Sarah Johnson",
  //   },
  //   {
  //     title: "Phenotype vs Genotype",
  //     description:
  //       "Understanding the difference between phenotype and genotype in cannabis.",
  //     date: "2024-03-12",
  //     author: "Mike Wilson",
  //   },
  //   {
  //     title: "Breeding for Medical Properties",
  //     description:
  //       "How breeders are developing strains for specific medical applications.",
  //     date: "2024-03-10",
  //     author: "Dr. Emily Brown",
  //   },
  // ]);

  const features = [
    {
      icon: <Inventory2Icon fontSize="medium" color="primary" />,
      title: "Track Your Collection",
      description:
        "Catalog your personal seed and clone collection, keep notes, and never lose track of your genetics.",
    },
    {
      icon: <StarIcon fontSize="medium" color="primary" />,
      title: "Top Seed & Clone Database",
      description:
        "With access to the most comprehensive trading database ever, discover and connect with genetics collectors from around the world.",
    },
    {
      icon: <SearchIcon fontSize="medium" color="primary" />,
      title: "Advanced Search & Filters",
      description:
        "Find exactly what you need with powerful search and filtering tools. Search by username, strain name, breeder, lineage, and more.",
    },

    {
      icon: <GrassIcon fontSize="medium" color="primary" />,
      title: "Cultivar Info & Grower Notes",
      description:
        "Access and contribute real-world grow data, tips, and experiences for each cultivar—shared by the community.",
    },
    {
      icon: <SmartToyIcon fontSize="medium" color="primary" />,
      title: "AI-Powered Entry Creation",
      description:
        "Save time with AI-assisted form filling—just describe your seeds or clones and let our system auto-fill your seed or clone entry.",
    },

    {
      icon: <UploadFileIcon fontSize="medium" color="primary" />,
      title: "Bulk Import via CSV",
      description:
        "Quickly import your entire collection from an Excel or CSV file—perfect for breeders and collectors migrating from spreadsheets.",
    },
    {
      icon: <DarkModeIcon fontSize="medium" color="primary" />,
      title: "Modern, Mobile-Friendly, Intuitive UI",
      description:
        "Optimized for mobile, tablet, and desktop. Enjoy a clean, dark-mode friendly interface. No need to download an app, just use the website on any device!",
    },
    // {
    //   icon: <ArticleIcon fontSize="large" color="primary" />,
    //   title: "Expert Articles & Guides",
    //   description:
    //     "Learn from expert-written articles and guides. (Coming soon!)",
    // },
    // {
    //   icon: <VerifiedUserIcon fontSize="large" color="primary" />,
    //   title: "Verified Member Profiles",
    //   description:
    //     "Look for the verified badge for trusted, official members / traders.",
    // },
  ];

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
        .slice(0, 3);

      const sortedStrains = Array.from(strainCounts.entries())
        .map(([name, totalEntries]) => ({ name, totalEntries }))
        .sort((a, b) => b.totalEntries - a.totalEntries)
        .slice(0, 3);

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
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        {title}
      </Typography>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
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
                    <Typography variant="body1">{item.name}</Typography>
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

  const FeaturesSection = () => (
    <Box sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom align="center">
        What is Genetics Library?
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.title}>
            <Box sx={{ textAlign: "center", p: 2 }}>
              {feature.icon}
              <Typography variant="body1" sx={{ mt: 1 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // const ArticlesSection = () => (
  //   <Box sx={{ mt: 6 }}>
  //     <Typography variant="h4" gutterBottom align="center">
  //       Featured Articles
  //     </Typography>
  //     <Grid container spacing={3}>
  //       {articles.map((article) => (
  //         <Grid item xs={12} sm={6} md={4} key={article.title}>
  //           <Card
  //             sx={{ height: "100%", display: "flex", flexDirection: "column" }}
  //           >
  //             <CardContent sx={{ flexGrow: 1 }}>
  //               <Typography variant="h6" gutterBottom>
  //                 {article.title}
  //               </Typography>
  //               <Typography variant="body2" color="text.secondary" paragraph>
  //                 {article.description}
  //               </Typography>
  //               <Box
  //                 sx={{
  //                   mt: "auto",
  //                   display: "flex",
  //                   justifyContent: "space-between",
  //                   alignItems: "center",
  //                 }}
  //               >
  //                 <Typography variant="caption" color="text.secondary">
  //                   By {article.author}
  //                 </Typography>
  //                 <Typography variant="caption" color="text.secondary">
  //                   {new Date(article.date).toLocaleDateString()}
  //                 </Typography>
  //               </Box>
  //             </CardContent>
  //           </Card>
  //         </Grid>
  //       ))}
  //     </Grid>
  //   </Box>
  // );

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 2, mb: 4, textAlign: "center" }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Genetics Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track, trade, and explore genetics.
        </Typography>
      </Box>

      <Card>
        <FeaturesSection />
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
            sx={{ fontWeight: 600, borderRadius: 1, px: 16, mb: 2 }}
          >
            Get Started
          </Button>
        </Box>
      </Card>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <PopularItemsSection title="Top Breeders" items={topBreeders} />
          <Divider sx={{ my: 4 }} />
          <PopularItemsSection title="Top Strains" items={topStrains} />
          <Divider sx={{ my: 4 }} />
          {/* <ArticlesSection /> */}
        </>
      )}
    </Container>
  );
};

export default Landing;
