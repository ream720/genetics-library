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
} from "@mui/material";
import { useSeedContext } from "../context/SeedContext";
import { v4 as uuidv4 } from "uuid";

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed } = useSeedContext();
  const [newSeedBreeder, setNewSeedBreeder] = React.useState("");
  const [newSeedStrain, setNewSeedStrain] = React.useState("");
  const [newSeedGeneration, setNewSeedGeneration] = React.useState("");
  const [newNumSeeds, setNewNumSeeds] = React.useState(0);
  const [newFeminized, setNewFeminized] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);

  const handleAddSeed = () => {
    if (newSeedBreeder && newSeedStrain) {
      addSeed({
        id: uuidv4(),
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
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Seeds
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Breeder"
          value={newSeedBreeder}
          onChange={(e) => setNewSeedBreeder(e.target.value)}
        />
        <TextField
          label="Strain"
          value={newSeedStrain}
          onChange={(e) => setNewSeedStrain(e.target.value)}
        />
        <TextField
          label="Generation"
          value={newSeedGeneration}
          onChange={(e) => setNewSeedGeneration(e.target.value)}
        />
        <TextField
          label="# of Seeds"
          type="number"
          value={newNumSeeds}
          onChange={(e) => setNewNumSeeds(Number(e.target.value))}
        />
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
        <Button size="small" variant="contained" onClick={handleAddSeed}>
          Add Seed
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Breeder</TableCell>
            <TableCell>Strain</TableCell>
            <TableCell>Generation</TableCell>
            <TableCell># of Seeds</TableCell>
            <TableCell>Feminized?</TableCell>
            <TableCell>Open?</TableCell>
            <TableCell>Available?</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seeds.map((seed) => (
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
                  onClick={() => deleteSeed(seed.id)}
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

export default SeedsPage;
