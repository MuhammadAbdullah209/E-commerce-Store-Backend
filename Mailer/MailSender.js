import { transporter } from "./Mailer.js";


export const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `${process.env.MAIL_USER}`,
            to: email,
            subject: "Email Verification OTP",
            html: `
                <div style="font-family: Arial; padding: 10px;">
                    <h2>Email Verification</h2>
                    <p>Your OTP code is:</p>
                    <h1 style="color: #1ce923;">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                </div>
            `
        });
        console.log("OTP Email sent successfully");
    } catch (error) {
        console.log("Email sending failed:", error.message);
    }
};