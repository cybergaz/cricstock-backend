import jwt from 'jsonwebtoken';
import { updateUserLastSeen } from '../services/actions.js';

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // let token;
    // // Check Authorization header
    // const authHeader = req.header("Authorization");
    // if (authHeader && authHeader.startsWith("Bearer ")) {
    //   token = authHeader.split(" ")[1];
    // }

    // If not in header, check cookies
    // if (!token && req.cookies && req.cookies.token) {
    //   token = req.cookies.token;
    // }
    console.log(token)
    console.log("----------------------------------------------------------")
    // if (!token) {
    //   return res.status(401).json({ message: "Access denied. No token provided." });
    // }

    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token, authentication failed." });
    }

    req.user = decoded; // Attach decoded user data to request
    await updateUserLastSeen(decoded.userId)

    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
