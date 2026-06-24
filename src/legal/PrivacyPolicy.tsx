import { Typography } from "@mui/material";
import LegalDocument, {
  LegalList,
  LegalSection,
  LegalSubheading,
} from "./LegalDocument";

const PrivacyPolicy = () => (
  <LegalDocument
    title="Privacy Policy"
    effectiveDate="Dec 01, 2024"
    description="How Genetics Library collects, uses, discloses, and safeguards information."
  >
    <LegalSection title="1. Introduction">
      <Typography variant="body1">
        Welcome to Genetics Library ("we", "us", or "our"). We respect your
        privacy and are committed to protecting your personal data. This Privacy
        Policy explains how we collect, use, disclose, and safeguard your
        information when you use our application and website.
      </Typography>
    </LegalSection>

    <LegalSection title="2. Information We Collect">
      <LegalSubheading>Personal Information:</LegalSubheading>
      <Typography variant="body1">
        When you sign up or use our services, we may collect personal
        information such as your name, email address, and any other data you
        voluntarily provide.
      </Typography>

      <LegalSubheading>Usage Data:</LegalSubheading>
      <Typography variant="body1">
        We may automatically collect information about how you interact with our
        app, including pages viewed, time spent on pages, and other usage
        details.
      </Typography>

      <LegalSubheading>Cookies and Tracking Technologies:</LegalSubheading>
      <Typography variant="body1">
        We use cookies and similar technologies to track activity on our app and
        hold certain information. You can control your cookie preferences
        through your browser settings.
      </Typography>
    </LegalSection>

    <LegalSection title="3. How We Use Your Information">
      <Typography variant="body1">We use the collected information to:</Typography>
      <LegalList>
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
          <Typography variant="body1">Comply with legal obligations.</Typography>
        </li>
        <li>
          <Typography variant="body1">Advertising.</Typography>
        </li>
      </LegalList>
    </LegalSection>

    <LegalSection title="4. Sharing Your Information">
      <Typography variant="body1">
        We do not sell or rent your personal information. We may share your data
        with:
      </Typography>

      <LegalSubheading>Service Providers:</LegalSubheading>
      <Typography variant="body1">
        Third-party vendors who assist in operating our app.
      </Typography>
      <Typography variant="body1">Advertisers.</Typography>

      <LegalSubheading>Legal Requirements:</LegalSubheading>
      <Typography variant="body1">
        When required by law or to protect our rights.
      </Typography>

      <LegalSubheading>Business Transfers:</LegalSubheading>
      <Typography variant="body1">
        In the event of a merger, acquisition, or sale of assets.
      </Typography>
    </LegalSection>

    <LegalSection title="5. Data Security">
      <Typography variant="body1">
        We implement a variety of security measures to maintain the safety of
        your personal information. However, no method of transmission over the
        Internet or electronic storage is 100% secure.
      </Typography>
    </LegalSection>

    <LegalSection title="6. Your Rights">
      <Typography variant="body1">
        Depending on your location, you may have the right to access, correct,
        or delete your personal data. You can contact us at
        genetics-library@gmail.com, or send a message using the "Support"
        section in the Dashboard to exercise these rights.
      </Typography>
    </LegalSection>

    <LegalSection title="7. Changes to This Privacy Policy">
      <Typography variant="body1">
        We may update this Privacy Policy periodically. Changes will be posted
        on this page with an updated effective date.
      </Typography>
    </LegalSection>

    <LegalSection title="8. Contact Us">
      <Typography variant="body1">
        If you have any questions about this Privacy Policy, please contact us
        at:
      </Typography>
      <Typography variant="body1">
        Email: genetics-library@gmail.com, or send a message using the "Support"
        section in the Dashboard.
      </Typography>
    </LegalSection>
  </LegalDocument>
);

export default PrivacyPolicy;
