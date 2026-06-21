import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactNode } from "react";

interface ResponsiveDialogProps
  extends Omit<DialogProps, "title" | "children"> {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

const ResponsiveDialog = ({
  title,
  children,
  actions,
  maxWidth = "sm",
  ...props
}: ResponsiveDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      {...props}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        sx: fullScreen
          ? {
              border: 0,
              borderRadius: 0,
              m: 0,
              maxHeight: "100dvh",
            }
          : undefined,
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ overflowY: "auto" }}>{children}</DialogContent>
      {actions && (
        <DialogActions
          sx={
            fullScreen
              ? {
                  position: "sticky",
                  bottom: 0,
                  zIndex: 2,
                  bgcolor: "background.paper",
                  pb: "max(16px, env(safe-area-inset-bottom))",
                }
              : undefined
          }
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ResponsiveDialog;

