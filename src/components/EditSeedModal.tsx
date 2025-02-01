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
  Collapse,
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
    // Initialize with default values for new fields if they don't exist
    setEditedSeed(
      seed
        ? {
            ...seed,
            isMultiple: seed.isMultiple || false,
            quantity: seed.quantity || 1,
          }
        : null
    );
  }, [seed]);

  if (!editedSeed) return null;

  const handleChange =
    (field: keyof Seed) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.type === "number"
          ? Math.max(1, parseInt(event.target.value) || 1)
          : event.target.value;

      // Reset quantity to 1 when isMultiple is turned off
      if (field === "isMultiple" && !event.target.checked) {
        setEditedSeed({
          ...editedSeed,
          isMultiple: false,
          quantity: 1,
        });
      } else {
        setEditedSeed({
          ...editedSeed,
          [field]: value,
        });
      }
    };

  const handleSave = () => {
    // Ensure quantity is 1 for non-multiple packs
    const finalSeed = {
      ...editedSeed,
      quantity: editedSeed.isMultiple ? editedSeed.quantity : 1,
    };
    onSave(finalSeed);
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
          {/* Multiple Pack Controls */}
          <FormControlLabel
            control={
              <Checkbox
                checked={editedSeed.isMultiple}
                onChange={handleChange("isMultiple")}
              />
            }
            label="Multiple Packs"
          />
          <Collapse in={editedSeed.isMultiple}>
            <TextField
              label="Quantity of Packs"
              type="number"
              value={editedSeed.quantity}
              onChange={handleChange("quantity")}
              InputProps={{ inputProps: { min: 1 } }}
              fullWidth
              sx={{ mt: 1 }}
            />
          </Collapse>
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
