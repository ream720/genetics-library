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

  const renderAutosaveStatus = () => {
    if (projectIsComplete) {
      return (
        <Alert severity="info" variant="outlined">
          Complete projects are read-only. Addenda stay open for follow-up notes.
        </Alert>
      );
    }

    if (autosaveStatus === "error") {
      return (
        <Alert
          severity="error"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={retryAutosave}>
              Retry
            </Button>
          }
        >
          {autosaveError instanceof Error
            ? `Autosave failed: ${autosaveError.message}`
            : "Autosave failed. Your changes are still pending."}
        </Alert>
      );
    }

    if (
      autosaveStatus === "dirty" ||
      autosaveStatus === "saving" ||
      autosaveStatus === "retrying"
    ) {
      return (
        <Alert severity="warning" variant="outlined">
          {autosaveStatus === "dirty"
            ? "Unsaved edits pending."
            : autosaveStatus === "retrying"
              ? "Retrying autosave..."
              : "Saving changes..."}
        </Alert>
      );
    }

    return (
      <Box
        sx={(theme) => ({
          alignSelf: "flex-start",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 999,
          color: "text.secondary",
          px: 1.5,
          py: 0.5,
        })}
      >
        <Typography variant="caption" fontWeight={700}>
          Saved
        </Typography>
      </Box>
    );
  };

  const renderProjectDetails = () => {
    if (!draft) {
      return null;
    }

    if (projectIsComplete) {
      return (
        <SectionCard title="Project Summary" contentPadding={2.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Project name
              </Typography>
              <Typography>{draft.name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Start date
              </Typography>
              <Typography>{formatProjectDate(draft.startDate)}</Typography>
            </Box>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Objective
              </Typography>
              <Typography whiteSpace="pre-wrap">{draft.objective}</Typography>
            </Box>
          </Box>
        </SectionCard>
      );
    }

    return (
      <SectionCard title="Project Basics" contentPadding={2.5}>
        <Stack spacing={2}>
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
      </SectionCard>
    );
  };

  const renderSources = () => {
    if (!project) {
      return null;
    }

    return (
      <SectionCard
        title="Sources"
        description="Private source snapshots copied when this project was created."
        contentPadding={2.5}
      >
        <Stack divider={<Divider flexItem />} spacing={0}>
          {project.sourceSnapshots.map((source, index) => (
            <Box
              key={`${source.sourceType}-${source.sourceId ?? index}`}
              sx={{ py: 1.25 }}
            >
              <Typography fontWeight={800}>
                {source.strain} by {source.breeder}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {source.sourceType.replace("_", " ")}
                {source.lineage ? ` - ${source.lineage}` : ""}
                {source.generation ? ` - ${source.generation}` : ""}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>
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
        {renderProjectDetails()}
        {renderSources()}

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

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Typography variant="caption" color="text.secondary">
            Created {new Date(project.createdAt).toLocaleDateString()} - Started{" "}
            {formatProjectDate(project.startDate)}
          </Typography>
          {projectIsComplete && (
            <Button
              variant="outlined"
              onClick={() =>
                projectId && navigate(PROJECT_ROUTES.projectAnalytics(projectId))
              }
              disabled={!projectId}
            >
              View Project Analytics
            </Button>
          )}
        </Stack>

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
          title={project?.name ?? "Project"}
          description={
            project
              ? project.objective
              : "Loading project details and workflow records."
          }
          backLabel="Back to projects"
          onBack={() => navigateAway(PROJECT_ROUTES.list)}
          actions={project ? <StatusChip status={project.status} /> : undefined}
        />

        {renderPageBody()}
      </Stack>

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
