
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBjs7-NTQIL7ESTp73SZlzRNyUW0fdZuzA",
  authDomain: "urdu-d8113.firebaseapp.com",
  projectId: "urdu-d8113",
  storageBucket: "urdu-d8113.firebasestorage.app",
  messagingSenderId: "245446835150",
  appId: "1:245446835150:web:7ea5b9717b0a64f8c2c99f",
  measurementId: "G-JQNN2BGTFR",
  databaseURL: "https://urdu-d8113-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
