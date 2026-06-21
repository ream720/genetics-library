import { Paper, Stack } from "@mui/material";
import { ReactNode } from "react";

const FilterBar = ({ children }: { children: ReactNode }) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      p: { xs: 1.5, sm: 2 },
      borderRadius: 4,
      bgcolor: theme.palette.surface.subtle,
    })}
  >
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      {children}
    </Stack>
  </Paper>
);

export default FilterBar;

