import { Chip, ChipProps } from "@mui/material";

type Status = "planning" | "in_progress" | "complete";

const labels: Record<Status, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  complete: "Complete",
};

interface StatusChipProps extends Omit<ChipProps, "label" | "color"> {
  status: Status;
}

const StatusChip = ({ status, sx, ...props }: StatusChipProps) => (
  <Chip
    {...props}
    label={labels[status]}
    size="small"
    variant={status === "planning" ? "outlined" : "filled"}
    sx={(theme) => {
      const color =
        status === "complete"
          ? theme.palette.status.complete
          : status === "in_progress"
            ? theme.palette.status.inProgress
            : theme.palette.status.planning;

      return {
        color:
          status === "planning"
            ? color
            : theme.palette.getContrastText(color),
        bgcolor: status === "planning" ? "transparent" : color,
        borderColor: color,
        ...((typeof sx === "object" && sx) || {}),
      };
    }}
  />
);

export default StatusChip;

