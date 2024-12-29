import React, { useState } from "react";
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
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Payment Platforms
          </Typography>

          {paymentMethods.map((method) => (
            <Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMethods.includes(method)}
                    onChange={() => handleCheckboxChange(method)}
                  />
                }
                label={method}
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
