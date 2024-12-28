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
  Paper,
  TableContainer,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { visuallyHidden } from "@mui/utils";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";

// Interface for table sorting
interface SeedOrder {
  orderBy: keyof Seed;
  order: "asc" | "desc";
}

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed, updateSeed } = useSeedContext();

  // Form states
  const [newSeedBreeder, setNewSeedBreeder] = React.useState("");
  const [newSeedStrain, setNewSeedStrain] = React.useState("");
  const [newSeedGeneration, setNewSeedGeneration] = React.useState("");
  const [newNumSeeds, setNewNumSeeds] = React.useState(0);
  const [newFeminized, setNewFeminized] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);

  // Edit states
  const [editingSeed, setEditingSeed] = React.useState<Seed | null>(null);
  const [editForm, setEditForm] = React.useState({
    breeder: "",
    strain: "",
    generation: "",
    numSeeds: 0,
    feminized: false,
    open: false,
    available: false,
  });

  // Actions dropdown state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuSeedId, setMenuSeedId] = React.useState<string | null>(null);
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    seedId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuSeedId(seedId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSeedId(null);
  };

  // Sorting states
  const [order, setOrder] = React.useState<SeedOrder["order"]>("asc");
  const [orderBy, setOrderBy] = React.useState<SeedOrder["orderBy"]>("breeder");

  // Handle adding a new seed
  const handleAddSeed = () => {
    if (newSeedBreeder && newSeedStrain) {
      addSeed({
        breeder: newSeedBreeder,
        strain: newSeedStrain,
        generation: newSeedGeneration,
        numSeeds: newNumSeeds,
        feminized: newFeminized,
        open: newOpen,
        dateAcquired: new Date().toISOString(),
        available: isAvailable,
      });
      setNewSeedBreeder("");
      setNewSeedStrain("");
      setNewSeedGeneration("");
      setNewNumSeeds(0);
      setNewFeminized(false);
      setNewOpen(false);
      setIsAvailable(false);
    }
  };

  // Handle sorting
  const handleRequestSort = (property: keyof Seed) => {
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
    sortOrder: SeedOrder["order"],
    sortField: SeedOrder["orderBy"]
  ): (a: Seed, b: Seed) => number {
    return sortOrder === "desc"
      ? (a, b) => descendingComparator(a, b, sortField)
      : (a, b) => -descendingComparator(a, b, sortField);
  }

  function sortSeeds(array: Seed[], comparator: (a: Seed, b: Seed) => number) {
    const stabilizedThis = array.map(
      (el, index) => [el, index] as [Seed, number]
    );
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  // Handle edit click
  const handleEditClick = (seed: Seed) => {
    setEditingSeed(seed);
    setEditForm({
      breeder: seed.breeder,
      strain: seed.strain,
      generation: seed.generation,
      numSeeds: seed.numSeeds,
      feminized: seed.feminized,
      open: seed.open,
      available: seed.available,
    });
    handleMenuClose();
  };

  // Handle form changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Save changes
  const handleSaveChanges = () => {
    if (editingSeed) {
      updateSeed(editingSeed.id!, editForm).then(() => {
        setEditingSeed(null);
      });
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingSeed(null);
  };

  return (
    <Box sx={{ p: 3 }}>
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
        Manage Seeds
      </Typography>

      {/* Form Section */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={2}>
            <TextField
              label="Breeder"
              value={newSeedBreeder}
              onChange={(e) => setNewSeedBreeder(e.target.value)}
              fullWidth
            />
            <TextField
              label="Strain"
              value={newSeedStrain}
              onChange={(e) => setNewSeedStrain(e.target.value)}
              fullWidth
            />
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Generation"
              value={newSeedGeneration}
              onChange={(e) => setNewSeedGeneration(e.target.value)}
              fullWidth
            />
            <TextField
              label="# of Seeds"
              type="number"
              value={newNumSeeds}
              onChange={(e) => setNewNumSeeds(Number(e.target.value))}
              fullWidth
            />
          </Stack>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newFeminized}
                  onChange={(e) => setNewFeminized(e.target.checked)}
                />
              }
              label="Feminized"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newOpen}
                  onChange={(e) => setNewOpen(e.target.checked)}
                />
              }
              label="Open"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
              }
              label="Available?"
            />
          </Stack>
          <Stack>
            <Button
              sx={{ mt: { xs: 2, md: 5 } }}
              size="small"
              variant="contained"
              onClick={handleAddSeed}
            >
              Add Seed
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Table Section */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: { xs: "100%", md: "80%" },
            margin: "0 auto",
            overflowX: "auto",
          }}
        >
          <Table
            sx={{
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
                    active={orderBy === "numSeeds"}
                    direction={orderBy === "numSeeds" ? order : "asc"}
                    onClick={() => handleRequestSort("numSeeds")}
                  >
                    # of Seeds
                    {orderBy === "numSeeds" && (
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
                    active={orderBy === "feminized"}
                    direction={orderBy === "feminized" ? order : "asc"}
                    onClick={() => handleRequestSort("feminized")}
                  >
                    Feminized?
                    {orderBy === "feminized" && (
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
                    active={orderBy === "open"}
                    direction={orderBy === "open" ? order : "asc"}
                    onClick={() => handleRequestSort("open")}
                  >
                    Open?
                    {orderBy === "open" && (
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
              {sortSeeds(seeds, getComparator(order, orderBy)).map((seed) => (
                <TableRow key={seed.id}>
                  {editingSeed?.id === seed.id ? (
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
                          name="generation"
                          value={editForm.generation}
                          onChange={handleEditFormChange}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="numSeeds"
                          type="number"
                          value={editForm.numSeeds}
                          onChange={handleEditFormChange}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          name="feminized"
                          checked={editForm.feminized}
                          onChange={handleEditFormChange}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          name="open"
                          checked={editForm.open}
                          onChange={handleEditFormChange}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          name="available"
                          checked={editForm.available}
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
                      <TableCell>{seed.breeder}</TableCell>
                      <TableCell>{seed.strain}</TableCell>
                      <TableCell>{seed.generation}</TableCell>
                      <TableCell>{seed.numSeeds}</TableCell>
                      <TableCell>{seed.feminized ? "Yes" : "No"}</TableCell>
                      <TableCell>{seed.open ? "Yes" : "No"}</TableCell>
                      <TableCell>{seed.available ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, seed.id!)}
                        >
                          <MoreVert />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={menuSeedId === seed.id}
                          onClose={handleMenuClose}
                        >
                          <MenuItem onClick={() => handleEditClick(seed)}>
                            Edit
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              deleteSeed(seed.id!);
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SeedsPage;
