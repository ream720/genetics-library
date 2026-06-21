import React, { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import AppShell from "./components/layout/AppShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CloneProvider } from "./context/CloneContext";
import { ColorModeProvider } from "./context/ColorModeContext";
import { SeedProvider } from "./context/SeedContext";
import { UnsavedChangesProvider } from "./context/UnsavedChangesProvider";
import { db } from "../firebaseConfig";

const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const PrivacyPolicy = lazy(() => import("./legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./legal/TermsOfService"));
const ClonesPage = lazy(() => import("./pages/ClonesPage"));
const ContactInfo = lazy(() => import("./pages/ContactInfo"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectAnalyticsPage = lazy(
  () => import("./pages/ProjectAnalyticsPage")
);
const ProjectCreatePage = lazy(() => import("./pages/ProjectCreatePage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SeedsPage = lazy(() => import("./pages/SeedsPage"));

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  return currentUser?.username ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} />
  );
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  const savePaymentOptions = async (methods: string[]) => {
    if (!currentUser) {
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { paymentMethods: methods }, { merge: true });
    } catch (error) {
      console.error("Error saving payment methods:", error);
    }
  };

  return (
    <AppShell>
      <Suspense
        fallback={
          <Box
            role="status"
            aria-label="Loading page"
            sx={{
              minHeight: "45vh",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress size={34} />
          </Box>
        }
      >
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/seeds"
          element={
            <PrivateRoute>
              <SeedsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clones"
          element={
            <PrivateRoute>
              <ClonesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <PaymentsPage
                onSave={savePaymentOptions}
                currentUser={currentUser || undefined}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/contact-info"
          element={
            <PrivateRoute>
              <ContactInfo />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <ProjectsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <ProjectCreatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId/analytics"
          element={
            <PrivateRoute>
              <ProjectAnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/project-analytics"
          element={
            <PrivateRoute>
              <ProjectAnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

const App = () => (
  <Router>
    <ColorModeProvider>
      <AuthProvider>
        <SeedProvider>
          <CloneProvider>
            <UnsavedChangesProvider>
              <AppRoutes />
            </UnsavedChangesProvider>
          </CloneProvider>
        </SeedProvider>
      </AuthProvider>
    </ColorModeProvider>
  </Router>
);

export default App;
