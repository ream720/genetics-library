import {
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface LegalAgreementCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const LegalAgreementCheckbox = ({
  checked,
  disabled,
  onChange,
}: LegalAgreementCheckboxProps) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={checked}
        disabled={disabled}
        required
        onChange={(event) => onChange(event.target.checked)}
      />
    }
    label={
      <Typography variant="body2" color="text.secondary">
        I agree to the{" "}
        <MuiLink
          component={RouterLink}
          to="/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </MuiLink>{" "}
        and{" "}
        <MuiLink
          component={RouterLink}
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </MuiLink>
        .
      </Typography>
    }
    sx={{
      alignItems: "flex-start",
      m: 0,
      "& .MuiCheckbox-root": {
        mt: -0.75,
      },
    }}
  />
);

export default LegalAgreementCheckbox;
