import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../authentication/AuthContext";
import io from 'socket.io-client'

export const SocketContext = React.createContext();


export function SocketProvider({ children }) {
  const {currentUser} = useAuth();

  const [socket, setSocket] = useState({}) 

  useEffect(() => {
    if (currentUser) {
      //console.log("user in");
      const newSocket = io("http://localhost:5000", {
        query: { email: currentUser.email },
      });
      setSocket(newSocket);
      //console.log(newSocket);
      return () => newSocket.close();
    }
  }, [currentUser]);



  return (
    <SocketContext.Provider value={[socket, setSocket]}>
      {children}
    </SocketContext.Provider>
  );
}