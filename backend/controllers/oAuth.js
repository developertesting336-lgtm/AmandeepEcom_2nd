import express from "express";
// import googleOAuth2Client from "../config/google.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";


const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};



export const googleAuthLogin = async (googleUser, res) => {
    try {
        const {
            sub: googleId,
            email,
            email_verified,
            name,
        } = googleUser;

        // console.log("hitted google auth contoller for login")

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Google email not found"
            });
        }

        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: "Google email is not verified"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let user = await User.findOne({
            $or: [
                { googleId },
                { email: normalizedEmail }
            ]
        });

        if (!user) {
            // New Google user
            user = await User.create({
                name,
                email: normalizedEmail,
                googleId,
                isEmailVerified: true,
                authProvider: "google"
            });
        } else {
            // Existing user
            if (!user.googleId) {
                user.googleId = googleId;
            }

            user.isEmailVerified = true;


            await user.save();
        }

        const token = generateToken(user);

        // Detect environment
        const isProduction = process.env.NODE_ENV === "production";

        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: 1 * 24 * 60 * 60 * 1000,
        });


        return res.redirect(
            `${process.env.FRONTEND_URL}/oauth-success?token=${token}`
        );

        // return res.json({
        //     success: true,
        //     message: "Google authentication successful",
        //     token,
        //     user: {
        //         id: user._id,
        //         name: user.name,
        //         email: user.email,
        //         authProvider: user.authProvider,
        //         isEmailVerified: user.isEmailVerified
        //     }
        // });

    } catch (error) {
        console.error("Google Auth Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};