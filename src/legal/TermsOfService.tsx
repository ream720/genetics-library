// src/pages/TermsOfService.tsx
import React from "react";
import { Box, Typography, Container } from "@mui/material";

const TermsOfService: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        {/* Header */}
        <Typography variant="h3" align="center" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Effective Date: Dec 01, 2024
        </Typography>

        {/* Section 1 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using Genetics Library ("the App"), you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree, please
            do not use our App.
          </Typography>
        </Box>

        {/* Section 2 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Use of the App
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Eligibility:
          </Typography>
          <Typography variant="body1" paragraph>
            You must be at least 18 years old to use this App.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Account Responsibility:
          </Typography>
          <Typography variant="body1" paragraph>
            If you create an account, you are responsible for maintaining the
            confidentiality of your account information and for all activities
            that occur under your account.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Prohibited Activities:
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to use the App for any unlawful or unauthorized purpose,
            including but not limited to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1">
                Violating any laws or regulations.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Infringing on intellectual property rights.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Distributing malware or harmful content.
              </Typography>
            </li>
          </Box>
        </Box>

        {/* Section 3 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            All content on this App, including text, graphics, logos, and software,
            is the property of Genetics Library or its content suppliers and is
            protected by copyright and intellectual property laws.
          </Typography>
        </Box>

        {/* Section 4 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Disclaimers and Limitation of Liability
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Disclaimer of Warranties:
          </Typography>
          <Typography variant="body1" paragraph>
            The App is provided "as is" and "as available" without any warranties,
            either express or implied.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Limitation of Liability:
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall Genetics Library be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from
            your use of the App.
          </Typography>
        </Box>

        {/* Section 5 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to update these Terms at any time. Changes will
            be posted on this page, and your continued use of the App after any
            changes constitutes your acceptance of the new Terms.
          </Typography>
        </Box>

        {/* Section 6 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We may terminate or suspend your access to the App immediately,
            without prior notice, if you breach these Terms or for any other reason.
          </Typography>
        </Box>

        {/* Section 7 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms are governed by and construed in accordance with the laws
            of Delaware and you agree to submit to the exclusive jurisdiction. Any disputes relating to these Terms will be
            resolved in the courts of Delaware.
          </Typography>
        </Box>

        {/* Section 8 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            For any questions about these Terms, please contact us at:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: genetics-library@gmail.com or submit a message under the Support section of the Dashboard.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default TermsOfService;
