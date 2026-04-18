// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID,
};

type AppCheckDebugGlobal = typeof globalThis & {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

const appCheckSiteKey = import.meta.env
  .VITE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY;
const appCheckDebugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;

if (appCheckSiteKey) {
  if (import.meta.env.DEV && appCheckDebugToken) {
    (globalThis as AppCheckDebugGlobal).FIREBASE_APPCHECK_DEBUG_TOKEN =
      appCheckDebugToken === "true" ? true : appCheckDebugToken;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const analytics = getAnalytics(app);

// Helper function for logging events
export const logAnalyticsEvent = (eventName: string, eventParams = {}) => {
  logEvent(analytics, eventName, eventParams);
};

// Initialize Authentication
const googleProvider = new GoogleAuthProvider();
export { googleProvider };
export const auth = getAuth(app);
export const db = getFirestore(app);
