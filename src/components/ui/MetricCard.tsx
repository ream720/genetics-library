import { Card, CardContent, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
}

const MetricCard = ({ label, value, detail, icon }: MetricCardProps) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Stack spacing={0.5}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {value}
          </Typography>
          {detail && (
            <Typography variant="body2" color="text.secondary">
              {detail}
            </Typography>
          )}
        </Stack>
        {icon}
      </Stack>
    </CardContent>
  </Card>
);

export default MetricCard;

