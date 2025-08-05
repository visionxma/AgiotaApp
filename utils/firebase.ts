// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvL-fpePt9h21U_EJ-FLE-9PWw_b0MEy4",
  authDomain: "appagiota.firebaseapp.com",
  projectId: "appagiota",
  storageBucket: "appagiota.firebasestorage.app",
  messagingSenderId: "289015782913",
  appId: "1:289015782913:web:c0a3f31511e89515c36a00",
  measurementId: "G-G7K1SGSV73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Only initialize analytics in production and when window is available
let analytics;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app);
}

export { auth, db, analytics };
export default app;