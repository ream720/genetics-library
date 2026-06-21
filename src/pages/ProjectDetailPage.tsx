import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import InsightsIcon from "@mui/icons-material/Insights";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhenoHuntSetup from "../components/pheno/PhenoHuntSetup";
import WashProcessSetup from "../components/wash/WashProcessSetup";
import ProjectPhotoUploader from "../components/v2/ProjectPhotoUploader";
import { useAuth } from "../context/AuthContext";
import { useUnsavedChanges } from "../context/UnsavedChangesContext";
import { useAutosave } from "../hooks/useAutosave";
import { formatProjectDate } from "../lib/v2/date";
import { PROJECT_ROUTES } from "../lib/v2/projectPaths";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectBase,
  ProjectAddendum,
  ProjectStatus,
} from "../types/v2";
import {
  createProjectAddendum,
  deleteProject,
  getProject,
  getProjectAddenda,
  updateProject,
} from "../services/projects";
import {
  createProjectPhotoContextId,
  reassignProjectPhotos,
} from "../services/projectPhotos";

interface ProjectDraft {
  name: string;
  objective: string;
  startDate: string;
  status: ProjectStatus;
}

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const { confirmNavigation, setHasUnsavedChanges } = useUnsavedChanges();
  const [project, setProject] = useState<ProjectBase | null>(null);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ProjectDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [addenda, setAddenda] = useState<ProjectAddendum[]>([]);
  const [addendumDraft, setAddendumDraft] = useState("");
  const [addendumPhotoIds, setAddendumPhotoIds] = useState<string[]>([]);
  const [addendumPhotoContextId, setAddendumPhotoContextId] = useState(
    createProjectPhotoContextId
  );
  const [savingAddendum, setSavingAddendum] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedProject = await getProject(projectId);
        if (!loadedProject) {
          setError("Project not found.");
          return;
        }

        if (loadedProject.ownerId !== currentUser.uid) {
          setError("You do not have access to this project.");
          return;
        }

        const loadedDraft: ProjectDraft = {
          name: loadedProject.name,
          objective: loadedProject.objective,
          startDate: loadedProject.startDate,
          status: loadedProject.status,
        };

        setProject(loadedProject);
        setDraft(loadedDraft);
        setSavedDraft(loadedDraft);
        setAddenda(
          await getProjectAddenda(
            loadedProject.id ?? projectId,
            loadedProject.ownerId
          )
        );
      } catch (loadError) {
        console.error("Failed to load project:", loadError);
        setError("Failed to load project. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [currentUser, projectId]);

  const projectIsComplete = project?.status === "complete";
  const dirty = useMemo(
    () =>
      Boolean(
        draft &&
          savedDraft &&
          JSON.stringify(draft) !== JSON.stringify(savedDraft)
      ),
    [draft, savedDraft]
  );
  const draftSaveKey = useMemo(() => JSON.stringify(draft), [draft]);

  const saveDraft = useCallback(async () => {
    if (!projectId || !draft || projectIsComplete) {
      return;
    }

    await updateProject(projectId, draft);
    setSavedDraft(draft);
    setProject((currentProject) =>
      currentProject
        ? {
            ...currentProject,
            ...draft,
            updatedAt: new Date().toISOString(),
            ...(draft.status === "complete"
              ? { completedAt: new Date().toISOString() }
              : {}),
          }
        : currentProject
    );
  }, [draft, projectId, projectIsComplete]);

  const {
    status: autosaveStatus,
    error: autosaveError,
    retryNow: retryAutosave,
  } = useAutosave({
    enabled: Boolean(projectId && draft && !projectIsComplete),
    dirty,
    save: saveDraft,
    saveKey: draftSaveKey,
  });

  const hasPendingAutosave =
    dirty &&
    autosaveStatus !== "saved" &&
    autosaveStatus !== "idle";

  useEffect(() => {
    setHasUnsavedChanges(hasPendingAutosave);
    return () => setHasUnsavedChanges(false);
  }, [hasPendingAutosave, setHasUnsavedChanges]);

  const navigateAway = (destination: string) => {
    if (confirmNavigation()) {
      navigate(destination);
    }
  };

  const handleDraftChange = <K extends keyof ProjectDraft>(
    field: K,
    value: ProjectDraft[K]
  ) => {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft
    );
  };

  const handleProjectStatusChange = (status: ProjectStatus) => {
    const timestamp = new Date().toISOString();

    setProject((currentProject) =>
      currentProject
        ? {
            ...currentProject,
            status,
            updatedAt: timestamp,
          }
        : currentProject
    );
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, status } : currentDraft
    );
    setSavedDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, status } : currentDraft
    );
  };

  const openDeleteDialog = () => {
    setDeleteConfirmation("");
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
  };

  const handleDeleteProject = async () => {
    if (!projectId || !project) {
      return;
    }

    if (deleteConfirmation !== project.name) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteProject(projectId);
      navigate(PROJECT_ROUTES.list);
    } catch (deleteError) {
      console.error("Failed to delete project:", deleteError);
      setError("Failed to delete project. Please try again.");
      setDeleting(false);
    }
  };

  const handleAddendumSubmit = async () => {
    if (!projectId || !project || !projectIsComplete || !addendumDraft.trim()) {
      return;
    }

    setSavingAddendum(true);
    setError(null);

    try {
      const addendum = await createProjectAddendum({
        ownerId: project.ownerId,
        projectId,
        text: addendumDraft,
        photoIds: addendumPhotoIds,
      });
      if (addendum.id) {
        await reassignProjectPhotos(addendumPhotoIds, addendum.id);
      }
      setAddenda((currentAddenda) => [addendum, ...currentAddenda]);
      setAddendumDraft("");
      setAddendumPhotoIds([]);
      setAddendumPhotoContextId(createProjectPhotoContextId());
    } catch (saveError) {
      console.error("Failed to save addendum:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save addendum. Please try again."
      );
    } finally {
      setSavingAddendum(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigateAway(PROJECT_ROUTES.list)}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Projects
        </Button>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              {loading ? (
                <Typography>Loading project...</Typography>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : project && draft ? (
                <>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {PROJECT_TYPE_LABELS[project.type]} -{" "}
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Typography>
                  </Box>

                  <Alert
                    severity={
                      projectIsComplete
                        ? "info"
                        : autosaveStatus === "error"
                          ? "error"
                          : autosaveStatus === "dirty" ||
                              autosaveStatus === "saving" ||
                              autosaveStatus === "retrying"
                            ? "warning"
                            : "success"
                    }
                    variant="outlined"
                    action={
                      !projectIsComplete && autosaveStatus === "error" ? (
                        <Button color="inherit" size="small" onClick={retryAutosave}>
                          Retry
                        </Button>
                      ) : undefined
                    }
                  >
                    {projectIsComplete
                      ? "This project is complete. Core project data is read-only, but you can append addenda below."
                      : autosaveStatus === "error"
                        ? autosaveError instanceof Error
                          ? `Autosave failed: ${autosaveError.message}`
                          : "Autosave failed. Your changes are still pending."
                        : `Autosave status: ${autosaveStatus}`}
                  </Alert>

                  <Stack spacing={2}>
                    <TextField
                      label="Project name"
                      value={draft.name}
                      onChange={(event) =>
                        handleDraftChange("name", event.target.value)
                      }
                      disabled={projectIsComplete}
                      fullWidth
                    />
                    <TextField
                      label="Description or objective"
                      value={draft.objective}
                      onChange={(event) =>
                        handleDraftChange("objective", event.target.value)
                      }
                      disabled={projectIsComplete}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                    <TextField
                      label="Start date"
                      type="date"
                      value={draft.startDate}
                      onChange={(event) =>
                        handleDraftChange("startDate", event.target.value)
                      }
                      disabled={projectIsComplete}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Status"
                      value={draft.status}
                      onChange={(event) =>
                        handleDraftChange(
                          "status",
                          event.target.value as ProjectStatus
                        )
                      }
                      disabled={projectIsComplete}
                      select
                      fullWidth
                    >
                      {Object.entries(PROJECT_STATUS_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  </Stack>

                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="h6">Sources</Typography>
                        {project.sourceSnapshots.map((source, index) => (
                          <Box
                            key={`${source.sourceType}-${source.sourceId ?? index}`}
                          >
                            <Typography>
                              {source.strain} by {source.breeder}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="body2"
                            >
                              {source.sourceType.replace("_", " ")}
                              {source.lineage ? ` - ${source.lineage}` : ""}
                              {source.generation
                                ? ` - ${source.generation}`
                                : ""}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  {project.type === "pheno_hunt" && (
                    <PhenoHuntSetup
                      project={{ ...project, id: projectId }}
                      readOnly={projectIsComplete}
                      onProjectStatusChange={handleProjectStatusChange}
                    />
                  )}

                  {project.type === "wash_process" && (
                    <WashProcessSetup
                      project={{ ...project, id: projectId }}
                      readOnly={projectIsComplete}
                    />
                  )}

                  {projectIsComplete && (
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="h6">Addenda</Typography>
                            <Typography color="text.secondary" variant="body2">
                              Append follow-up notes without changing the
                              original project results.
                            </Typography>
                          </Box>

                          <Stack spacing={2}>
                            <TextField
                              label="New addendum"
                              value={addendumDraft}
                              onChange={(event) =>
                                setAddendumDraft(event.target.value)
                              }
                              disabled={savingAddendum}
                              fullWidth
                              multiline
                              minRows={3}
                              helperText="Addenda are timestamped and cannot be edited after saving."
                            />
                            {projectId && (
                              <ProjectPhotoUploader
                                ownerId={project.ownerId}
                                projectId={projectId}
                                contextType="addendum"
                                contextId={addendumPhotoContextId}
                                photoIds={addendumPhotoIds}
                                onChange={setAddendumPhotoIds}
                              />
                            )}
                            <Button
                              variant="contained"
                              onClick={handleAddendumSubmit}
                              disabled={
                                savingAddendum || !addendumDraft.trim()
                              }
                              sx={{ alignSelf: "flex-start" }}
                            >
                              {savingAddendum
                                ? "Saving..."
                                : "Save Addendum"}
                            </Button>
                          </Stack>

                          {addenda.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              No addenda yet.
                            </Typography>
                          ) : (
                            <Stack spacing={1.5}>
                              {addenda.map((addendum) => (
                                <Card key={addendum.id} variant="outlined">
                                  <CardContent
                                    sx={{
                                      py: 1.5,
                                      "&:last-child": { pb: 1.5 },
                                    }}
                                  >
                                    <Typography
                                      color="text.secondary"
                                      variant="caption"
                                    >
                                      {formatProjectDate(
                                        addendum.createdAt.slice(0, 10)
                                      )}
                                    </Typography>
                                    <Typography whiteSpace="pre-wrap">
                                      {addendum.text}
                                    </Typography>
                                    {projectId &&
                                      addendum.id &&
                                      addendum.photoIds.length > 0 && (
                                        <Box sx={{ mt: 1.5 }}>
                                          <ProjectPhotoUploader
                                            ownerId={project.ownerId}
                                            projectId={projectId}
                                            contextType="addendum"
                                            contextId={addendum.id}
                                            photoIds={addendum.photoIds}
                                            onChange={() => undefined}
                                            readOnly
                                          />
                                        </Box>
                                      )}
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                  {!projectIsComplete && (
                    <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography fontWeight={700}>
                              Available after completion
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                              Finish the project to lock the original results
                              and unlock follow-up tools.
                            </Typography>
                          </Box>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="flex-start"
                              sx={{ flex: 1 }}
                            >
                              <NoteAddIcon color="primary" fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight={700}>
                                  Addenda
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                >
                                  Add timestamped notes without changing the
                                  original result.
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="flex-start"
                              sx={{ flex: 1 }}
                            >
                              <InsightsIcon color="primary" fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight={700}>
                                  Analytics
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                >
                                  Review completed project metrics and compare
                                  results.
                                </Typography>
                              </Box>
                            </Stack>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(project.createdAt).toLocaleDateString()} -
                    Started {formatProjectDate(project.startDate)}
                  </Typography>
                </>
              ) : null}

              {projectIsComplete && (
                <Button
                  variant="outlined"
                  onClick={() =>
                    projectId &&
                    navigate(PROJECT_ROUTES.projectAnalytics(projectId))
                  }
                  disabled={!projectId}
                  sx={{ alignSelf: "flex-start" }}
                >
                  View Project Analytics
                </Button>
              )}

              {project && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={openDeleteDialog}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Delete Project
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning" variant="outlined">
              This permanently deletes the project, addenda, project photos,
              Pheno Hunt records, Wash/Process records, and analytics inputs.
              This cannot be undone.
            </Alert>
            <DialogContentText>
              Type <strong>{project?.name}</strong> to confirm.
            </DialogContentText>
          </Stack>
          <TextField
            label="Project name"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteProject}
            disabled={deleting || deleteConfirmation !== project?.name}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetailPage;
