import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import InsightsIcon from "@mui/icons-material/Insights";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatProjectDate } from "../lib/v2/date";
import { PROJECT_ROUTES } from "../lib/v2/projectPaths";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectBase,
  ProjectStatus,
  ProjectType,
} from "../types/v2";
import { getUserProjects } from "../services/projects";

type FilterValue<T extends string> = "all" | T;

const ProjectsPage: React.FC = () => {
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
        const userProjects = await getUserProjects(currentUser.uid);
        setProjects(userProjects);
      } catch (loadError) {
        console.error("Failed to load projects:", loadError);
        setError("Failed to load projects. Please try again.");
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
        project.name.toLowerCase().includes(normalizedSearch);
      const matchesType =
        typeFilter === "all" || project.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Projects
            </Typography>
            <Typography color="text.secondary">
              Track private Pheno Hunt and Wash/Process projects from setup
              through completed analytics.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<InsightsIcon />}
              onClick={() => navigate(PROJECT_ROUTES.analytics)}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate(PROJECT_ROUTES.new)}
            >
              Create Project
            </Button>
          </Stack>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Search projects"
                  placeholder="Project name"
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
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
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
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  {Object.entries(PROJECT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Stack>
              {error && <Alert severity="error">{error}</Alert>}
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredProjects.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Stack spacing={1} alignItems="center">
                    <Chip label="Private MVP Projects" color="primary" />
                    <Typography variant="h6">
                      {projects.length === 0
                        ? "No projects yet"
                        : "No projects match your filters"}
                    </Typography>
                    <Typography color="text.secondary" maxWidth={640}>
                      Create a Pheno Hunt or Wash/Process project to start
                      tracking private work from setup through completed
                      analytics.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {filteredProjects.map((project) => (
                    <Card key={project.id} variant="outlined">
                      <CardActionArea
                        onClick={() =>
                          project.id &&
                          navigate(PROJECT_ROUTES.detail(project.id))
                        }
                      >
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="h6">
                                {project.name}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={PROJECT_TYPE_LABELS[project.type]}
                                  size="small"
                                />
                                <Chip
                                  label={
                                    PROJECT_STATUS_LABELS[project.status]
                                  }
                                  color={
                                    project.status === "complete"
                                      ? "success"
                                      : "primary"
                                  }
                                  size="small"
                                  variant={
                                    project.status === "planning"
                                      ? "outlined"
                                      : "filled"
                                  }
                                />
                              </Stack>
                            </Stack>
                            <Typography color="text.secondary">
                              {project.objective || "No objective provided."}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Started {formatProjectDate(project.startDate)} ·
                              Updated{" "}
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default ProjectsPage;
