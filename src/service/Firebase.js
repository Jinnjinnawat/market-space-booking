// Import ฟังก์ชันหลักจาก Firebase SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ เพิ่มบรรทัดนี้

// Firebase configuration ของโปรเจกต์คุณ
const firebaseConfig = {
  apiKey: "AIzaSyASYEbW-YdV0Pccu4ufD8qzmOoRy0ODjUc",
  authDomain: "rentalmaket.firebaseapp.com",
  projectId: "rentalmaket",
  storageBucket: "rentalmaket.firebasestorage.app",
  messagingSenderId: "330360568491",
  appId: "1:330360568491:web:e41806ecf59703820515ee",
  measurementId: "G-EB5VQNXFRZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Export Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ✅ Export Firestore
export const db = getFirestore(app);

// ✅ Export Storage (แก้ให้ import ได้ใน PaymentPage)
export const storage = getStorage(app);
