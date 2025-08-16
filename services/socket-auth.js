import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Socket authentication middleware
 * @param {Socket} socket - The socket instance
 * @param {Function} next - Next function to call
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = null;
    
    // Check handshake auth data first
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }
    
    // Check cookies if no token in handshake auth
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      console.log('Socket auth: No token found in handshake auth or cookies');
      console.log('Handshake auth:', socket.handshake.auth);
      console.log('Cookies:', socket.handshake.headers.cookie);
      return next(new Error('Authentication token not provided'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid authentication token'));
    }
    
    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Attach user data to socket
    socket.userId = decoded.userId;
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication failed'));
  }
};

export default socketAuthMiddleware; 