import firebase from "firebase/compat/app";
import "firebase/compat/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBdD1dImwiNRk7cUypendUncQtnmxncqTc",
  authDomain: "productivity-conference-app.firebaseapp.com",
  projectId: "productivity-conference-app",
  storageBucket: "productivity-conference-app.appspot.com",
  messagingSenderId: "371013941162",
  appId: "1:371013941162:web:f397c6f4ef7e889bf4ddd3",
};

const app = firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export default app;
