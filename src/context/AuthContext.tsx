import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { getDoc, doc, setDoc } from "firebase/firestore";
import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { auth, db } from "../../firebaseConfig";

interface ExtendedUser extends User {
  username?: string; // Add username as an optional property
}

interface AuthContextProps {
  currentUser: ExtendedUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Sign up function
  const signup = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: "", // Default username; you can customize this
    });

    return userCredential;
  };

  // Login function
  const login = async (email: string, password: string) => {
    console.log("Attempting to log in...");
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
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
            username: userDoc.data().username, // Add Firestore username to the user object
          } as ExtendedUser);
        } else {
          setCurrentUser(user as ExtendedUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextProps = {
    currentUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
