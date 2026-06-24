import { Typography } from "@mui/material";
import LegalDocument, {
  LegalList,
  LegalSection,
  LegalSubheading,
} from "./LegalDocument";

const TermsOfService = () => (
  <LegalDocument
    title="Terms of Service"
    effectiveDate="Dec 01, 2024"
    description="The terms that govern access to and use of Genetics Library."
  >
    <LegalSection title="1. Acceptance of Terms">
      <Typography variant="body1">
        By accessing or using Genetics Library ("the App"), you agree to be
        bound by these Terms of Service ("Terms"). If you do not agree, please
        do not use our App.
      </Typography>
    </LegalSection>

    <LegalSection title="2. Use of the App">
      <LegalSubheading>Eligibility:</LegalSubheading>
      <Typography variant="body1">
        You must be at least 18 years old to use this App.
      </Typography>

      <LegalSubheading>Account Responsibility:</LegalSubheading>
      <Typography variant="body1">
        If you create an account, you are responsible for maintaining the
        confidentiality of your account information and for all activities that
        occur under your account.
      </Typography>

      <LegalSubheading>Prohibited Activities:</LegalSubheading>
      <Typography variant="body1">
        You agree not to use the App for any unlawful or unauthorized purpose,
        including but not limited to:
      </Typography>
      <LegalList>
        <li>
          <Typography variant="body1">Violating any laws or regulations.</Typography>
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
      </LegalList>
    </LegalSection>

    <LegalSection title="3. Intellectual Property">
      <Typography variant="body1">
        All content on this App, including text, graphics, logos, and software,
        is the property of Genetics Library or its content suppliers and is
        protected by copyright and intellectual property laws.
      </Typography>
    </LegalSection>

    <LegalSection title="4. Disclaimers and Limitation of Liability">
      <LegalSubheading>Disclaimer of Warranties:</LegalSubheading>
      <Typography variant="body1">
        The App is provided "as is" and "as available" without any warranties,
        either express or implied.
      </Typography>

      <LegalSubheading>Limitation of Liability:</LegalSubheading>
      <Typography variant="body1">
        In no event shall Genetics Library be liable for any indirect,
        incidental, special, consequential, or punitive damages arising from
        your use of the App.
      </Typography>
    </LegalSection>

    <LegalSection title="5. Changes to Terms">
      <Typography variant="body1">
        We reserve the right to update these Terms at any time. Changes will be
        posted on this page, and your continued use of the App after any changes
        constitutes your acceptance of the new Terms.
      </Typography>
    </LegalSection>

    <LegalSection title="6. Termination">
      <Typography variant="body1">
        We may terminate or suspend your access to the App immediately, without
        prior notice, if you breach these Terms or for any other reason.
      </Typography>
    </LegalSection>

    <LegalSection title="7. Governing Law">
      <Typography variant="body1">
        These Terms are governed by and construed in accordance with the laws of
        Delaware and you agree to submit to the exclusive jurisdiction. Any
        disputes relating to these Terms will be resolved in the courts of
        Delaware.
      </Typography>
    </LegalSection>

    <LegalSection title="8. Contact Us">
      <Typography variant="body1">
        For any questions about these Terms, please contact us at:
      </Typography>
      <Typography variant="body1">
        Email: genetics-library@gmail.com or submit a message under the Support
        section of the Dashboard.
      </Typography>
    </LegalSection>
  </LegalDocument>
);

export default TermsOfService;
