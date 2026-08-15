import { User } from "../Model/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OTP_gen } from "../utils/OTP_Generator.js";
import { sendOTPEmail } from "../Mailer/MailSender.js";
import { generateAccessToken, generateRefreshToken } from "../utils/Tokenization.js";

export const registerUser = async (req, res) => {
    try {
        const { firstname, lastname, email, password, phno } = req.body;
        const userExists = await User.findOne({ email });
        const phoneExists = await User.findOne({ phno });
        if (phoneExists) return res.status(400).json({ message: "User with that Phone Number Already in Database!" });
        if (!firstname.match(/^[a-zA-Z\s]+$/)) return res.status(400).json({ message: "Invalid Firstname!" });
        if (lastname && !lastname.match(/^[a-zA-Z\s]+$/)) return res.status(400).json({ message: "Invalid Lastname!" });
        if (!phno.match(/^\+?\d{10,15}$/)) return res.status(400).json({ message: "Invalid Phone Number!" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be 6 characters long!" });
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/))
            return res.status(400).json({ message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character!" });
        if (!email.endsWith("@gmail.com")) return res.status(400).json({ message: "Invalid Email" });
        if (userExists) return res.status(400).json({ message: "User Already in Database!" });

        const HashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, firstname, lastname, password: HashedPassword, phno });

        const otp = OTP_gen();
        user.otp = otp;
        user.otp_expiry = Date.now() + 5 * 60 * 1000;
        await user.save();
        await sendOTPEmail(email, otp);

        return res.status(200).json({ success: true, user, message: "User Registered Successfully!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const Loginuser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found please register first!" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid Credentials!" });
        if (!user.isverified) return res.status(401).json({ message: "Please verify Your email first!", verified: false, email: user.email });
        if (!user.isActive) return res.status(403).json({ message: "Your account is not active.", active: false });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        
        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "User Logged in Successfully!",
            accessToken,
            user,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ success: false, message: "No refresh token provided." });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                
                const expiredDecoded = jwt.decode(token);
                if (expiredDecoded?.id) {
                    await User.findByIdAndUpdate(expiredDecoded.id, {
                        refreshToken: null,
                        refreshTokenExpiry: null
                    });
                }
                return res.status(403).json({
                    success: false,
                    message: "Refresh token expired. Please login again.",
                });
            }
            return res.status(403).json({ success: false, message: "Invalid refresh token." });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        
        if (user.refreshToken !== token) {
            return res.status(403).json({
                success: false,
                message: "Refresh token mismatch. Please login again."
            });
        }

        
        if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
            user.refreshToken = null;
            user.refreshTokenExpiry = null;
            await user.save();
            return res.status(403).json({
                success: false,
                message: "Refresh token expired. Please login again."
            });
        }

        const newAccessToken = generateAccessToken(user);

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            
            const user = await User.findOne({ refreshToken: token });
            if (user) {
                user.refreshToken = null;
                user.refreshTokenExpiry = null;
                await user.save();
            }
        }
        res.clearCookie("refreshToken");
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const UpdateUser = async (req, res) => {
    try {
        const userID = req.user.id;
        const user = await User.findById(userID);
        if (!user) return res.status(404).json({ success: false, message: "User Not Found!" });

        const { firstname, lastname, password, phno, street, city, province, postalCode, country } = req.body;

        if (firstname?.trim()) user.firstname = firstname.trim();
        if (lastname?.trim()) user.lastname = lastname.trim();
        if (phno?.trim()) user.phno = phno.trim();

        if (password && password.trim() !== "") {
            if (password.length < 6)
                return res.status(400).json({ success: false, message: "Password must be at least 6 characters long!" });
            user.password = await bcrypt.hash(password, 10);
        }

        if (street || city || province || postalCode || country) {
            user.address = {
                street: street ?? user.address?.street ?? "",
                city: city ?? user.address?.city ?? "",
                province: province ?? user.address?.province ?? "",
                postalCode: postalCode ?? user.address?.postalCode ?? "",
                country: country ?? user.address?.country ?? "",
            };
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully!",
            user: { _id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, phno: user.phno, address: user.address, role: user.role },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getuserbyid = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User Not Found!" });
        return res.status(200).json({ success: true, message: "User Fetched Successfully!", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const existingmail = await User.findOne({ email });
        if (!existingmail) return res.status(404).json({ success: false, message: "User Not Found Please Register first then verify!" });
        if (!otp) return res.status(404).json({ success: false, message: "Please Enter your OTP For verification" });
        if (!existingmail.otp) return res.status(404).json({ success: false, message: "OTP Not Found" });
        if (existingmail.otp_expiry < Date.now()) return res.status(400).json({ success: false, message: "OTP Expired!" });
        if (existingmail.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

        existingmail.isverified = true;
        existingmail.otp = null;
        existingmail.otp_expiry = null;
        await existingmail.save();

        return res.status(200).json({ success: true, message: "User Verified Successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const reverify = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required." });

        const existed_user = await User.findOne({ email });
        if (!existed_user) return res.status(404).json({ success: false, message: "User not found." });
        if (existed_user.isverified) return res.status(400).json({ success: false, message: "User is already verified." });

        const otp = OTP_gen();
        existed_user.otp = otp;
        existed_user.otp_expiry = Date.now() + 5 * 60 * 1000;
        await existed_user.save();
        await sendOTPEmail(existed_user.email, otp);

        return res.status(200).json({ success: true, message: "New OTP sent successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const changeUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (![true, false].includes(status)) return res.status(400).json({ success: false, message: "Invalid Status!" });

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User Not Found in the Database!" });

        user.isActive = status;
        await user.save();
        return res.status(200).json({ success: true, message: "User Account Status Updated Successfully!", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getalluserforadmin = async (req, res) => {
    try {
        const users = await User.find();
        if (!users) return res.status(404).json({ success: false, message: "No Users Found in the Database!" });
        return res.status(200).json({ success: true, message: "Users Fetched Successfully!", users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};