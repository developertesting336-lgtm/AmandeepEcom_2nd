import express from "express";
import googleOAuth2Client from "../config/google.js";
import { googleAuthLogin } from "../controllers/oAuth.js";
import { protect } from "../middlewares/auth.middleware.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import User from "../models/user.js";


// const generateToken = (userId) => {
//     return jwt.sign(
//         { id: userId },
//         process.env.JWT_SECRET,
//         {
//             expiresIn: "1d",
//         }
//     );
// };




const router = express.Router();

router.get("", (req, res) => {
    const authorizationUrl = googleOAuth2Client.generateAuthUrl({
        access_type: "offline",

        scope: [
            "openid",
            "profile",
            "email"
        ],

        prompt: "select_account",

        redirect_uri: process.env.GOOGLE_CALLBACK_URL
    });

    res.redirect(authorizationUrl);
});

router.get("/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Authorization code is missing"
            });
        }

        const { tokens } = await googleOAuth2Client.getToken(code);

        const ticket = await googleOAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const googleUser = ticket.getPayload();

        return googleAuthLogin(googleUser, res)

        // console.log("Google User:", googleUser);

    } catch (error) {
        console.error("Google OAuth Error:", error);

        return res.status(500).json({
            success: false,
            message: "Google authentication failed"
        });
    }
});

// router.get('/me', protect, (req, res) => {
//     return res.json({
//         success: true,
//         user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             profileImage: user.profileImage,
//             authProvider: user.authProvider,
//             isEmailVerified: user.isEmailVerified
//         }
//     });
// })


export default router;