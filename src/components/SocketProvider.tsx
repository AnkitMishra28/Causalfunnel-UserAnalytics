'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // In browser, connect to the socket.io server
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const socketIo = io(socketUrl, {
      transports: ['websocket'], // Prefer WebSocket transport for efficiency
      autoConnect: true,
    });

    socketIo.on('connect', () => {
      console.log('Socket.io connected:', socketIo.id);
      setConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setConnected(false);
    });

    setTimeout(() => {
      setSocket(socketIo);
    }, 0);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
