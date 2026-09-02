import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  try {
    // let token;

    const getToken = (req) => {
      // 1. Check HTTP-only cookie
      if (req.cookies?.token) {
        return req.cookies.token;
      }

      // 2. Check Authorization header
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
      }

      return null;
    };


    const token = getToken(req);

    // console.log("token", token)




    // if (
    //   req.headers.authorization &&
    //   req.headers.authorization.startsWith("Bearer ")
    // ) {
    //   token = req.headers.authorization.split(" ")[1];
    // }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decoded)


    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export async function optionalAuth(req, res, next) {
  const getToken = (req) => {
    // 1. Check HTTP-only cookie
    if (req.cookies?.token) {
      return req.cookies.token;
    }

    // 2. Check Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    return null;
  };


  const token = getToken(req);


  if (!token) {
    req.user = null; // guest — proceed anyway
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    req.user = user
    // console.log(req.user)
  } catch (err) {
    req.user = null; // invalid/expired token — treat as guest, don't block
  }

  next();
}