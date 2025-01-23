import './App.css';
import './css/root.css';
import './css/utils.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'remixicon/fonts/remixicon.css';
import 'react-toastify/dist/ReactToastify.css';

import { useEffect, useState } from 'react';
import axios from './server/axios-setup';
import { ToastContainer } from 'react-toastify';
import { AppRoutes } from './routes/App.routes';
import { useCurrentUser } from './hooks/get-currentuser';
import { socket } from './server/socket.io';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser();
  // create a socket connection
  useEffect(() => {
    const connectSocketId = async () => {
      socket.emit("setUserId", { userId: currentUser?._id });
    }
    if (currentUser) connectSocketId();
  }, [currentUser]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (window.location.pathname.includes("/chats/")) {
        if (event.key === "Escape") {
          navigate("/home");
        }
      }
    }
    document.addEventListener("keypress", handleEsc);
  })

  // initialize push notification
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array(rawData.length).map((_, i) => rawData.charCodeAt(i));
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY),
      });
  
      await axios.post('/users/notification-subscription', { subscription });
    } catch (error) {
      console.error("Failed to subscribe the user: ", error);
    }
  }
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      subscribeUser();
    } else {
      console.error("Push notifications are not supported in your browser.");
    }
  }, []);

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position='top-center'
        autoClose={5000}
        hideProgressBar={true}
        closeOnClick={true}
        draggable={true}
        theme='dark'
      />
    </>
  )
}

export default App;
