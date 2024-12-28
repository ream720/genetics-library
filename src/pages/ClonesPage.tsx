import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  FormControlLabel,
  Stack,
  TableSortLabel,
  tableCellClasses,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableContainer,
  Paper,
  IconButton,
  Menu, // Paper to wrap TableContainer if you like
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { useCloneContext } from "../context/CloneContext";
import { Clone } from "../types";
import { MoreVert } from "@mui/icons-material";

// Interface for table sorting
interface CloneOrder {
  orderBy: keyof Clone;
  order: "asc" | "desc";
}

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone, updateClone } = useCloneContext();
  const [newBreeder, setNewBreeder] = React.useState("");
  const [newStrain, setNewStrain] = React.useState("");
  const [newCutName, setNewCutName] = React.useState("");
  const [newGeneration, setNewGeneration] = React.useState("");
  const [newSex, setNewSex] = React.useState<"Male" | "Female">("Male");
  const [newBreederCut, setNewBreederCut] = React.useState(false);
  const [newAvailable, setNewAvailable] = React.useState(false);

  const [editingClone, setEditingClone] = React.useState<Clone | null>(null);

  const [editForm, setEditForm] = React.useState<Partial<Clone>>({
    breeder: "",
    strain: "",
    cutName: "",
    generation: "",
    sex: "Male",
    breederCut: false,
    available: false,
  });

  // Actions dropdown state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuCloneId, setMenuCloneId] = React.useState<string | null>(null);
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    seedId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuCloneId(seedId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCloneId(null);
  };

  const [order, setOrder] = React.useState<CloneOrder["order"]>("asc");
  const [orderBy, setOrderBy] =
    React.useState<CloneOrder["orderBy"]>("breeder");

  const handleAddClone = async () => {
    if (newBreeder && newStrain) {
      try {
        await addClone({
          breeder: newBreeder,
          strain: newStrain,
          cutName: newCutName,
          generation: newGeneration,
          sex: newSex,
          breederCut: newBreederCut,
          available: newAvailable,
          dateAcquired: new Date().toISOString(),
        });
        // Reset form fields
        setNewBreeder("");
        setNewStrain("");
        setNewCutName("");
        setNewGeneration("");
        setNewSex("Male");
        setNewBreederCut(false);
        setNewAvailable(false);
      } catch (error) {
        console.error("Error adding clone: ", error);
      }
    }
  };

  // Sort logic (unchanged)
  const handleRequestSort = (property: keyof Clone) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(
    order: CloneOrder["order"],
    orderBy: CloneOrder["orderBy"]
  ): (a: Clone, b: Clone) => number {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function sortClones(
    array: Clone[],
    comparator: (a: Clone, b: Clone) => number
  ) {
    const stabilizedThis = array.map(
      (el, index) => [el, index] as [Clone, number]
    );
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleEditClick = (clone: Clone) => {
    setEditingClone(clone);
    setEditForm({
      breeder: clone.breeder,
      strain: clone.strain,
      cutName: clone.cutName,
      generation: clone.generation,
      sex: clone.sex,
      breederCut: clone.breederCut,
      available: clone.available,
    });
    handleMenuClose();
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "sex"
          ? (value as "Male" | "Female")
          : value,
    }));
  };

  const handleSaveChanges = () => {
    if (editingClone) {
      updateClone(editingClone.id!, editForm).then(() => {
        setEditingClone(null);
      });
    }
  };

  const handleCancelEditing = () => {
    setEditingClone(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "Roboto, sans-serif",
          fontWeight: 600,
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        Manage Clones
      </Typography>

      {/* -- FORM SECTION -- */}
      {/*
        Change Stack direction to responsive:
        - column on xs/sm to avoid horizontal overflow
        - row on md+
      */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Column 1 */}
          <Stack spacing={2}>
            <TextField
              required
              label="Breeder"
              value={newBreeder}
              onChange={(e) => setNewBreeder(e.target.value)}
              fullWidth
            />
            <TextField
              required
              label="Strain"
              value={newStrain}
              onChange={(e) => setNewStrain(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Column 2 */}
          <Stack spacing={2}>
            <TextField
              label="Cut Name"
              value={newCutName}
              onChange={(e) => setNewCutName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Generation"
              placeholder="F1, S1, etc."
              value={newGeneration}
              onChange={(e) => setNewGeneration(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Column 3 */}
          <Stack spacing={1}>
            <FormControl fullWidth>
              <InputLabel>Sex</InputLabel>
              <Select
                value={newSex}
                onChange={(e) => setNewSex(e.target.value as "Male" | "Female")}
                label="Sex"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newBreederCut}
                  onChange={(e) => setNewBreederCut(e.target.checked)}
                />
              }
              label="Breeder Cut"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newAvailable}
                  onChange={(e) => setNewAvailable(e.target.checked)}
                />
              }
              label="Available?"
            />
          </Stack>

          {/* Column 4 */}
          <Stack>
            <Button
              sx={{ mt: { xs: 2, md: 5 } }}
              size="small"
              variant="contained"
              onClick={handleAddClone}
            >
              Add Clone
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* -- TABLE SECTION -- */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <TableContainer
          component={Paper} // or just a Box if you prefer
          sx={{
            maxWidth: { xs: "100%", md: "80%" },
            overflowX: "auto",
            margin: "0 auto",
          }}
        >
          <Table
            sx={{
              // On smaller screens, letting the table go 100%
              // plus horizontal scroll is standard practice.
              [`& .${tableCellClasses.head}`]: {
                backgroundColor: "#518548",
                color: "white",
              },
              [`& .${tableCellClasses.body}`]: {
                color: "white",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "breeder"}
                    direction={orderBy === "breeder" ? order : "asc"}
                    onClick={() => handleRequestSort("breeder")}
                  >
                    Breeder
                    {orderBy === "breeder" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "strain"}
                    direction={orderBy === "strain" ? order : "asc"}
                    onClick={() => handleRequestSort("strain")}
                  >
                    Strain
                    {orderBy === "strain" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "cutName"}
                    direction={orderBy === "cutName" ? order : "asc"}
                    onClick={() => handleRequestSort("cutName")}
                  >
                    Cut Name
                    {orderBy === "cutName" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "generation"}
                    direction={orderBy === "generation" ? order : "asc"}
                    onClick={() => handleRequestSort("generation")}
                  >
                    Generation
                    {orderBy === "generation" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "sex"}
                    direction={orderBy === "sex" ? order : "asc"}
                    onClick={() => handleRequestSort("sex")}
                  >
                    Sex
                    {orderBy === "sex" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "breederCut"}
                    direction={orderBy === "breederCut" ? order : "asc"}
                    onClick={() => handleRequestSort("breederCut")}
                  >
                    Breeder Cut
                    {orderBy === "breederCut" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "available"}
                    direction={orderBy === "available" ? order : "asc"}
                    onClick={() => handleRequestSort("available")}
                  >
                    Available?
                    {orderBy === "available" && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>

                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortClones(clones, getComparator(order, orderBy)).map(
                (clone) => (
                  <TableRow key={clone.id}>
                    {editingClone?.id === clone.id ? (
                      <>
                        <TableCell>
                          <TextField
                            name="breeder"
                            value={editForm.breeder}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            name="strain"
                            value={editForm.strain}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            name="cutName"
                            value={editForm.cutName}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            name="generation"
                            value={editForm.generation}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth>
                            <InputLabel>Sex</InputLabel>
                            <Select
                              name="sex"
                              value={editForm.sex || ""} // Ensure a default value is handled
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  sex: e.target.value as "Male" | "Female", // Cast to the appropriate type
                                }))
                              }
                              label="Sex"
                            >
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          <Checkbox
                            name="breederCut"
                            value={editForm.breederCut}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            name="available"
                            value={editForm.available}
                            onChange={handleEditFormChange}
                          />
                        </TableCell>
                        <TableCell>
                          <Button onClick={handleSaveChanges}>Save</Button>
                          <Button onClick={handleCancelEditing}>Cancel</Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{clone.breeder}</TableCell>
                        <TableCell>{clone.strain}</TableCell>
                        <TableCell>{clone.cutName}</TableCell>
                        <TableCell>{clone.generation}</TableCell>
                        <TableCell>{clone.sex}</TableCell>
                        <TableCell>{clone.breederCut ? "Yes" : "No"}</TableCell>
                        <TableCell>{clone.available ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, clone.id!)}
                          >
                            <MoreVert />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={menuCloneId === clone.id}
                            onClose={handleMenuClose}
                          >
                            <MenuItem onClick={() => handleEditClick(clone)}>
                              Edit
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                deleteClone(clone.id!);
                                handleMenuClose();
                              }}
                            >
                              Delete
                            </MenuItem>
                          </Menu>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ClonesPage;
