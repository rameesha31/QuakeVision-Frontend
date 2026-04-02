import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6KdzZT0gl7XJMB-TO79ttgU5EgKF8Sqc",
  authDomain: "quakevision-f80bc.firebaseapp.com",
  projectId: "quakevision-f80bc",
  storageBucket: "quakevision-f80bc.appspot.com",
  messagingSenderId: "1066517075530",
  appId: "1:1066517075530:web:7de5ef97e48d4a5fccf8b3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);