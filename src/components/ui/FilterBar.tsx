import { Paper, Stack } from "@mui/material";
import { ReactNode } from "react";

const FilterBar = ({ children }: { children: ReactNode }) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      p: { xs: 0, md: 2 },
      borderRadius: { xs: 0, md: 4 },
      border: { xs: 0, md: `1px solid ${theme.palette.divider}` },
      bgcolor: { xs: "transparent", md: theme.palette.surface.subtle },
    })}
  >
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      {children}
    </Stack>
  </Paper>
);

export default FilterBar;
