import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Button,
  Stack,
  CardActions,
  Box,
} from "@mui/material";
import CashAppBadge from "../assets/cashapp-badge.svg";
import { CurrencyBitcoin, AttachMoney } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

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
  };

  return (
    <Container maxWidth="sm">
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Payment Platforms
          </Typography>

          {paymentMethods.map((method) => (
            <Stack
              key={method.name}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {method.logo ? (
                  <img
                    src={method.logo}
                    alt={`${method.name} Logo`}
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
                sx={{ flexGrow: 1 }}
              />
            </Stack>
          ))}
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSave}
          >
            Save
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default PaymentsPage;
