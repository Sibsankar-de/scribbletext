import React, { createContext, useEffect, useState } from 'react'
import { socket } from '../server/socket.io';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    // get connected user list
    const [onlineUserList, setOnlineUserList] = useState(null);
    useEffect(() => {
        const handleSocket = async () => {
            socket.on("connectionList", (data) => {
                setOnlineUserList(data);
            })
        }
        handleSocket();
    })
    return (
        <SocketContext.Provider value={{ onlineUserList }}>
            {children}
        </SocketContext.Provider>
    )
}

export default SocketContext;