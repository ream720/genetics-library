import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  eyebrowAccessory?: ReactNode;
  actions?: ReactNode;
  backLabel?: string;
  onBack?: () => void;
  children?: ReactNode;
}

const PageHeader = ({
  title,
  description,
  eyebrow,
  eyebrowAccessory,
  actions,
  backLabel,
  onBack,
  children,
}: PageHeaderProps) => (
  <Stack spacing={2.25}>
    {onBack && (
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ alignSelf: "flex-start", px: 0.5 }}
      >
        {backLabel ?? "Back"}
      </Button>
    )}
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      spacing={2}
    >
      <Box sx={{ minWidth: 0 }}>
        {(eyebrow || eyebrowAccessory) && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 0.75 }}
          >
            {eyebrow && (
              <Typography
                variant="caption"
                color="secondary.main"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </Typography>
            )}
            {eyebrowAccessory}
          </Stack>
        )}
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
        {description && (
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 720 }}
          >
            {description}
          </Typography>
        )}
        {children && <Box sx={{ mt: 1.5 }}>{children}</Box>}
      </Box>
      {actions && (
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: "100%", sm: "auto" },
            "& > .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
            "& > .MuiChip-root": { width: "auto" },
          }}
        >
          {actions}
        </Box>
      )}
    </Stack>
  </Stack>
);

export default PageHeader;
