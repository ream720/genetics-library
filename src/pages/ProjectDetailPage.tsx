import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  DialogContentText,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InsightsIcon from "@mui/icons-material/Insights";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha } from "@mui/material/styles";
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
  ProjectAddendum,
  ProjectBase,
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
import {
  PageContainer,
  PageHeader,
  ResponsiveDialog,
  SectionCard,
  StatusChip,
} from "../components/ui";

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
  const [editBasicsOpen, setEditBasicsOpen] = useState(false);
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

  useEffect(() => {
    if (projectIsComplete) {
      setEditBasicsOpen(false);
    }
  }, [projectIsComplete]);

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

  const renderAutosaveStatus = () => {
    if (projectIsComplete) {
      return (
        <Alert severity="info" variant="outlined">
          Complete projects are read-only. Addenda stay open for follow-up notes.
        </Alert>
      );
    }

    return null;
  };

  const renderAutosavePill = () => {
    if (projectIsComplete) {
      return null;
    }

    const isError = autosaveStatus === "error";
    const isWarning =
      autosaveStatus === "dirty" || autosaveStatus === "retrying";
    const isSyncing = autosaveStatus === "saving";
    const label = isError
      ? "Sync error"
      : autosaveStatus === "dirty"
        ? "Unsaved"
        : autosaveStatus === "retrying"
          ? "Retrying"
          : isSyncing
            ? "Syncing"
            : "Synced";
    const AutosaveIcon = isError
      ? ErrorOutlineRoundedIcon
      : isWarning
        ? WarningAmberRoundedIcon
        : isSyncing
          ? SyncRoundedIcon
          : CheckCircleRoundedIcon;
    const pillTitle =
      isError && autosaveError instanceof Error
        ? `Sync error: ${autosaveError.message}. Click to retry.`
        : isError
          ? "Sync error. Click to retry."
          : label;

    return (
      <Box
        component={isError ? "button" : "div"}
        type={isError ? "button" : undefined}
        onClick={isError ? retryAutosave : undefined}
        aria-label={pillTitle}
        title={pillTitle}
        sx={(theme) => {
          const syncColor = isError
            ? theme.palette.error.main
            : isWarning
              ? theme.palette.warning.main
              : isSyncing
                ? theme.palette.info.main
                : theme.palette.success.main;
          const glow = label === "Synced" ? 0.3 : 0.16;

          return {
            appearance: "none",
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            minHeight: 32,
            border: `1px solid ${alpha(syncColor, 0.7)}`,
            borderRadius: 999,
            color: syncColor,
            bgcolor: alpha(syncColor, theme.palette.mode === "dark" ? 0.12 : 0.1),
            boxShadow: `0 0 0 1px ${alpha(syncColor, 0.14)}, 0 0 18px ${alpha(syncColor, glow)}`,
            cursor: isError ? "pointer" : "default",
            font: "inherit",
            px: 1.25,
            py: 0.5,
            transition: theme.transitions.create(
              ["background-color", "border-color", "box-shadow"],
              {
                duration: theme.transitions.duration.shorter,
              }
            ),
            ...(isError
              ? {
                  "&:hover": {
                    bgcolor: alpha(syncColor, theme.palette.mode === "dark" ? 0.18 : 0.14),
                  },
                }
              : {}),
          };
        }}
      >
        <AutosaveIcon
          sx={(theme) => ({
            fontSize: 16,
            filter: `drop-shadow(0 0 5px ${alpha(
              label === "Synced"
                ? theme.palette.success.main
                : isError
                  ? theme.palette.error.main
                  : isWarning
                    ? theme.palette.warning.main
                    : theme.palette.info.main,
              0.55
            )})`,
          })}
        />
        <Typography variant="caption" fontWeight={700}>
          {label}
        </Typography>
        {isError && (
          <Typography variant="caption" fontWeight={800}>
            Retry
          </Typography>
        )}
      </Box>
    );
  };

  const renderProjectBasicsForm = () => {
    if (!draft) {
      return null;
    }

    return (
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          label="Project name"
          value={draft.name}
          onChange={(event) => handleDraftChange("name", event.target.value)}
          fullWidth
        />
        <TextField
          label="Description or objective"
          value={draft.objective}
          onChange={(event) =>
            handleDraftChange("objective", event.target.value)
          }
          fullWidth
          multiline
          minRows={3}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Start date"
            type="date"
            value={draft.startDate}
            onChange={(event) =>
              handleDraftChange("startDate", event.target.value)
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Status"
            value={draft.status}
            onChange={(event) =>
              handleDraftChange("status", event.target.value as ProjectStatus)
            }
            select
            fullWidth
          >
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    );
  };

  const renderSourceSummary = () => {
    if (!project || project.sourceSnapshots.length === 0) {
      return null;
    }

    const sourceText = project.sourceSnapshots
      .map((source) => {
        const details = [
          source.sourceType.replace("_", " "),
          source.lineage,
          source.generation,
        ].filter(Boolean);

        return `${source.strain} by ${source.breeder}${
          details.length > 0 ? ` (${details.join(" - ")})` : ""
        }`;
      })
      .join("; ");

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          columnGap: 1,
          rowGap: 0.25,
          flexWrap: "wrap",
          maxWidth: 960,
        }}
      >
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          fontWeight={900}
          sx={{ letterSpacing: 0.08, textTransform: "uppercase" }}
        >
          Sources
        </Typography>
        <Typography component="span" variant="body2" color="text.secondary">
          {sourceText}
        </Typography>
      </Box>
    );
  };

  const renderAddenda = () => {
    if (!project || !projectId || !projectIsComplete) {
      return null;
    }

    return (
      <SectionCard
        title="Addenda"
        description="Add follow-up notes without changing the original project results."
        contentPadding={2.5}
      >
        <Stack spacing={2.5}>
          <Stack spacing={2}>
            <TextField
              label="New addendum"
              value={addendumDraft}
              onChange={(event) => setAddendumDraft(event.target.value)}
              disabled={savingAddendum}
              fullWidth
              multiline
              minRows={3}
              helperText="Addenda are timestamped and cannot be edited after saving."
            />
            <ProjectPhotoUploader
              ownerId={project.ownerId}
              projectId={projectId}
              contextType="addendum"
              contextId={addendumPhotoContextId}
              photoIds={addendumPhotoIds}
              onChange={setAddendumPhotoIds}
            />
            <Button
              variant="contained"
              onClick={handleAddendumSubmit}
              disabled={savingAddendum || !addendumDraft.trim()}
              sx={{ alignSelf: "flex-start" }}
            >
              {savingAddendum ? "Saving..." : "Save Addendum"}
            </Button>
          </Stack>

          <Divider />

          {addenda.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No addenda yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {addenda.map((addendum) => (
                <Card key={addendum.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography color="text.secondary" variant="caption">
                      {formatProjectDate(addendum.createdAt.slice(0, 10))}
                    </Typography>
                    <Typography whiteSpace="pre-wrap">{addendum.text}</Typography>
                    {addendum.id && addendum.photoIds.length > 0 && (
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
      </SectionCard>
    );
  };

  const renderCompletionToolsNotice = () => {
    if (projectIsComplete) {
      return null;
    }

    return (
      <SectionCard contentPadding={2.5}>
        <Stack spacing={2}>
          <Box>
            <Typography fontWeight={800}>Available after completion</Typography>
            <Typography color="text.secondary" variant="body2">
              Mark the project complete to lock original results and unlock
              follow-up tools.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start" flex={1}>
              <NoteAddIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" fontWeight={800}>
                  Addenda
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Timestamped notes after the original result is locked.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.25} alignItems="flex-start" flex={1}>
              <InsightsIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" fontWeight={800}>
                  Analytics
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Completed project metrics and comparisons.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </SectionCard>
    );
  };

  const renderPageBody = () => {
    if (loading) {
      return (
        <SectionCard contentPadding={2.5}>
          <Typography>Loading project...</Typography>
        </SectionCard>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!project || !draft) {
      return null;
    }

    return (
      <>
        {renderAutosaveStatus()}

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

        {renderAddenda()}
        {renderCompletionToolsNotice()}

        {projectIsComplete && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Button
              variant="outlined"
              onClick={() =>
                projectId && navigate(PROJECT_ROUTES.projectAnalytics(projectId))
              }
              disabled={!projectId}
            >
              View Project Analytics
            </Button>
          </Stack>
        )}

        <SectionCard
          title="Danger Zone"
          description="Permanently remove this project and its private project data."
          contentPadding={2.5}
          action={
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteDialog}
            >
              Delete Project
            </Button>
          }
        />
      </>
    );
  };

  return (
    <PageContainer maxWidth="lg">
      <Stack spacing={2.5}>
        <PageHeader
          eyebrow={project ? PROJECT_TYPE_LABELS[project.type] : "Private project"}
          eyebrowAccessory={
            project ? (
              <StatusChip status={draft?.status ?? project.status} />
            ) : undefined
          }
          title={draft?.name ?? project?.name ?? "Project"}
          description={
            draft || project
              ? (draft?.objective ?? project?.objective)
              : "Loading project details and workflow records."
          }
          backLabel="Back to projects"
          onBack={() => navigateAway(PROJECT_ROUTES.list)}
          actions={
            project && !projectIsComplete ? (
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setEditBasicsOpen(true)}
              >
                Edit
              </Button>
            ) : undefined
          }
        >
          <Stack spacing={0.75}>
            {project ? (
              <Typography variant="body2" color="text.secondary">
                Created {formatProjectDate(project.createdAt.slice(0, 10))}
                {draft?.startDate || project.startDate ? (
                  <>
                    {" "}
                    - Started{" "}
                    {formatProjectDate(draft?.startDate ?? project.startDate)}
                  </>
                ) : null}
              </Typography>
            ) : null}
            {renderSourceSummary()}
          </Stack>
        </PageHeader>

        {renderPageBody()}
      </Stack>

      <ResponsiveDialog
        open={editBasicsOpen}
        onClose={() => setEditBasicsOpen(false)}
        title={
          <Box
            component="span"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Box component="span">Edit project</Box>
            {renderAutosavePill()}
          </Box>
        }
        actions={
          <Button variant="contained" onClick={() => setEditBasicsOpen(false)}>
            Done
          </Button>
        }
      >
        {renderProjectBasicsForm()}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        title="Delete project"
        actions={
          <>
            <Button onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDeleteProject}
              disabled={deleting || deleteConfirmation !== project?.name}
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning" variant="outlined">
            This permanently deletes the project, addenda, project photos, Pheno
            Hunt records, Wash/Process records, and analytics inputs. This cannot
            be undone.
          </Alert>
          <DialogContentText>
            Type <strong>{project?.name}</strong> to confirm.
          </DialogContentText>
          <TextField
            label="Project name"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            fullWidth
            autoFocus
          />
        </Stack>
      </ResponsiveDialog>
    </PageContainer>
  );
};

export default ProjectDetailPage;
