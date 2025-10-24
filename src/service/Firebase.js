// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASYEbW-YdV0Pccu4ufD8qzmOoRy0ODjUc",
  authDomain: "rentalmaket.firebaseapp.com",
  projectId: "rentalmaket",
  storageBucket: "rentalmaket.firebasestorage.app",
  messagingSenderId: "330360568491",
  appId: "1:330360568491:web:e41806ecf59703820515ee",
  measurementId: "G-EB5VQNXFRZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();