import { Card, CardContent, CardProps, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface SectionCardProps extends CardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  contentPadding?: number;
}

const SectionCard = ({
  title,
  description,
  action,
  children,
  contentPadding = 3,
  ...props
}: SectionCardProps) => (
  <Card {...props}>
    <CardContent sx={{ p: contentPadding, "&:last-child": { pb: contentPadding } }}>
      {(title || description || action) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          spacing={1.5}
          sx={{ mb: children ? 2.5 : 0 }}
        >
          <Stack spacing={0.5}>
            {title && <Typography variant="h6">{title}</Typography>}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Stack>
          {action}
        </Stack>
      )}
      {children}
    </CardContent>
  </Card>
);

export default SectionCard;

