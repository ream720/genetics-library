import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { AttachMoney, CurrencyBitcoin } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CashAppBadge from "../assets/cashapp-badge.svg";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";
import { db } from "../../firebaseConfig";

interface PaymentsPageProps {
  onSave: (methods: string[]) => Promise<void> | void;
  currentUser?: { uid: string };
}

interface PaymentMethod {
  name: string;
  logo?: string;
  icon?: ReactNode;
}

const paymentMethods: PaymentMethod[] = [
  {
    name: "PayPal",
    logo: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg",
  },
  { name: "CashApp", logo: CashAppBadge },
  { name: "Crypto", icon: <CurrencyBitcoin /> },
  { name: "Cash", icon: <AttachMoney /> },
];

const PaymentsPage = ({ onSave, currentUser }: PaymentsPageProps) => {
  const navigate = useNavigate();
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPaymentMethods = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!isMounted) {
          return;
        }

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (Array.isArray(data.paymentMethods)) {
            setSelectedMethods(data.paymentMethods);
          }
        }
      } catch (fetchError) {
        console.error("Error loading payment methods:", fetchError);
        if (isMounted) {
          setError("Failed to load payment platforms. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPaymentMethods();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleCheckboxChange = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((savedMethod) => savedMethod !== method)
        : [...prev, method]
    );
  };

  const handleSave = async () => {
    try {
      setError("");
      setIsSaving(true);
      await onSave(selectedMethods);
      navigate("/dashboard");
    } catch (saveError) {
      console.error("Error saving payment methods:", saveError);
      setError("Failed to save payment platforms. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Account details"
          title="Payment platforms"
          description="Choose the payment methods shown on your public profile."
          backLabel="Back to dashboard"
          onBack={() => navigate("/dashboard")}
        />

        <SectionCard
          title="Accepted payment methods"
          description="These appear on your public profile so other users know which payment platforms you accept."
          action={
            <Chip
              label={`${selectedMethods.length} selected`}
              variant="outlined"
              color={selectedMethods.length ? "primary" : "default"}
            />
          }
        >
          <Stack spacing={1.5}>
            {error && <Alert severity="error">{error}</Alert>}

            {isLoading ? (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minHeight: 88 }}
              >
                <CircularProgress size={22} />
                <Typography color="text.secondary">
                  Loading payment platforms...
                </Typography>
              </Stack>
            ) : (
              paymentMethods.map((method) => {
                const checked = selectedMethods.includes(method.name);

                return (
                  <Stack
                    key={method.name}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={(theme) => ({
                      minHeight: 64,
                      px: 1.5,
                      borderRadius: 3,
                      bgcolor: checked
                        ? theme.palette.action.selected
                        : theme.palette.surface.subtle,
                      border: 1,
                      borderColor: checked ? "primary.main" : "transparent",
                    })}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2.5,
                        p: 0.75,
                        bgcolor: "background.paper",
                        color: "text.secondary",
                      }}
                    >
                      {method.logo ? (
                        <img
                          src={method.logo}
                          alt={`${method.name} logo`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        method.icon
                      )}
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={() => handleCheckboxChange(method.name)}
                          inputProps={{
                            "aria-label": `Show ${method.name} on public profile`,
                          }}
                        />
                      }
                      label={method.name}
                      sx={{
                        flexGrow: 1,
                        m: 0,
                        "& .MuiFormControlLabel-label": {
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Stack>
                );
              })
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
              disabled={isLoading || isSaving}
              sx={{ mt: 1 }}
            >
              {isSaving ? "Saving..." : "Save payment platforms"}
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </PageContainer>
  );
};

export default PaymentsPage;
