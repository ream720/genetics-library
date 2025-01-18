import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  signInWithPopup,
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
  signInWithGoogle: () => Promise<void>;
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
    password: string,
    username: string
  ): Promise<UserCredential> => {
    // 1. Check if username already exists
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("userNameLower", "==", username.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new UsernameAlreadyInUseError("Username already exists");
    }

    // 2. If username is unique, create the user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 3. Save user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username,
      userNameLower: username.toLowerCase(),
    });

    return userCredential;
  };

  // Login function
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider).then(() => {});
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

  const value: AuthContextProps = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
