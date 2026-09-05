import React, { useState } from "react";
import "./Login.css";

const API_BASE_URL = "https://api-gateway-rz13.onrender.com";

function Login({ onLogin, onCreateAccount }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // FORGOT PASSWORD STATES
    // =====================================================

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);

    const [forgotEmail, setForgotEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [sessionToken, setSessionToken] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    // =====================================================
    // SAFE API RESPONSE HANDLER
    // =====================================================

    const readApiResponse = async (response) => {
        const contentType =
            response.headers.get("content-type") || "";

        const text = await response.text();

        // Normal JSON response
        if (contentType.includes("application/json")) {
            try {
                return text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    "The server returned invalid JSON."
                );
            }
        }

        // Server returned HTML instead of JSON
        if (text.trim().startsWith("<!DOCTYPE") ||
            text.trim().startsWith("<html") ||
            text.trim().startsWith("<")) {

            throw new Error(
                `Server returned an HTML page instead of an API response. HTTP ${response.status}.`
            );
        }

        return {
            message: text || `Request failed with HTTP ${response.status}`
        };
    };

    // =====================================================
    // NORMAL LOGIN
    // =====================================================

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError(
                "Please enter your email and password."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password: password,
                    }),
                }
            );

            const data =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Invalid email or password."
                );
            }

            localStorage.setItem(
                "jwt",
                data.token
            );

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                "userEmail",
                data.user.email
            );

            if (onLogin) {
                onLogin(
                    data.token,
                    data.user
                );
            }

        } catch (error) {
            setError(
                error.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    const handleGoogleLogin = () => {
        window.location.href =
            `${API_BASE_URL}/oauth2/authorization/google`;
    };

    // =====================================================
    // OPEN FORGOT PASSWORD
    // =====================================================

    const openForgotPassword = (e) => {
        e.preventDefault();

        setForgotEmail(email);

        setForgotStep(1);

        setForgotMessage("");
        setForgotError("");

        setOtp("");
        setSessionToken("");

        setNewPassword("");
        setConfirmPassword("");

        setShowForgotPassword(true);
    };

    // =====================================================
    // CLOSE FORGOT PASSWORD
    // =====================================================

    const closeForgotPassword = () => {
        if (forgotLoading) {
            return;
        }

        setShowForgotPassword(false);

        setForgotStep(1);

        setForgotMessage("");
        setForgotError("");

        setOtp("");
        setSessionToken("");

        setNewPassword("");
        setConfirmPassword("");
    };

    // =====================================================
    // STEP 1 - SEND OTP
    // =====================================================

    const handleSendOtp = async (e) => {
        e.preventDefault();

        setForgotError("");
        setForgotMessage("");

        const normalizedEmail =
            forgotEmail.trim().toLowerCase();

        if (!normalizedEmail) {
            setForgotError(
                "Please enter your email address."
            );
            return;
        }

        try {
            setForgotLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                    }),
                }
            );

            const data =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    `Could not send OTP. HTTP ${response.status}`
                );
            }

            setForgotEmail(normalizedEmail);

            setForgotMessage(
                "OTP sent successfully. Please check your email."
            );

            setForgotStep(2);

        } catch (error) {
            console.error(
                "SEND OTP ERROR:",
                error
            );

            setForgotError(
                error.message ||
                "Could not send OTP."
            );

        } finally {
            setForgotLoading(false);
        }
    };

    // =====================================================
    // STEP 2 - VERIFY OTP
    // =====================================================

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        setForgotError("");
        setForgotMessage("");

        if (!otp || otp.length !== 6) {
            setForgotError(
                "Please enter the 6-digit OTP."
            );
            return;
        }

        try {
            setForgotLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/auth/forgot-password/verify`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email: forgotEmail.trim().toLowerCase(),
                        otp: otp,
                    }),
                }
            );

            const data =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Invalid or expired OTP."
                );
            }

            if (!data.sessionToken) {
                throw new Error(
                    "Reset session was not created."
                );
            }

            setSessionToken(
                data.sessionToken
            );

            setForgotMessage(
                "OTP verified successfully."
            );

            setForgotStep(3);

        } catch (error) {
            console.error(
                "VERIFY OTP ERROR:",
                error
            );

            setForgotError(
                error.message ||
                "OTP verification failed."
            );

        } finally {
            setForgotLoading(false);
        }
    };

    // =====================================================
    // STEP 3 - RESET PASSWORD
    // =====================================================

    const handleResetPassword = async (e) => {
        e.preventDefault();

        setForgotError("");
        setForgotMessage("");

        if (!newPassword || !confirmPassword) {
            setForgotError(
                "Please enter and confirm your new password."
            );
            return;
        }

        if (newPassword.length < 6) {
            setForgotError(
                "Password must be at least 6 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setForgotError(
                "Passwords do not match."
            );
            return;
        }

        if (!sessionToken) {
            setForgotError(
                "Your reset session has expired. Please request a new OTP."
            );
            return;
        }

        try {
            setForgotLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/auth/forgot-password/reset`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email:
                            forgotEmail.trim().toLowerCase(),

                        sessionToken:
                            sessionToken,

                        newPassword:
                            newPassword,
                    }),
                }
            );

            const data =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Password reset failed."
                );
            }

            setForgotMessage(
                "Password reset successfully! You can now sign in."
            );

            setForgotStep(4);

        } catch (error) {
            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            setForgotError(
                error.message ||
                "Password reset failed."
            );

        } finally {
            setForgotLoading(false);
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="login-page">

            <div className="login-card">

                {/* LOGO */}

                <div className="login-logo">
                    I
                </div>

                <h1>
                    Welcome to Investra
                </h1>

                <p className="login-subtitle">
                    Sign in to continue to your investment platform
                </p>

                {/* GOOGLE LOGIN */}

                <button
                    type="button"
                    className="google-login-btn"
                    onClick={handleGoogleLogin}
                >
                    <span className="google-icon">
                        G
                    </span>

                    Continue with Google
                </button>

                <div className="login-divider">
                    <span>OR</span>
                </div>

                {/* NORMAL LOGIN */}

                <form onSubmit={handleLogin}>

                    <div className="login-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className="login-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <div className="login-options">

                        <label>
                            <input
                                type="checkbox"
                            />

                            Remember me
                        </label>

                        <a
                            href="#forgot-password"
                            onClick={
                                openForgotPassword
                            }
                        >
                            Forgot password?
                        </a>

                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Sign In"}
                    </button>

                </form>

                <p className="signup-text">

                    Don't have an account?{" "}

                    <a
                        href="#create-account"
                        onClick={(e) => {

                            e.preventDefault();

                            if (onCreateAccount) {
                                onCreateAccount();
                            }

                        }}
                    >
                        Create an account
                    </a>

                </p>

            </div>

            {/* =================================================
                FORGOT PASSWORD MODAL
            ================================================= */}

            {showForgotPassword && (

                <div
                    className="forgot-modal-overlay"
                    onClick={closeForgotPassword}
                >

                    <div
                        className="forgot-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="forgot-close"
                            onClick={
                                closeForgotPassword
                            }
                        >
                            ×
                        </button>

                        {/* =========================
                            STEP 1
                        ========================= */}

                        {forgotStep === 1 && (

                            <>
                                <div className="forgot-icon">
                                    🔐
                                </div>

                                <h2>
                                    Forgot Password?
                                </h2>

                                <p className="forgot-description">
                                    Enter your registered email and we'll send you an OTP.
                                </p>

                                <form
                                    onSubmit={
                                        handleSendOtp
                                    }
                                >

                                    <div className="login-field">

                                        <label>
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            placeholder="Enter your registered email"
                                            value={
                                                forgotEmail
                                            }
                                            onChange={(e) =>
                                                setForgotEmail(
                                                    e.target.value
                                                )
                                            }
                                            autoFocus
                                        />

                                    </div>

                                    {forgotError && (
                                        <div className="login-error">
                                            {forgotError}
                                        </div>
                                    )}

                                    {forgotMessage && (
                                        <div className="forgot-success">
                                            {forgotMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="login-btn"
                                        disabled={
                                            forgotLoading
                                        }
                                    >
                                        {forgotLoading
                                            ? "Sending OTP..."
                                            : "Send OTP"}
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 2
                        ========================= */}

                        {forgotStep === 2 && (

                            <>
                                <div className="forgot-icon">
                                    ✉️
                                </div>

                                <h2>
                                    Enter OTP
                                </h2>

                                <p className="forgot-description">
                                    We sent a 6-digit OTP to:
                                    <strong>
                                        {" "}
                                        {forgotEmail}
                                    </strong>
                                </p>

                                <form
                                    onSubmit={
                                        handleVerifyOtp
                                    }
                                >

                                    <div className="login-field">

                                        <label>
                                            OTP
                                        </label>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="6"
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    )
                                                )
                                            }
                                            autoFocus
                                        />

                                    </div>

                                    {forgotError && (
                                        <div className="login-error">
                                            {forgotError}
                                        </div>
                                    )}

                                    {forgotMessage && (
                                        <div className="forgot-success">
                                            {forgotMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="login-btn"
                                        disabled={
                                            forgotLoading
                                        }
                                    >
                                        {forgotLoading
                                            ? "Verifying..."
                                            : "Verify OTP"}
                                    </button>

                                    <button
                                        type="button"
                                        className="forgot-secondary-btn"
                                        onClick={() => {
                                            setForgotStep(1);
                                            setForgotError("");
                                            setForgotMessage("");
                                            setOtp("");
                                        }}
                                    >
                                        Change email
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 3
                        ========================= */}

                        {forgotStep === 3 && (

                            <>
                                <div className="forgot-icon">
                                    🔑
                                </div>

                                <h2>
                                    Create New Password
                                </h2>

                                <p className="forgot-description">
                                    Choose a new password for your Investra account.
                                </p>

                                <form
                                    onSubmit={
                                        handleResetPassword
                                    }
                                >

                                    <div className="login-field">

                                        <label>
                                            New Password
                                        </label>

                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={
                                                newPassword
                                            }
                                            onChange={(e) =>
                                                setNewPassword(
                                                    e.target.value
                                                )
                                            }
                                            autoFocus
                                        />

                                    </div>

                                    <div className="login-field">

                                        <label>
                                            Confirm Password
                                        </label>

                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={
                                                confirmPassword
                                            }
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    {forgotError && (
                                        <div className="login-error">
                                            {forgotError}
                                        </div>
                                    )}

                                    {forgotMessage && (
                                        <div className="forgot-success">
                                            {forgotMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="login-btn"
                                        disabled={
                                            forgotLoading
                                        }
                                    >
                                        {forgotLoading
                                            ? "Resetting..."
                                            : "Reset Password"}
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 4
                        ========================= */}

                        {forgotStep === 4 && (

                            <div className="forgot-complete">

                                <div className="forgot-success-icon">
                                    ✓
                                </div>

                                <h2>
                                    Password Updated
                                </h2>

                                <p className="forgot-description">
                                    Your password has been changed successfully.
                                </p>

                                <button
                                    type="button"
                                    className="login-btn"
                                    onClick={
                                        closeForgotPassword
                                    }
                                >
                                    Back to Sign In
                                </button>

                            </div>
                        )}

                    </div>

                </div>
            )}

        </div>
    );
}

export default Login;