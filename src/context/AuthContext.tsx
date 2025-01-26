import {
  User,
  updateProfile,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { auth, db, googleProvider } from "../../firebaseConfig";
import { UsernameAlreadyInUseError } from "../errors/UsernameAlreadyInUserError";

interface ExtendedUser extends User {
  username?: string;
}

interface AuthContextProps {
  currentUser: ExtendedUser | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    username: string
  ) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<{ requiresProfile: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  completeGoogleSignup: (username: string) => Promise<void>;
  updateUserProfile: (photoURL: string) => Promise<void>; // Add this line
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if username exists
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("userNameLower", "==", username.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Sign up function
  const signup = async (
    email: string,
    password: string,
    username: string
  ): Promise<UserCredential> => {
    if (await checkUsernameExists(username)) {
      throw new UsernameAlreadyInUseError("Username already exists");
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username,
      userNameLower: username.toLowerCase(),
    });

    return userCredential;
  };

  // Complete Google signup by adding username
  const completeGoogleSignup = async (username: string) => {
    if (!auth.currentUser) {
      throw new Error("No user signed in");
    }

    if (await checkUsernameExists(username)) {
      throw new UsernameAlreadyInUseError("Username already exists");
    }

    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        email: auth.currentUser.email,
        username,
        userNameLower: username.toLowerCase(),
      },
      { merge: true }
    );

    setCurrentUser((prev) =>
      prev ? ({ ...prev, username } as ExtendedUser) : null
    );
  };

  // Enhanced Google sign-in
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    return {
      requiresProfile: !userDoc.exists() || !userDoc.data()?.username,
    };
  };

  // Login function
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Monitor authentication state and fetch additional user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setCurrentUser({
            ...user,
            username: userDoc.data().username,
          } as ExtendedUser);
        } else {
          setCurrentUser(user as ExtendedUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateUserProfile = async (photoURL: string) => {
    if (!auth.currentUser) {
      throw new Error("No user signed in");
    }

    // Use the imported updateProfile function
    await updateProfile(auth.currentUser, { photoURL });

    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      { photoURL },
      { merge: true }
    );

    setCurrentUser((prev) =>
      prev ? ({ ...prev, photoURL } as ExtendedUser) : null
    );
  };

  const value: AuthContextProps = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    completeGoogleSignup,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
