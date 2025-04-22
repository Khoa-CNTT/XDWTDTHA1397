import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// TODO: Thay thế bằng cấu hình Firebase project của bạn
// Bạn có thể lấy các giá trị này từ Firebase Console:
// Project settings > General > Your apps > Web app > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSSPBo1xMEqjPlsmscoXvAPat2rNR1s-M",
  authDomain: "zalo-app-66612.firebaseapp.com",
  databaseURL: "https://zalo-app-66612-default-rtdb.firebaseio.com",
  projectId: "zalo-app-66612",
  storageBucket: "zalo-app-66612.appspot.com",
  messagingSenderId: "1075698897426",
  appId: "1:1075698897426:web:4e8536e451ed77a0767ecb",
  measurementId: "G-3C42XLGJ3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

export { storage }; 