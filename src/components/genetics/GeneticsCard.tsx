import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import ShareIcon from "@mui/icons-material/Share";
import VerifiedIcon from "@mui/icons-material/Verified";
import { Clone, Seed } from "../../types";

type GeneticsCardItem =
  | {
      type: "seed";
      item: Seed;
    }
  | {
      type: "clone";
      item: Clone;
    };

interface GeneticsCardProps extends GeneticsCardItem {
  highlighted?: boolean;
  onShare?: (type: "seed" | "clone", id: string) => void;
  sx?: SxProps<Theme>;
}

const formatDate = (value?: string) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
};

const GeneticsCard = ({
  type,
  item,
  highlighted = false,
  onShare,
  sx,
}: GeneticsCardProps) => {
  const isSeed = type === "seed";
  const title = item.strain;
  const hasLineage = Boolean(item.lineage);
  const hasGeneration = Boolean(item.generation);
  const available = item.available;
  const acquiredDate = formatDate(item.dateAcquired);
  const canShare = Boolean(onShare && item.id);

  return (
    <Card
      className={highlighted ? "highlight-animate" : undefined}
      variant="outlined"
      sx={{
        height: { xs: "auto", sm: "100%" },
        minHeight: { xs: "auto", sm: 262 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      <CardHeader
        sx={{
          pb: 0.75,
          "& .MuiCardHeader-content": { minWidth: 0 },
          "& .MuiCardHeader-action": { alignSelf: "center", mt: 0, mr: 0 },
        }}
        title={
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
              {isSeed && item.feminized ? (
                <Tooltip title="Feminized">
                  <FemaleIcon
                    color="action"
                    fontSize="small"
                    titleAccess="Feminized seed"
                  />
                </Tooltip>
              ) : !isSeed && item.sex === "Male" ? (
                <Tooltip title="Male">
                  <MaleIcon
                    color="action"
                    fontSize="small"
                    titleAccess="Male clone"
                  />
                </Tooltip>
              ) : !isSeed && item.sex === "Female" ? (
                <Tooltip title="Female">
                  <FemaleIcon
                    color="action"
                    fontSize="small"
                    titleAccess="Female clone"
                  />
                </Tooltip>
              ) : null}
              <Tooltip title={title}>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  noWrap
                  sx={{ minWidth: 0 }}
                >
                  {title}
                </Typography>
              </Tooltip>
            </Stack>
            <Typography color="text.secondary" variant="body2" noWrap>
              {item.breeder}
            </Typography>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={0.5} alignItems="center">
            {isSeed && item.open && (
              <Tooltip title="Open pack">
                <BrokenImageIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
            {!isSeed && item.breederCut && (
              <Tooltip title="Breeder cut">
                <VerifiedIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
            {hasLineage && (
              <Tooltip title={item.lineage}>
                <AccountTreeIcon color="action" fontSize="small" />
              </Tooltip>
            )}
            <Tooltip title={available ? "Available" : "Unavailable"}>
              {available ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <CancelIcon color="error" fontSize="small" />
              )}
            </Tooltip>
          </Stack>
        }
      />

      <CardContent
        sx={{
          py: 1,
          flex: { xs: "0 0 auto", sm: 1 },
          "&:last-child": { pb: 1 },
        }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={0.75}
            sx={{
              minHeight: { xs: "auto", sm: 33 },
              alignContent: "flex-start",
            }}
          >
            {isSeed ? (
              <>
                <Chip
                  label={`${item.numSeeds} ${item.numSeeds === 1 ? "seed" : "seeds"}`}
                  size="small"
                  variant="outlined"
                />
                {item.isMultiple && item.quantity > 1 && (
                  <Chip label={`${item.quantity} packs`} size="small" />
                )}
              </>
            ) : (
              <>
                {item.cutName && (
                  <Chip label={item.cutName} size="small" variant="outlined" />
                )}
                {item.phenoHunted && <Chip label="Pheno Hunted" size="small" />}
                {item.finalLabels?.map((label) => (
                  <Chip key={label} label={label} size="small" variant="outlined" />
                ))}
              </>
            )}
          </Stack>

          <Stack spacing={0.5} sx={{ minHeight: { xs: "auto", sm: 56 } }}>
            <Typography
              color="text.secondary"
              variant="body2"
              aria-hidden={!hasGeneration}
              sx={{
                display: { xs: hasGeneration ? "block" : "none", sm: "block" },
                minHeight: { xs: "auto", sm: "1.45em" },
              }}
            >
              {hasGeneration ? `Generation: ${item.generation}` : "\u00a0"}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              aria-hidden={!hasLineage}
              sx={{
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                display: {
                  xs: hasLineage ? "-webkit-box" : "none",
                  sm: "-webkit-box",
                },
                minHeight: { xs: "auto", sm: "2.9em" },
              }}
            >
              {hasLineage ? item.lineage : "\u00a0"}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "space-between",
          borderTop: 1,
          borderColor: "divider",
          px: 2,
          py: 0.75,
        }}
      >
        <Typography color="text.secondary" variant="caption">
          Added {acquiredDate}
        </Typography>
        {canShare && (
          <Tooltip title="Copy share link">
            <IconButton
              size="small"
              onClick={() => onShare?.(type, item.id as string)}
              aria-label={`Share ${title}`}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default GeneticsCard;
