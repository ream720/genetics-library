import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { alpha } from "@mui/material/styles";
import { ReactNode } from "react";
import PageContainer from "../components/ui/PageContainer";

interface LegalDocumentProps {
  title: string;
  effectiveDate: string;
  description: string;
  children: ReactNode;
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export const LegalSection = ({ title, children }: LegalSectionProps) => (
  <Box component="section">
    <Typography component="h2" variant="h5" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    <Stack spacing={1.4}>{children}</Stack>
  </Box>
);

export const LegalSubheading = ({ children }: { children: ReactNode }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
    {children}
  </Typography>
);

export const LegalList = ({ children }: { children: ReactNode }) => (
  <Box
    component="ul"
    sx={{
      m: 0,
      pl: 3,
      "& li + li": {
        mt: 1,
      },
    }}
  >
    {children}
  </Box>
);

const LegalDocument = ({
  title,
  effectiveDate,
  description,
  children,
}: LegalDocumentProps) => (
  <PageContainer maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
    <Stack spacing={3}>
      <Card
        sx={(theme) => ({
          overflow: "hidden",
          bgcolor: "surface.subtle",
          backgroundImage: `radial-gradient(circle at 0% 0%, ${alpha(
            theme.palette.primary.main,
            0.18
          )}, transparent 34%), radial-gradient(circle at 100% 20%, ${alpha(
            theme.palette.secondary.main,
            0.13
          )}, transparent 28%)`,
        })}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 4 },
            "&:last-child": { pb: { xs: 2.5, sm: 4 } },
          }}
        >
          <Stack spacing={2}>
            <Chip
              icon={<ArticleOutlinedIcon />}
              label="Legal document"
              variant="outlined"
              sx={{ alignSelf: "flex-start", bgcolor: "background.paper" }}
            />
            <Stack spacing={1}>
              <Typography component="h1" variant="h3">
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 680 }}>
                {description}
              </Typography>
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Effective Date: {effectiveDate}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 4 },
            "&:last-child": { pb: { xs: 2.5, sm: 4 } },
            "& p": {
              maxWidth: 720,
            },
          }}
        >
          <Stack spacing={4} divider={<Divider flexItem />}>
            {children}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  </PageContainer>
);

export default LegalDocument;
