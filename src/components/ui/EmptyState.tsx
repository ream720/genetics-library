import { Box, Button, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <Box
    sx={(theme) => ({
      border: `1px dashed ${theme.palette.divider}`,
      borderRadius: 4,
      bgcolor: theme.palette.surface.subtle,
      px: 3,
      py: { xs: 4, sm: 6 },
      textAlign: "center",
    })}
  >
    <Stack spacing={1.25} alignItems="center">
      {icon && (
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  </Box>
);

export default EmptyState;

