// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvL-fpePt9h21U_EJ-FLE-9PWw_b0MEy4",
  authDomain: "appagiota.firebaseapp.com",
  projectId: "appagiota",
  storageBucket: "appagiota.firebasestorage.app",
  messagingSenderId: "289015782913",
  appId: "1:289015782913:web:c0a3f31511e89515c36a00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;