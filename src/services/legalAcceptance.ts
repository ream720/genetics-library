import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "../../firebaseConfig";
import {
  LEGAL_ACCEPTANCE_REQUIRED_MESSAGE,
  hasCurrentLegalAcceptance,
  readUserTermsAcceptance,
} from "../lib/legal";

const db = getFirestore(app);

export const assertUserCanWrite = async (uid: string) => {
  const userSnapshot = await getDoc(doc(db, "users", uid));
  const termsAcceptance = readUserTermsAcceptance(
    userSnapshot.data()?.termsAcceptance
  );

  if (!hasCurrentLegalAcceptance(termsAcceptance)) {
    throw new Error(LEGAL_ACCEPTANCE_REQUIRED_MESSAGE);
  }
};

export const assertCurrentUserCanWrite = async () => {
  const user = getAuth(app).currentUser;

  if (!user) {
    throw new Error("Sign in before making changes.");
  }

  await assertUserCanWrite(user.uid);
};
