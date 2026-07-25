import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// আপনার ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyAd0e5Ry5a8-8NsKP5hnDKai8vmkNee2m0",
  authDomain: "my-drive-d711a.firebaseapp.com",
  projectId: "my-drive-d711a",
  storageBucket: "my-drive-d711a.firebasestorage.app",
  messagingSenderId: "39929995149",
  appId: "1:39929995149:web:228706097af59885ff67c4",
  measurementId: "G-ZK9RE0RL07"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);

// প্রয়োজনীয় মডিউলসমূহ Export করা
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
