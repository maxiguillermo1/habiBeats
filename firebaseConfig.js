// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKiwDZKKfj-dd8ADHxgj7z4ra9cSeCSig",
  authDomain: "habibeats-app.firebaseapp.com",
  projectId: "habibeats-app",
  storageBucket: "habibeats-app.appspot.com",
  messagingSenderId: "245879207190",
  appId: "1:245879207190:web:f521d59cb0e94317948c37",
  measurementId: "G-HX3QPWLPC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(app);

// check if email is in firestore
// const checkEmailInFirestore = async (email) => {
//   const db = getFirestore(app);
//   const usersCollection = collection(db, 'users');
//   const q = query(usersCollection, where('email', '==', email));

//   const querySnapshot = await getDocs(q);
//   return !querySnapshot.empty;
// }



export { app, auth, db, storage };


