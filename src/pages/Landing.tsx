import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Timestamp, collection, getDocs } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { db } from "../../firebaseConfig";

interface BreederInfo {
  name: string;
  logoURL: string;
  verified: boolean;
  createdAt: Timestamp;
}

interface PopularItem {
  name: string;
  totalEntries: number;
  breederInfo?: BreederInfo;
}

const featureCards = [
  {
    icon: <Inventory2OutlinedIcon />,
    title: "Build your genetics library",
    description:
      "Catalog seeds and clones with breeder, lineage, generation, notes, and collection details.",
  },
  {
    icon: <FolderOutlinedIcon />,
    title: "Track private projects",
    description:
      "Run Pheno Hunt and Wash/Process projects without exposing your working data publicly.",
  },
  {
    icon: <AnalyticsOutlinedIcon />,
    title: "Compare results over time",
    description:
      "Use completed projects to review germination, keeper rates, wash returns, quality, and yield.",
  },
  {
    icon: <SearchOutlinedIcon />,
    title: "Search public collections",
    description:
      "Find genetics by username, breeder, strain, and lineage while keeping project records private.",
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: "Enter records faster",
    description:
      "Use AI-assisted entry creation to turn rough notes into cleaner seed and clone records.",
  },
  {
    icon: <UploadFileOutlinedIcon />,
    title: "Import from spreadsheets",
    description:
      "Bring existing seed and clone lists in through CSV instead of rebuilding a collection by hand.",
  },
];

const projectSteps = [
  "Start with genetics from your library or an ad-hoc source.",
  "Record plants, photos, evaluations, wash runs, and processing notes.",
  "Complete the project when results are ready for analytics.",
];

