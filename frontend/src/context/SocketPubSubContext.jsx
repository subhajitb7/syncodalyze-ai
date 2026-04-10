import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketPubSubContext = createContext();

export const SocketPubSubProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Storage for topic subscribers: topicName -> Set of callback functions
  const subscribers = useRef({});

  // Initialize Socket
  useEffect(() => {
    if (user && !socket) {
      const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5007' : `http://${window.location.hostname}:5007`;
      const s = io(SOCKET_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      s.on('connect', () => {
        setIsConnected(true);
        s.emit('join', user._id);
        
        // Re-join any active rooms tracked in subscribers
        Object.keys(subscribers.current).forEach(topic => {
          if (topic.startsWith('project:') || topic.startsWith('review:')) {
            s.emit('joinRoom', topic);
          }
        });
      });

      s.on('disconnect', () => {
        setIsConnected(false);
      });

      // Global Listener for Comments/Chat
      s.on('newComment', (data) => {
        let topicId = '';
        if (data.team) topicId = `team:${data.team}`;
        else if (data.project) topicId = `project:${data.project}`;
        else if (data.review) topicId = `review:${data.review}`;
        
        if (topicId && subscribers.current[topicId]) {
          subscribers.current[topicId].forEach(cb => cb({ type: 'NEW_MESSAGE', data }));
        }
      });

      // Typing Listeners
      s.on('userTyping', (data) => {
        const topicId = data.roomId;
        if (subscribers.current[topicId]) {
          subscribers.current[topicId].forEach(cb => cb({ type: 'TYPING_START', data }));
        }
      });

      s.on('userStopTyping', (data) => {
        const topicId = data.roomId;
        if (subscribers.current[topicId]) {
          subscribers.current[topicId].forEach(cb => cb({ type: 'TYPING_STOP', data }));
        }
      });

      setSocket(s);
    }

    return () => {
      if (socket && !user) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [user, socket]);

  // Pub/Sub API
  const subscribe = useCallback((topic, callback) => {
    if (!subscribers.current[topic]) {
      subscribers.current[topic] = new Set();
      if (socket && (topic.startsWith('project:') || topic.startsWith('review:'))) {
        socket.emit('joinRoom', topic);
      }
    }
    subscribers.current[topic].add(callback);

    // Unsubscribe function
    return () => {
      if (subscribers.current[topic]) {
        subscribers.current[topic].delete(callback);
        if (subscribers.current[topic].size === 0) {
          delete subscribers.current[topic];
          if (socket && (topic.startsWith('project:') || topic.startsWith('review:'))) {
            socket.emit('leaveRoom', topic);
          }
        }
      }
    };
  }, [socket]);

  const emitEvent = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  return (
    <SocketPubSubContext.Provider value={{ socket, isConnected, subscribe, emitEvent }}>
      {children}
    </SocketPubSubContext.Provider>
  );
};
