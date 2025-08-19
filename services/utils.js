import jwt from 'jsonwebtoken';
import { User } from "../models/User.js";

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const verifyToken = async (token) => {
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user from the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

export { generateUniqueId, verifyToken };
