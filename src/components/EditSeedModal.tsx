import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
} from "@mui/material";
import { Seed } from "../types";

interface EditSeedModalProps {
  open: boolean;
  onClose: () => void;
  seed: Seed | null;
  onSave: (updatedSeed: Seed) => void;
}

const EditSeedModal: React.FC<EditSeedModalProps> = ({
  open,
  onClose,
  seed,
  onSave,
}) => {
  const [editedSeed, setEditedSeed] = React.useState<Seed | null>(null);

  React.useEffect(() => {
    setEditedSeed(seed);
  }, [seed]);

  if (!editedSeed) return null;

  const handleChange =
    (field: keyof Seed) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditedSeed({
        ...editedSeed,
        [field]:
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value,
      });
    };

  const handleSave = () => {
    onSave(editedSeed);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Seed</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Breeder"
            value={editedSeed.breeder}
            onChange={handleChange("breeder")}
            fullWidth
          />
          <TextField
            label="Strain"
            value={editedSeed.strain}
            onChange={handleChange("strain")}
            fullWidth
          />
          <TextField
            label="Generation"
            value={editedSeed.generation}
            onChange={handleChange("generation")}
            fullWidth
          />
          <TextField
            label="Number of Seeds"
            type="number"
            value={editedSeed.numSeeds}
            onChange={handleChange("numSeeds")}
            fullWidth
          />
          <TextField
            label="Lineage"
            value={editedSeed.lineage}
            onChange={handleChange("lineage")}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedSeed.feminized}
                onChange={handleChange("feminized")}
              />
            }
            label="Feminized"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedSeed.open}
                onChange={handleChange("open")}
              />
            }
            label="Open"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedSeed.available}
                onChange={handleChange("available")}
              />
            }
            label="Available"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSeedModal;
