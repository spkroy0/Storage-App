// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAd0e5Ry5a8-8NsKP5hnDKai8vmkNee2m0",
  authDomain: "my-drive-d711a.firebaseapp.com",
  projectId: "my-drive-d711a",
  storageBucket: "my-drive-d711a.firebasestorage.app",
  messagingSenderId: "39929995149",
  appId: "1:39929995149:web:228706097af59885ff67c4",
  measurementId: "G-ZK9RE0RL07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
