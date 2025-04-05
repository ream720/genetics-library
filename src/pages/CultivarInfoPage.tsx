import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Grid,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CardContent,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useSeedContext } from "../context/SeedContext";
import { useCloneContext } from "../context/CloneContext";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { CultivarInfo, Seed, Clone } from "../types"; // Import Seed and Clone types
import CultivarInfoForm from "../components/CultivarInfoForm";
import { useLocation } from "react-router-dom"; // Remove navigate if unused

const CultivarInfoPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { seeds } = useSeedContext();
  const { clones } = useCloneContext();
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const location = useLocation();

  const [tabValue, setTabValue] = useState<number>(0);
  const [searchDialogOpen, setSearchDialogOpen] = useState<boolean>(false);
  // Update type from any to Seed | Clone | null
  const [selectedItem, setSelectedItem] = useState<Seed | Clone | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [cultivarInfos, setCultivarInfos] = useState<CultivarInfo[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingInfo, setEditingInfo] = useState<CultivarInfo | undefined>(
    undefined
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [infoToDelete, setInfoToDelete] = useState<CultivarInfo | null>(null);

  // Add console logs to debug
  useEffect(() => {
    console.log("showForm:", showForm);
    console.log("selectedItem:", selectedItem);
  }, [showForm, selectedItem]);

  // Replace both useEffect hooks related to URL parameters with this single one
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemType = params.get("itemType") as "seed" | "clone";
    const itemId = params.get("itemId");
    const existingId = params.get("existingId");
    const viewMode = params.get("view");

    // Set read-only mode if specified
    if (viewMode === "readonly") {
      setReadOnly(true);
    }

    if (existingId) {
      // Find the existing cultivar info entry
      const existingInfo = cultivarInfos.find((info) => info.id === existingId);

      if (existingInfo) {
        // Find the corresponding item
        let item;
        if (existingInfo.itemType === "seed") {
          item = seeds.find((seed) => seed.id === existingInfo.itemId);
          setTabValue(0);
        } else {
          item = clones.find((clone) => clone.id === existingInfo.itemId);
          setTabValue(1);
        }

        if (item) {
          console.log("Found item from existingId:", item);
          setSelectedItem(item);
          setEditingInfo(existingInfo);
          setShowForm(true);
        }
      }
    } else if (itemType && itemId) {
      // Find the item
      let item;
      if (itemType === "seed") {
        item = seeds.find((seed) => seed.id === itemId);
      } else {
        item = clones.find((clone) => clone.id === itemId);
      }

      if (item) {
        console.log("Found item from URL params:", item);
        setSelectedItem(item);
        setShowForm(true);
        // Set tab value based on item type
        setTabValue(itemType === "seed" ? 0 : 1);
      }
    }
  }, [location, seeds, clones, cultivarInfos]);

  // Fetch cultivar info entries
  useEffect(() => {
    const fetchCultivarInfos = async () => {
      // If no user is logged in, don't fetch anything
      if (!currentUser) return;

      setLoading(true);
      try {
        // Get the user ID from the URL params for viewing other user's cultivar info
        const params = new URLSearchParams(location.search);
        const existingId = params.get("existingId");
        const viewMode = params.get("view");

        // If we're in read-only mode with an existingId, we need to fetch that specific info
        if (viewMode === "readonly" && existingId) {
          // First, fetch just this specific cultivar info to get its userId
          const infoDocRef = doc(db, "cultivarInfo", existingId);
          const infoDocSnap = await getDoc(infoDocRef);

          if (infoDocSnap.exists()) {
            const infoData = infoDocSnap.data() as CultivarInfo;
            setCultivarInfos([{ id: existingId, ...infoData } as CultivarInfo]);
          }

          setLoading(false);
          return;
        }

        // Default case: fetch current user's cultivar info
        const q = query(
          collection(db, "cultivarInfo"),
          where("userId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const infos = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as CultivarInfo)
        );

        setCultivarInfos(infos);
      } catch (error) {
        console.error("Error fetching cultivar info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCultivarInfos();
  }, [currentUser, location]);

  // Handle tab change between seeds and clones in the search dialog
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Open search dialog to select seed or clone
  const handleStartSearch = () => {
    setSearchDialogOpen(true);
  };

  // Handle selection of a seed or clone
  // Update the type from any to Seed | Clone
  const handleSelectItem = (item: Seed | Clone) => {
    console.log("Selected item:", item);
    setSelectedItem(item);
    setSearchDialogOpen(false);
    setShowForm(true);
    console.log("Set showForm to true");

    // Determine if this is a seed based on properties
    const isSeed = "numSeeds" in item;
    setTabValue(isSeed ? 0 : 1);
  };

  // Filter seeds or clones based on search term
  const getFilteredItems = () => {
    if (tabValue === 0) {
      // Seeds
      return seeds.filter(
        (seed) =>
          seed.strain.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seed.breeder.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Clones
      return clones.filter(
        (clone) =>
          clone.strain.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clone.breeder.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  // Handle editing an existing cultivar info entry
  const handleEditInfo = (
    info: CultivarInfo,
    mode: "edit" | "view" = "edit"
  ) => {
    console.log("Editing/Viewing info:", info);
    // Find the corresponding item
    let item;
    if (info.itemType === "seed") {
      item = seeds.find((seed) => seed.id === info.itemId);
    } else {
      item = clones.find((clone) => clone.id === info.itemId);
    }

    if (item) {
      console.log("Found corresponding item:", item);
      setSelectedItem(item);
      setEditingInfo(info);
      setShowForm(true);
      // Set read-only mode based on the mode parameter
      setReadOnly(mode === "view");
      // Set tab value based on item type
      setTabValue(info.itemType === "seed" ? 0 : 1);
    } else {
      console.error("Could not find corresponding item for:", info);
    }
  };

  // Handle deleting a cultivar info entry
  const handleDeleteInfo = (info: CultivarInfo) => {
    setInfoToDelete(info);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!infoToDelete || !infoToDelete.id) return;

    try {
      await deleteDoc(doc(db, "cultivarInfo", infoToDelete.id));
      setCultivarInfos((infos) =>
        infos.filter((info) => info.id !== infoToDelete.id)
      );
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting cultivar info:", error);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingInfo(undefined);
    setReadOnly(false);
    setSelectedItem(null);

    // Refetch cultivar infos
    if (currentUser) {
      const fetchCultivarInfos = async () => {
        try {
          const q = query(
            collection(db, "cultivarInfo"),
            where("userId", "==", currentUser.uid)
          );

          const querySnapshot = await getDocs(q);
          const infos = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as CultivarInfo)
          );

          setCultivarInfos(infos);
        } catch (error) {
          console.error("Error fetching cultivar info:", error);
        }
      };

      fetchCultivarInfos();
    }
  };

  console.log("Rendering CultivarInfoPage, showForm:", showForm);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {showForm && selectedItem ? (
        readOnly ? (
          // Read-only view for other users
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Cultivar Information
              </Typography>

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {editingInfo?.itemType === "seed" ? "Seed" : "Clone"}:{" "}
                <strong>{selectedItem.strain}</strong> by {selectedItem.breeder}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {editingInfo?.growingMethod && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Growing Method</Typography>
                    <Typography variant="body1">
                      {editingInfo.growingMethod}
                    </Typography>
                  </Grid>
                )}

                {editingInfo?.potSize && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Pot Size</Typography>
                    <Typography variant="body1">
                      {editingInfo.potSize}
                    </Typography>
                  </Grid>
                )}

                {editingInfo?.nutrients && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Nutrients</Typography>
                    <Typography variant="body1">
                      {editingInfo.nutrients}
                    </Typography>
                  </Grid>
                )}

                {editingInfo?.feedSchedule && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Feed Schedule</Typography>
                    <Typography variant="body1">
                      {editingInfo.feedSchedule}
                    </Typography>
                  </Grid>
                )}

                {editingInfo?.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Notes</Typography>
                    <Typography variant="body1">{editingInfo.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInfo(undefined);
                    setReadOnly(false);
                  }}
                >
                  Close
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          // Editable form for the owner
          <CultivarInfoForm
            itemType={tabValue === 0 ? "seed" : "clone"}
            item={selectedItem}
            existingInfo={editingInfo}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingInfo(undefined);
            }}
          />
        )
      ) : (
        <Card sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Cultivar Information
          </Typography>
          <Typography variant="body1" paragraph>
            Add growing information, notes, and details about your seeds and
            clones.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleStartSearch}
            sx={{ mt: 2, mb: 4 }}
          >
            Add New Cultivar Information
          </Button>

          <Divider sx={{ my: 3 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : cultivarInfos.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              You haven't added any cultivar information yet.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {cultivarInfos.map((info) => (
                <Grid item xs={12} sm={6} key={info.id}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {info.strain}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditInfo(info, "edit")}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteInfo(info)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {info.breeder} •{" "}
                      {info.itemType === "seed" ? "Seed" : "Clone"}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {info.growingMethod && (
                        <Typography variant="body2">
                          <strong>Growing Method:</strong> {info.growingMethod}
                        </Typography>
                      )}
                      {info.potSize && (
                        <Typography variant="body2">
                          <strong>Pot Size:</strong> {info.potSize}
                        </Typography>
                      )}
                    </Stack>

                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleEditInfo(info, "view")}
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      )}

      {/* Search Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Seed or Clone</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Seeds" />
            <Tab label="Clones" />
          </Tabs>

          <TextField
            fullWidth
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Stack spacing={1}>
            {getFilteredItems().map((item) => (
              <Button
                key={item.id}
                variant="outlined"
                onClick={() => handleSelectItem(item)}
                sx={{ justifyContent: "flex-start", textAlign: "left", px: 2 }}
              >
                <Box>
                  <Typography variant="subtitle1">{item.strain}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.breeder}
                  </Typography>
                </Box>
              </Button>
            ))}
            {getFilteredItems().length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                No items found matching your search.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the cultivar information for{" "}
            <strong>{infoToDelete?.strain}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CultivarInfoPage;
