import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { alpha } from "@mui/material/styles";
import { ReactNode } from "react";

interface AuthPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  supportTitle: string;
  supportItems: string[];
  children: ReactNode;
}

const AuthPanel = ({
  eyebrow,
  title,
  description,
  supportTitle,
  supportItems,
  children,
}: AuthPanelProps) => (
  <Box
    sx={(theme) => ({
      minHeight: { xs: "auto", lg: "calc(100dvh - 136px)" },
      display: "grid",
      alignItems: "center",
      px: { xs: 2, sm: 3, lg: 4 },
      py: { xs: 3, sm: 5, lg: 7 },
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
        gap: { xs: 3, md: 5 },
        alignItems: "center",
      }}
    >
      <Stack spacing={2.5} sx={{ order: { xs: 2, md: 1 } }}>
        <Chip
          icon={<LockOutlinedIcon />}
          label="Private library"
          variant="outlined"
          sx={{ alignSelf: "flex-start", bgcolor: "background.paper" }}
        />

        <Stack spacing={1.5}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 800, letterSpacing: "0.12em" }}
          >
            {eyebrow}
          </Typography>
          <Typography component="h1" variant="h2">
            {title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 560 }}
          >
            {description}
          </Typography>
        </Stack>

        <Card
          variant="outlined"
          sx={{
            maxWidth: 560,
            bgcolor: "surface.subtle",
            boxShadow: "none",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  flex: "0 0 auto",
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  color: "primary.main",
                })}
                aria-hidden="true"
              >
                <ScienceOutlinedIcon />
              </Box>
              <Stack spacing={1}>
                <Typography variant="subtitle1">{supportTitle}</Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {supportItems.map((item) => (
                    <Typography
                      key={item}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                    >
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card
        sx={(theme) => ({
          order: { xs: 1, md: 2 },
          bgcolor: alpha(theme.palette.background.paper, 0.94),
          backdropFilter: "blur(12px)",
        })}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            "&:last-child": { pb: { xs: 2.5, sm: 3.5 } },
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Box>
  </Box>
);

export default AuthPanel;
