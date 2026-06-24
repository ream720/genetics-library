import { Box, BoxProps } from "@mui/material";

type PageWidth = "sm" | "md" | "lg" | "xl";

const widths: Record<PageWidth, number> = {
  sm: 720,
  md: 920,
  lg: 1180,
  xl: 1400,
};

interface PageContainerProps extends BoxProps {
  maxWidth?: PageWidth;
}

const PageContainer = ({
  maxWidth = "lg",
  children,
  sx,
  ...props
}: PageContainerProps) => (
  <Box
    {...props}
    sx={{
      width: "100%",
      maxWidth: widths[maxWidth],
      mx: "auto",
      px: { xs: 2, sm: 3, lg: 4 },
      py: { xs: 2.5, sm: 3.5, lg: 4 },
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default PageContainer;

