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
} from "@mui/material";
import { useCloneContext } from "../context/CloneContext";
import { visuallyHidden } from "@mui/utils";
import { Clone } from "../types";

// Interface for table sorting
interface CloneOrder {
  orderBy: keyof Clone;
  order: "asc" | "desc";
}

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone } = useCloneContext();
  const [newBreeder, setNewBreeder] = React.useState("");
  const [newStrain, setNewStrain] = React.useState("");
  const [newCutName, setNewCutName] = React.useState("");
  const [newGeneration, setNewGeneration] = React.useState("");
  const [newSex, setNewSex] = React.useState<"Male" | "Female">("Male");
  const [newBreederCut, setNewBreederCut] = React.useState(false);
  const [newAvailable, setNewAvailable] = React.useState(false);
  const [order, setOrder] = React.useState<CloneOrder["order"]>("asc");
  const [orderBy, setOrderBy] =
    React.useState<CloneOrder["orderBy"]>("breeder");

  const handleAddClone = async () => {
    if (newBreeder && newStrain) {
      try {
        await addClone({
          // Firestore will generate the ID
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
        // Optionally display an error message to the user
      }
    }
  };

  // Function to handle requesting a new sort order
  const handleRequestSort = (property: keyof Clone) => {
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
    order: CloneOrder["order"],
    orderBy: CloneOrder["orderBy"]
  ): (a: Clone, b: Clone) => number {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Function to sort the clones array
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
        Manage Clones
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2}>
          <Stack spacing={2}>
            <TextField
              required
              label="Breeder"
              value={newBreeder}
              onChange={(e) => setNewBreeder(e.target.value)}
              sx={{ width: "250px" }}
            />
            <TextField
              required
              label="Strain"
              value={newStrain}
              onChange={(e) => setNewStrain(e.target.value)}
              sx={{ width: "250px" }}
            />
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Cut Name"
              value={newCutName}
              onChange={(e) => setNewCutName(e.target.value)}
              sx={{ width: "250px" }}
            />
            <TextField
              label="Generation"
              placeholder="F1, S1, etc."
              value={newGeneration}
              onChange={(e) => setNewGeneration(e.target.value)}
              sx={{ width: "250px" }}
            />
          </Stack>
          <Stack>
            <FormControl sx={{ minWidth: 120 }}>
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
          <Stack>
            <Button
              sx={{ mt: 5 }}
              size="small"
              variant="contained"
              onClick={handleAddClone}
            >
              Add Clone
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
                  active={orderBy === "cutName"}
                  direction={orderBy === "cutName" ? order : "asc"}
                  onClick={() => handleRequestSort("cutName")}
                >
                  Cut Name
                  {orderBy === "cutName" ? (
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
                  active={orderBy === "sex"}
                  direction={orderBy === "sex" ? order : "asc"}
                  onClick={() => handleRequestSort("sex")}
                >
                  Sex
                  {orderBy === "sex" ? (
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
                  active={orderBy === "breederCut"}
                  direction={orderBy === "breederCut" ? order : "asc"}
                  onClick={() => handleRequestSort("breederCut")}
                >
                  Breeder Cut
                  {orderBy === "breederCut" ? (
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
            {sortClones(clones, getComparator(order, orderBy)).map((clone) => (
              <TableRow key={clone.id}>
                <TableCell>{clone.breeder}</TableCell>
                <TableCell>{clone.strain}</TableCell>
                <TableCell>{clone.cutName}</TableCell>
                <TableCell>{clone.generation}</TableCell>
                <TableCell>{clone.sex}</TableCell>
                <TableCell>{clone.breederCut ? "Yes" : "No"}</TableCell>
                <TableCell>{clone.available ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteClone(clone.id!)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default ClonesPage;
