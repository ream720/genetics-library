import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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

const featureGroups = [
  {
    icon: <Inventory2OutlinedIcon />,
    title: "Manage collections",
    description:
      "Build the core library first: seed packs, clones, breeder details, lineage, notes, and inventory.",
    features: [
      {
        icon: <Inventory2OutlinedIcon />,
        title: "Seeds and clones",
        description: "Keep collection records clean and searchable.",
      },
      {
        icon: <AutoAwesomeOutlinedIcon />,
        title: "Faster entry",
        description: "Use AI assistance or CSV import to move quicker.",
      },
      {
        icon: <SearchOutlinedIcon />,
        title: "Browse and search",
        description: "Explore public records by user, breeder, strain, or lineage.",
      },
    ],
  },
  {
    icon: <FolderOutlinedIcon />,
    title: "Run private projects",
    description:
      "Track Pheno Hunt and Wash/Process work privately, then compare completed results.",
    features: [
      {
        icon: <FolderOutlinedIcon />,
        title: "Private projects",
        description: "Keep working data, photos, and observations off public profiles.",
      },
      {
        icon: <ScienceOutlinedIcon />,
        title: "Pheno hunts",
        description: "Group plants, evaluate traits, and mark keepers or washers.",
      },
      {
        icon: <UploadFileOutlinedIcon />,
        title: "Wash runs",
        description: "Record source material, cycles, micron ranges, drying, and pressing.",
      },
      {
        icon: <AnalyticsOutlinedIcon />,
        title: "Analytics",
        description: "Review completed projects by yield, quality, and return.",
      },
    ],
  },
];

const projectSteps = [
  "Add seeds, clones, or an ad-hoc source.",
  "Start a Pheno Hunt or Wash/Process project.",
  "Complete the project to compare results over time.",
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
            <Box>
              <Typography component="h1" variant="h1">
                An advanced field notebook.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 680, fontSize: { md: "1.1rem" } }}
              >
                Organize cannabis genetics, track pheno hunts and wash runs,
                and review results from completed projects.
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
                      How it works
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Move from library records to completed project results.
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
              What it is
            </Typography>
            <Typography variant="h2">
              A genetics library plus project history.
            </Typography>
            <Typography color="text.secondary">
              Keep seed and clone records organized while private projects
              capture the work, photos, observations, and results behind them.
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, minmax(0, 1fr))",
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {featureGroups.map((group) => (
              <Card key={group.title} sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    height: "100%",
                    p: { xs: 2.25, md: 3 },
                    "&:last-child": { pb: { xs: 2.25, md: 3 } },
                  }}
                >
                  <Stack spacing={2.25} sx={{ height: "100%" }}>
                    <Stack spacing={1.25}>
                      <Box
                        sx={(theme) => ({
                          width: 52,
                          height: 52,
                          borderRadius: 3.5,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: "primary.main",
                        })}
                      >
                        {group.icon}
                      </Box>
                      <Box>
                        <Typography component="h3" variant="h5">
                          {group.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          {group.description}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1.25,
                      }}
                    >
                      {group.features.map((feature) => (
                        <Paper
                          key={feature.title}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: "surface.subtle",
                            height: "100%",
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            <Box
                              sx={(theme) => ({
                                width: 34,
                                height: 34,
                                flex: "0 0 auto",
                                borderRadius: 2.5,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                                "& svg": {
                                  fontSize: 20,
                                },
                              })}
                            >
                              {feature.icon}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                component="h4"
                                variant="subtitle2"
                                fontWeight={900}
                              >
                                {feature.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.25 }}
                              >
                                {feature.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Box>
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
            maxWidth: 920,
            mx: "auto",
          }}
        >
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
                      Public collection stats
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
            borderRadius: { xs: 3, sm: 4, md: 5 },
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
