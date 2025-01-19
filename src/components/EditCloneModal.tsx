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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { Clone } from "../types";

interface EditCloneModalProps {
  open: boolean;
  onClose: () => void;
  clone: Clone | null;
  onSave: (updatedClone: Clone) => void;
}

const EditCloneModal: React.FC<EditCloneModalProps> = ({
  open,
  onClose,
  clone,
  onSave,
}) => {
  const [editedClone, setEditedClone] = React.useState<Clone | null>(null);

  React.useEffect(() => {
    setEditedClone(clone);
  }, [clone]);

  if (!editedClone) return null;

  const handleChange =
    (field: keyof Clone) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditedClone({
        ...editedClone,
        [field]:
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value,
      });
    };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    setEditedClone({
      ...editedClone,
      sex: event.target.value as "Male" | "Female",
    });
  };

  const handleSave = () => {
    onSave(editedClone);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Clone</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Breeder"
            value={editedClone.breeder}
            onChange={handleChange("breeder")}
            fullWidth
          />
          <TextField
            label="Strain"
            value={editedClone.strain}
            onChange={handleChange("strain")}
            fullWidth
          />
          <TextField
            label="Cut Name"
            value={editedClone.cutName}
            onChange={handleChange("cutName")}
            fullWidth
          />
          <TextField
            label="Generation"
            value={editedClone.generation}
            onChange={handleChange("generation")}
            fullWidth
          />
          <TextField
            label="Lineage"
            value={editedClone.lineage}
            onChange={handleChange("lineage")}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Sex</InputLabel>
            <Select
              value={editedClone.sex}
              onChange={handleSelectChange}
              label="Sex"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={editedClone.breederCut}
                onChange={handleChange("breederCut")}
              />
            }
            label="Breeder Cut"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedClone.available}
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

export default EditCloneModal;