const Landing = () => {
  const [topBreeders, setTopBreeders] = useState<PopularItem[]>([]);
  const [topStrains, setTopStrains] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPopularItems = async () => {
      try {
        setIsLoading(true);

        const [seedsSnapshot, clonesSnapshot, breederInfoSnapshot] =
          await Promise.all([
            getDocs(collection(db, "seeds")),
            getDocs(collection(db, "clones")),
            getDocs(collection(db, "breederInfo")),
          ]);

        const storage = getStorage();
        const breederInfoMap = new Map<string, BreederInfo>();

        await Promise.all(
          breederInfoSnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data() as BreederInfo;

            if (data.logoURL?.startsWith("gs://")) {
              const storagePath = data.logoURL.replace(
                "gs://genetics-library.firebasestorage.app/",
                ""
              );

              try {
                data.logoURL = await getDownloadURL(ref(storage, storagePath));
              } catch (error) {
                console.error(
                  `Error getting breeder logo for ${data.name}:`,
                  error
                );
              }
            }

            breederInfoMap.set(data.name.toLowerCase(), data);
          })
        );

        const breederCounts = new Map<string, number>();
        const strainCounts = new Map<string, number>();

        [...seedsSnapshot.docs, ...clonesSnapshot.docs].forEach((docSnapshot) => {
          const geneticsRecord = docSnapshot.data();
          const breeder = geneticsRecord.breeder as string | undefined;
          const strain = geneticsRecord.strain as string | undefined;

          if (breeder) {
            breederCounts.set(
              breeder,
              (breederCounts.get(breeder) || 0) + 1
            );
          }

          if (strain) {
            strainCounts.set(strain, (strainCounts.get(strain) || 0) + 1);
          }
        });

        if (!isMounted) {
          return;
        }

        setTopBreeders(
          Array.from(breederCounts.entries())
            .map(([name, totalEntries]) => ({
              name,
              totalEntries,
              breederInfo: breederInfoMap.get(name.toLowerCase()),
            }))
            .sort((a, b) => b.totalEntries - a.totalEntries)
            .slice(0, 3)
        );
        setTopStrains(
          Array.from(strainCounts.entries())
            .map(([name, totalEntries]) => ({ name, totalEntries }))
            .sort((a, b) => b.totalEntries - a.totalEntries)
            .slice(0, 3)
        );
      } catch (error) {
        console.error("Error fetching popular genetics:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPopularItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const PopularList = ({
    title,
    items,
  }: {
    title: string;
    items: PopularItem[];
  }) => (
    <Stack spacing={1.5}>
      <Typography component="h4" variant="h6">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No public records yet.
        </Typography>
      ) : (
        items.map((item) => (
          <Paper
            key={item.name}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: "surface.subtle",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                src={title === "Top breeders" ? item.breederInfo?.logoURL : ""}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& img": {
                    objectFit: "contain",
                    p: 0.5,
                  },
                }}
              >
                {item.name.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.totalEntries} public{" "}
                  {item.totalEntries === 1 ? "entry" : "entries"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );

  return (
    <Box
      sx={(theme) => ({
        overflow: "hidden",
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at top left, ${alpha(
                theme.palette.primary.main,
                0.16
              )}, transparent 34rem)`
            : `radial-gradient(circle at top left, ${alpha(
                theme.palette.primary.main,
                0.18
              )}, transparent 32rem)`,
      })}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <Box
          component="section"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "center",
          }}
        >
          <Stack spacing={3} sx={{ maxWidth: 760 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<ShieldOutlinedIcon />}
                label="Private projects by default"
                variant="outlined"
              />
              <Chip label="Seeds, clones, pheno hunts, wash runs" />
            </Stack>
            <Box>
              <Typography component="h1" variant="h1">
                A private field notebook for cannabis genetics.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 680, fontSize: { md: "1.1rem" } }}
              >
                Genetics Library helps growers, pheno hunters, breeders, and
                hashmakers organize genetics, track project work, and review
                results over time.
              </Typography>
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ maxWidth: { xs: "none", sm: 430 } }}
            >
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                fullWidth
              >
                Start your library
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="large"
                fullWidth
              >
                Log in
              </Button>
            </Stack>
          </Stack>

          <Card
            sx={(theme) => ({
              borderRadius: 5,
              bgcolor: alpha(theme.palette.surface.raised, 0.82),
              backdropFilter: "blur(14px)",
            })}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <ScienceOutlinedIcon color="primary" />
                  <Box>
                    <Typography component="h2" variant="h5">
                      Project-ready records
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Built around the V2 workflow: library, projects,
                      completion, analytics.
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                {projectSteps.map((step, index) => (
                  <Stack
                    key={step}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={(theme) => ({
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        bgcolor: alpha(theme.palette.primary.main, 0.14),
                        color: "primary.main",
                        fontWeight: 900,
                      })}
                    >
                      {index + 1}
                    </Box>
                    <Typography>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box component="section" sx={{ mt: { xs: 7, md: 10 } }}>
          <Stack spacing={1.25} sx={{ mb: 3, maxWidth: 760 }}>
            <Typography
              variant="caption"
              color="secondary.main"
              fontWeight={800}
              letterSpacing="0.09em"
              textTransform="uppercase"
            >
              What is Genetics Library?
            </Typography>
            <Typography variant="h2">
              A collection manager plus project history.
            </Typography>
            <Typography color="text.secondary">
              Keep the public collection layer simple while your project work
              remains private until future sharing tools are intentionally added.
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {featureCards.map((feature) => (
              <Card key={feature.title} sx={{ height: "100%" }}>
                <CardContent sx={{ height: "100%" }}>
                  <Stack spacing={1.5} sx={{ height: "100%" }}>
                    <Box
                      sx={(theme) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                      })}
                    >
                      {feature.icon}
                    </Box>
                    <Typography component="h3" variant="h6">
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        <Box
          component="section"
          sx={{
            mt: { xs: 7, md: 10 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "stretch",
          }}
        >
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2}>
                <Typography variant="h3">Public discovery stays simple.</Typography>
                <Typography color="text.secondary">
                  Public profiles can show seeds and clones. Projects, photos,
                  observations, and analytics stay private for MVP.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label="Seeds" variant="outlined" />
                  <Chip label="Clones" variant="outlined" />
                  <Chip label="Private Projects" color="primary" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box>
                    <Typography component="h3" variant="h5">
                      Public collection signals
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      A small preview of public seed and clone records.
                    </Typography>
                  </Box>
                  {isLoading && <CircularProgress size={28} />}
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <PopularList title="Top breeders" items={topBreeders} />
                  <PopularList title="Top strains" items={topStrains} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Paper
          component="section"
          variant="outlined"
          sx={(theme) => ({
            mt: { xs: 7, md: 10 },
            p: { xs: 2.5, md: 4 },
            borderRadius: 5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          })}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography component="h2" variant="h4">
                Ready to organize your library?
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Create an account, add your first seeds or clones, then start a
                private project when you are ready.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              sx={{ flexShrink: 0 }}
            >
              Get started
            </Button>
          </Stack>
        </Paper>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 4 }}
        >
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Log in to continue.
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Landing;
