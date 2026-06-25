import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQ_219wvs3QZ9g1ikAg1ayiKKmGF2A79Y",
  authDomain: "betyouscan.firebaseapp.com",
  projectId: "betyouscan",
  storageBucket: "betyouscan.firebasestorage.app",
  messagingSenderId: "924136716423",
  appId: "1:924136716423:web:e9568c68fbbcba063a6022"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;