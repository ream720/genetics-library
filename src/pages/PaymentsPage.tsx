import React, { useState } from "react";
import {
  Container,
  Typography,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Box,
  Grid,
  Button,
} from "@mui/material";

interface PaymentsPageProps {
  onSave: (methods: string[]) => void;
}

const paymentMethods: string[] = ["PayPal", "CashApp", "Crypto", "Cash"];

const PaymentsPage: React.FC<PaymentsPageProps> = ({ onSave }) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

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
      <Typography variant="h4" gutterBottom>
        Select Payment Methods
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            {paymentMethods.map((method) => (
              <Grid item xs={12} key={method}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedMethods.includes(method)}
                      onChange={() => handleCheckboxChange(method)}
                    />
                  }
                  label={method}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSave}
            >
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentsPage;
