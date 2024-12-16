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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
} from "@mui/material";
import { useCloneContext } from "../context/CloneContext";
import { v4 as uuidv4 } from "uuid";

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone } = useCloneContext();
  const [newBreeder, setNewBreeder] = React.useState("");
  const [newStrain, setNewStrain] = React.useState("");
  const [newCutName, setNewCutName] = React.useState("");
  const [newGeneration, setNewGeneration] = React.useState("");
  const [newSex, setNewSex] = React.useState("Male");
  const [newBreederCut, setNewBreederCut] = React.useState(false);
  const [newAvailable, setNewAvailable] = React.useState(false);

  const handleAddClone = () => {
    if (newBreeder && newStrain) {
      addClone({
        id: uuidv4(),
        breeder: newBreeder,
        strain: newStrain,
        cutName: newCutName,
        generation: newGeneration,
        sex: newSex as "Male" | "Female",
        breederCut: newBreederCut,
        available: newAvailable,
        dateAcquired: new Date().toISOString(),
      });
      setNewBreeder("");
      setNewStrain("");
      setNewGeneration("");
      setNewSex("Male");
      setNewBreederCut(false);
      setNewAvailable(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Clones
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          required
          label="Breeder"
          value={newBreeder}
          onChange={(e) => setNewBreeder(e.target.value)}
        />
        <TextField
          required
          label="Strain"
          value={newStrain}
          onChange={(e) => setNewStrain(e.target.value)}
        />
        <TextField
          label="Cut Name"
          value={newCutName}
          onChange={(e) => setNewCutName(e.target.value)}
        />
        <TextField
          label="Generation"
          placeholder="F1, S1, etc."
          value={newGeneration}
          onChange={(e) => setNewGeneration(e.target.value)}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sex</InputLabel>
          <Select
            value={newSex}
            onChange={(e) => setNewSex(e.target.value)}
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
          label="Available"
        />
        <Button size="small" variant="contained" onClick={handleAddClone}>
          Add Clone
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Breeder</TableCell>
            <TableCell>Strain</TableCell>
            <TableCell>Cut Name</TableCell>
            <TableCell>Generation</TableCell>
            <TableCell>Sex</TableCell>
            <TableCell>Breeder Cut</TableCell>
            <TableCell>Available</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clones.map((clone) => (
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
                  onClick={() => deleteClone(clone.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default ClonesPage;
