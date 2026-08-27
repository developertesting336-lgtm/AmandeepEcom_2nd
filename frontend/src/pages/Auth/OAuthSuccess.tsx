import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/authContext";

interface DecodedTokenPayload {
  _id?: string;
  id?: any;
  user?: any;
  sub?: string;
  userId?: string;
  name?: string;
  displayName?: string;
  username?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

const parseJwt = (token: string): DecodedTokenPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to parse JWT token:", err);
    return null;
  }
};

const OAuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const redirectUrl = searchParams.get("redirect");

    if (!token && !userParam) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      let user: any = {
        _id: "",
        name: "User",
        email: "",
        role: "user",
      };

      if (token) {
        const payload = parseJwt(token);
        const userObj =
          payload?.id && typeof payload.id === "object"
            ? payload.id
            : payload?.user && typeof payload.user === "object"
              ? payload.user
              : payload;

        user = {
          _id: userObj?._id || userObj?.id || userObj?.userId || userObj?.sub || (typeof payload?.id === "string" ? payload.id : ""),
          name:
            userObj?.name ||
            userObj?.displayName ||
            userObj?.username ||
            (userObj?.email ? userObj.email.split("@")[0] : "User"),
          email: userObj?.email || "",
          role: (userObj?.role as string) || "user",
          ...(typeof userObj === "object" ? userObj : {}),
        };
      }

      const userParam = searchParams.get("user");
      if (userParam) {
        try {
          const parsedUser = JSON.parse(userParam);
          user = { ...user, ...parsedUser };
        } catch {
          // ignore userParam parse error
        }
      }

      // Store auth session immediately
      login(user);

      // Direct immediate redirect
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Direct OAuth redirect error:", err);
      navigate("/login", { replace: true });
    }
  }, [searchParams, login, navigate]);

  return null;
};

export default OAuthSuccess;
