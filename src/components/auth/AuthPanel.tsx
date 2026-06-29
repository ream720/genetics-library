import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ReactNode } from "react";

interface AuthPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const AuthPanel = ({
  eyebrow,
  title,
  description,
  children,
}: AuthPanelProps) => (
  <Box
    sx={(theme) => ({
      minHeight: { xs: "auto", lg: "calc(100dvh - 136px)" },
      display: "grid",
      alignItems: "center",
      px: { xs: 2, sm: 3, lg: 4 },
      py: { xs: 2, sm: 4, lg: 7 },
      background:
        theme.palette.mode === "dark"
          ? `radial-gradient(circle at 18% 10%, ${alpha(
              theme.palette.primary.main,
              0.22
            )}, transparent 30%), radial-gradient(circle at 82% 18%, ${alpha(
              theme.palette.secondary.main,
              0.13
            )}, transparent 30%)`
          : `radial-gradient(circle at 18% 10%, ${alpha(
              theme.palette.primary.main,
              0.16
            )}, transparent 30%), radial-gradient(circle at 82% 18%, ${alpha(
              theme.palette.secondary.main,
              0.16
            )}, transparent 30%)`,
    })}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 1080,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "0.9fr minmax(360px, 480px)" },
        gap: { xs: 2, md: 5 },
        alignItems: "center",
      }}
    >
      <Stack spacing={1.25} sx={{ order: { xs: 1, md: 1 } }}>
        <Stack spacing={1}>
          {eyebrow ? (
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ fontWeight: 800, letterSpacing: "0.12em" }}
            >
              {eyebrow}
            </Typography>
          ) : null}
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontSize: { xs: "1.55rem", sm: "2rem", md: "2.6rem" },
              lineHeight: { xs: 1.18, sm: 1.15 },
              maxWidth: 620,
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 560 }}
            >
              {description}
            </Typography>
          ) : null}
        </Stack>
      </Stack>

      <Card
        sx={(theme) => ({
          order: { xs: 2, md: 2 },
          bgcolor: alpha(theme.palette.background.paper, 0.94),
          backdropFilter: "blur(12px)",
        })}
      >
        <CardContent
          sx={{
            p: { xs: 2, sm: 3.5 },
            "&:last-child": { pb: { xs: 2, sm: 3.5 } },
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Box>
  </Box>
);

export default AuthPanel;
