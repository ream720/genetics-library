import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatProjectDate } from "../lib/v2/date";
import { PROJECT_ROUTES } from "../lib/v2/projectPaths";
import {
  PROJECT_TYPE_LABELS,
  ProjectBase,
  ProjectStatus,
  ProjectType,
} from "../types/v2";
import { getUserProjects } from "../services/projects";
import {
  EmptyState,
  FilterBar,
  PageContainer,
  PageHeader,
  SectionCard,
  StatusChip,
} from "../components/ui";

type FilterValue<T extends string> = "all" | T;

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<ProjectBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<FilterValue<ProjectType>>("all");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<ProjectStatus>>("all");

  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        setProjects(await getUserProjects(currentUser.uid));
      } catch (loadError) {
        console.error("Failed to load projects:", loadError);
        setError("Projects could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentUser]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.objective.toLowerCase().includes(normalizedSearch);
      const matchesType =
        typeFilter === "all" || project.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  const completedCount = projects.filter(
    (project) => project.status === "complete"
  ).length;

  return (
    <PageContainer maxWidth="lg">
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <PageHeader
          eyebrow="Private workspace"
          title="Projects"
          description={
            loading
              ? "Loading your private Pheno Hunt and Wash/Process projects."
              : `${projects.length} total · ${completedCount} completed. Track Pheno Hunts and Wash/Process work from setup through results.`
          }
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<InsightsOutlinedIcon />}
                onClick={() => navigate(PROJECT_ROUTES.analytics)}
              >
                Analytics
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => navigate(PROJECT_ROUTES.new)}
              >
                Create project
              </Button>
            </Stack>
          }
        />

        <SectionCard>
          <Stack spacing={2.5}>
            <FilterBar>
              <TextField
                label="Search projects"
                placeholder="Name or objective"
                fullWidth
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <TextField
                label="Type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as FilterValue<ProjectType>)
                }
                select
                sx={{ minWidth: { md: 180 } }}
              >
                <MenuItem value="all">All project types</MenuItem>
                <MenuItem value="pheno_hunt">Pheno Hunt</MenuItem>
                <MenuItem value="wash_process">Wash/Process</MenuItem>
              </TextField>
              <TextField
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as FilterValue<ProjectStatus>
                  )
                }
                select
                sx={{ minWidth: { md: 170 } }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="complete">Complete</MenuItem>
              </TextField>
            </FilterBar>

            {error && <Alert severity="error">{error}</Alert>}

            {loading ? (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 7 }}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">
                  Loading your projects...
                </Typography>
              </Stack>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpenOutlinedIcon sx={{ fontSize: 38 }} />}
                title={
                  projects.length === 0
                    ? "Start your first project"
                    : "No projects match these filters"
                }
                description={
                  projects.length === 0
                    ? "Create a Pheno Hunt or Wash/Process project to begin recording private project data."
                    : "Adjust the search, type, or status filters to see more projects."
                }
                actionLabel={projects.length === 0 ? "Create project" : undefined}
                onAction={
                  projects.length === 0
                    ? () => navigate(PROJECT_ROUTES.new)
                    : undefined
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {filteredProjects.map((project) => (
                  <Card key={project.id} sx={{ height: "100%" }}>
                    <CardActionArea
                      onClick={() =>
                        project.id &&
                        navigate(PROJECT_ROUTES.detail(project.id))
                      }
                      sx={{ height: "100%" }}
                    >
                      <CardContent
                        sx={{
                          height: "100%",
                          p: 2.5,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Stack spacing={1.75} sx={{ height: "100%" }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1.5}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h6" noWrap>
                                {project.name}
                              </Typography>
                              <Chip
                                label={PROJECT_TYPE_LABELS[project.type]}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                              />
                            </Box>
                            <StatusChip status={project.status} />
                          </Stack>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: "2.8em",
                            }}
                          >
                            {project.objective || "No objective provided."}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            sx={{ mt: "auto" }}
                          >
                            <CalendarTodayOutlinedIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ flex: 1 }}
                            >
                              Started {formatProjectDate(project.startDate)}
                            </Typography>
                            <ArrowForwardOutlinedIcon
                              sx={{ fontSize: 20, color: "primary.main" }}
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Stack>
        </SectionCard>
      </Stack>
    </PageContainer>
  );
};

export default ProjectsPage;
