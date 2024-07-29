// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjaogUgMfPtFFWpflEg8b1NEiME4VNJXM",
  authDomain: "web-notify-79345.firebaseapp.com",
  projectId: "web-notify-79345",
  storageBucket: "web-notify-79345.appspot.com",
  messagingSenderId: "508414407220",
  appId: "1:508414407220:web:0bb72c9fcd39c3f5cc9061",
  measurementId: "G-4Q14PWXQTK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app)

export {db}