import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  meta?: ReactNode;
}

const ActionCard = ({
  title,
  description,
  icon,
  onClick,
  meta,
}: ActionCardProps) => (
  <Card sx={{ height: "100%" }}>
    <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
      <CardContent sx={{ height: "100%", p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={(theme) => ({
              width: 46,
              height: 46,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              color: "primary.main",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(145, 184, 142, 0.12)"
                  : "rgba(79, 111, 82, 0.1)",
            })}
          >
            {icon}
          </Box>
          <Stack spacing={0.6} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            {meta}
          </Stack>
          <ChevronRightIcon color="action" sx={{ mt: 1 }} />
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default ActionCard;

