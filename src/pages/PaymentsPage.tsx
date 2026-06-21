import React, { useState, useEffect } from "react";
import {
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Box,
} from "@mui/material";
import CashAppBadge from "../assets/cashapp-badge.svg";
import { CurrencyBitcoin, AttachMoney } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

interface PaymentsPageProps {
  onSave: (methods: string[]) => void;
  currentUser?: { uid: string }; // Optional currentUser prop
}

interface PaymentMethod {
  name: string;
  logo?: string; // URL of the logo
  icon?: React.ReactNode; // React component for the icon
}

const paymentMethods: PaymentMethod[] = [
  {
    name: "PayPal",
    logo: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg",
  },
  { name: "CashApp", logo: CashAppBadge }, // Local SVG
  { name: "Crypto", icon: <CurrencyBitcoin fontSize="large" /> }, // Material UI icon
  { name: "Cash", icon: <AttachMoney fontSize="large" /> }, // Material UI icon
];

const PaymentsPage: React.FC<PaymentsPageProps> = ({ onSave, currentUser }) => {
  const navigate = useNavigate();
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!currentUser) return; // Ensure currentUser exists before proceeding

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.paymentMethods) {
          setSelectedMethods(data.paymentMethods); // Pre-select saved methods
        }
      }
    };

    fetchPaymentMethods();
  }, [currentUser]);

  const handleCheckboxChange = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const handleSave = () => {
    onSave(selectedMethods);
    navigate("/dashboard");
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
        <SectionCard>
          <Stack spacing={1.5}>
            {paymentMethods.map((method) => (
              <Stack
                key={method.name}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={(theme) => ({
                  minHeight: 58,
                  px: 1.5,
                  borderRadius: 3,
                  bgcolor: theme.palette.surface.subtle,
                })}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: "grid",
                    placeItems: "center",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2.5,
                    p: 0.75,
                    bgcolor: "background.paper",
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
                      checked={selectedMethods.includes(method.name)}
                      onChange={() => handleCheckboxChange(method.name)}
                    />
                  }
                  label={method.name}
                  sx={{ flexGrow: 1, m: 0 }}
                />
              </Stack>
            ))}
            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
              sx={{ mt: 1 }}
            >
              Save payment platforms
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </PageContainer>
  );
};

export default PaymentsPage;
