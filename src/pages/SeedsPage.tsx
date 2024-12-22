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
} from "@mui/material";
import { useSeedContext } from "../context/SeedContext";
import { visuallyHidden } from "@mui/utils";
import { Seed } from "../types";

// Interface for table sorting
interface SeedOrder {
  orderBy: keyof Seed;
  order: "asc" | "desc";
}

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed, refetchSeeds } = useSeedContext();
  const [newSeedBreeder, setNewSeedBreeder] = React.useState("");
  const [newSeedStrain, setNewSeedStrain] = React.useState("");
  const [newSeedGeneration, setNewSeedGeneration] = React.useState("");
  const [newNumSeeds, setNewNumSeeds] = React.useState(0);
  const [newFeminized, setNewFeminized] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [order, setOrder] = React.useState<SeedOrder["order"]>("asc");
  const [orderBy, setOrderBy] = React.useState<SeedOrder["orderBy"]>("breeder");

  const handleAddSeed = () => {
    if (newSeedBreeder && newSeedStrain) {
      addSeed({
        // Let Firestore generate the ID
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

  // Function to handle requesting a new sort order
  const handleRequestSort = (property: keyof Seed) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Function to compare values for sorting
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  // Function to get the comparator based on the order
  function getComparator(
    order: SeedOrder["order"],
    orderBy: SeedOrder["orderBy"]
  ): (a: Seed, b: Seed) => number {
    // Use Seed instead of any
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Function to sort the seeds array
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
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2}>
          <Stack spacing={2}>
            <TextField
              label="Breeder"
              value={newSeedBreeder}
              onChange={(e) => setNewSeedBreeder(e.target.value)}
              sx={{ width: "250px" }}
            />
            <TextField
              label="Strain"
              value={newSeedStrain}
              onChange={(e) => setNewSeedStrain(e.target.value)}
              sx={{ width: "250px" }}
            />
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Generation"
              value={newSeedGeneration}
              onChange={(e) => setNewSeedGeneration(e.target.value)}
              sx={{ width: "250px" }}
            />
            <TextField
              label="# of Seeds"
              type="number"
              value={newNumSeeds}
              onChange={(e) => setNewNumSeeds(Number(e.target.value))}
              sx={{ width: "250px" }}
            />
          </Stack>
          <Stack>
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
              sx={{ mt: 5 }}
              size="small"
              variant="contained"
              onClick={handleAddSeed}
            >
              Add Seed
            </Button>
          </Stack>
        </Stack>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Table
          sx={{
            maxWidth: "80%",
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
              {/* Table header cells with sorting */}
              {/* Sortable headers */}
              <TableCell>
                <TableSortLabel
                  active={orderBy === "breeder"}
                  direction={orderBy === "breeder" ? order : "asc"}
                  onClick={() => handleRequestSort("breeder")}
                >
                  Breeder
                  {orderBy === "breeder" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "strain"}
                  direction={orderBy === "strain" ? order : "asc"}
                  onClick={() => handleRequestSort("strain")}
                >
                  Strain
                  {orderBy === "strain" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "generation"}
                  direction={orderBy === "generation" ? order : "asc"}
                  onClick={() => handleRequestSort("generation")}
                >
                  Generation
                  {orderBy === "generation" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "numSeeds"}
                  direction={orderBy === "numSeeds" ? order : "asc"}
                  onClick={() => handleRequestSort("numSeeds")}
                >
                  # of Seeds
                  {orderBy === "numSeeds" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "feminized"}
                  direction={orderBy === "feminized" ? order : "asc"}
                  onClick={() => handleRequestSort("feminized")}
                >
                  Feminized?
                  {orderBy === "feminized" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "open"}
                  direction={orderBy === "open" ? order : "asc"}
                  onClick={() => handleRequestSort("open")}
                >
                  Open?
                  {orderBy === "open" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "available"}
                  direction={orderBy === "available" ? order : "asc"}
                  onClick={() => handleRequestSort("available")}
                >
                  Available?
                  {orderBy === "available" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortSeeds(seeds, getComparator(order, orderBy)).map((seed) => (
              <TableRow key={seed.id}>
                <TableCell>{seed.breeder}</TableCell>
                <TableCell>{seed.strain}</TableCell>
                <TableCell>{seed.generation}</TableCell>
                <TableCell>{seed.numSeeds}</TableCell>
                <TableCell>{seed.feminized ? "Yes" : "No"}</TableCell>
                <TableCell>{seed.open ? "Yes" : "No"}</TableCell>
                <TableCell>{seed.available ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteSeed(seed.id!)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Button
        sx={{ mt: 2 }}
        size="small"
        variant="contained"
        onClick={refetchSeeds}
      >
        Refetch Seeds
      </Button>
    </Box>
  );
};

export default SeedsPage;
