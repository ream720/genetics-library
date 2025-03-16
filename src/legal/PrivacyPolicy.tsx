// src/pages/PrivacyPolicy.tsx
import React from "react";
import { Box, Typography, Container } from "@mui/material";

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        {/* Header */}
        <Typography variant="h3" align="center" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Effective Date: Dec 01, 2024
        </Typography>

        {/* Section 1: Introduction */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to Genetics Library ("we", "us", or "our"). We respect your
            privacy and are committed to protecting your personal data. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our application and website.
          </Typography>
        </Box>

        {/* Section 2: Information We Collect */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Information We Collect
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Personal Information:
          </Typography>
          <Typography variant="body1" paragraph>
            When you sign up or use our services, we may collect personal
            information such as your name, email address, and any other data you
            voluntarily provide.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Usage Data:
          </Typography>
          <Typography variant="body1" paragraph>
            We may automatically collect information about how you interact with
            our app, including pages viewed, time spent on pages, and other usage
            details.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Cookies and Tracking Technologies:
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar technologies to track activity on our app
            and hold certain information. You can control your cookie preferences
            through your browser settings.
          </Typography>
        </Box>

        {/* Section 3: How We Use Your Information */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the collected information to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1">
                Provide, operate, and maintain our app.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Improve, personalize, and expand our services.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Understand and analyze how you use our app.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Communicate with you (e.g., updates, security alerts, support).
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Comply with legal obligations.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Advertising.
              </Typography>
            </li>
          </Box>
        </Box>

        {/* Section 4: Sharing Your Information */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Sharing Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell or rent your personal information. We may share your
            data with:
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Service Providers:
          </Typography>
          <Typography variant="body1" paragraph>
            Third-party vendors who assist in operating our app.
          </Typography>
          <Typography variant="body1" paragraph>
            Advertisors.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Legal Requirements:
          </Typography>
          <Typography variant="body1" paragraph>
            When required by law or to protect our rights.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Business Transfers:
          </Typography>
          <Typography variant="body1" paragraph>
            In the event of a merger, acquisition, or sale of assets.
          </Typography>
        </Box>

        {/* Section 5: Data Security */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement a variety of security measures to maintain the safety of
            your personal information. However, no method of transmission over
            the Internet or electronic storage is 100% secure.
          </Typography>
        </Box>

        {/* Section 6: Your Rights */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            Depending on your location, you may have the right to access, correct,
            or delete your personal data. You can contact us at genetics-library@gmail.com, or send a message
            using the "Support" section in the Dashboard to exercise these rights.
          </Typography>
        </Box>

        {/* Section 7: Changes to This Privacy Policy */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Changes to This Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy periodically. Changes will be
            posted on this page with an updated effective date.
          </Typography>
        </Box>

        {/* Section 8: Contact Us */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: genetics-library@gmail.com, or send a message
            using the "Support" section in the Dashboard.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy;
