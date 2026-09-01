import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import {
  User as UserIcon,
  Mail,
  Phone,
  Key,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit3,
  Calendar,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface AccountDetailsTabProps {
  onNavigateToOrders?: () => void;
  onNavigateToWishlist?: () => void;
}

export const AccountDetailsTab: React.FC<AccountDetailsTabProps> = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Personal Info Form State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [memberSince, setMemberSince] = useState<string>(new Date().getFullYear().toString());
  const [profilePassword, setProfilePassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const userInitial = name ? name.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Fetch latest user profile from GET /api/profile/user on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/profile/user`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            const fetchedUser = data.data.user;
            setName(fetchedUser.name || "");
            setEmail(fetchedUser.email || "");
            setPhone(fetchedUser.phone || "");
            if (fetchedUser.createdAt) {
              setMemberSince(new Date(fetchedUser.createdAt).getFullYear().toString());
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile from server:", err);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (!profilePassword.trim()) {
      toast.error("Please enter your current password to save changes");
      return;
    }

    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/profile/user`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          currentPassword: profilePassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      if (data.data?.user) {
        const updatedUser = data.data.user;
        setName(updatedUser.name || "");
        setEmail(updatedUser.email || "");
        setPhone(updatedUser.phone || "");
      }

      setProfilePassword("");
      setIsEditing(false);
      toast.success(data.message || "Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/profile/user/password`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update password");
      }

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (err: any) {
      setPasswordError(err.message || "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="account-details-container">
      {/* Profile Header Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar-wrap">
          <div className="profile-hero-avatar">{userInitial}</div>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-hero-title-row">
            <h2>{user?.name || name || "Customer Account"}</h2>
          </div>
          <p className="profile-hero-email">{email || "No email linked"}</p>
          <div className="profile-hero-subtags">
            <span className="subtag-item">
              <Calendar size={13} />
              Member Since {memberSince}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`profile-edit-toggle-btn ${isEditing ? "active" : ""}`}
          onClick={() => {
            if (isEditing) {
              setName(user?.name || "");
              setPhone(user?.phone || "");
              setProfilePassword("");
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Edit3 size={15} />
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </button>
      </div>

      {/* Account Details Form Card */}
      <div className="profile-section-card">
        <div className="section-card-header">
          <div className="section-card-icon-wrap">
            <UserIcon size={20} />
          </div>
          <div>
            <h3>Personal Information</h3>
            <p>Manage your account name, contact number, and verification password.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="profile-form-grid">
            {/* Full Name */}
            <div className="profile-input-group">
              <label htmlFor="user-fullname">
                <UserIcon size={14} />
                Full Name
              </label>
              <input
                id="user-fullname"
                type="text"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="profile-input"
                required
              />
            </div>

            {/* Email Address */}
            <div className="profile-input-group">
              <label htmlFor="user-email">
                <Mail size={14} />
                Email Address
              </label>
              <input
                id="user-email"
                type="email"
                value={email}
                disabled={true}
                title="Email is verified with your authentication"
                className="profile-input disabled-input"
              />
              <span className="input-helper-note">Verified email for login & order receipts.</span>
            </div>

            {/* Phone Number */}
            <div className="profile-input-group">
              <label htmlFor="user-phone">
                <Phone size={14} />
                Mobile Number
              </label>
              <input
                id="user-phone"
                type="tel"
                value={phone}
                disabled={!isEditing}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="profile-input"
              />
            </div>

            {/* Current Password Field (Replacing Gender Field) */}
            <div className="profile-input-group">
              <label htmlFor="profile-current-password">
                <Lock size={14} />
                Current Password {isEditing && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <div className="password-input-wrap">
                <input
                  id="profile-current-password"
                  type={showProfilePassword ? "text" : "password"}
                  value={profilePassword}
                  disabled={!isEditing}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder={isEditing ? "Enter password to verify edit" : "••••••••"}
                  className="profile-input"
                  required={isEditing}
                />
                {isEditing && (
                  <button
                    type="button"
                    className="password-toggle-eye"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    aria-label="Toggle current password visibility"
                  >
                    {showProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              <span className="input-helper-note">
                {isEditing
                  ? "Required by security to authorize changes to your profile."
                  : "Verified security credentials."}
              </span>
            </div>
          </div>

          {isEditing && (
            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => {
                  setName(user?.name || "");
                  setPhone(user?.phone || "");
                  setProfilePassword("");
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingProfile}
              >
                <Save size={16} />
                {savingProfile ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="profile-section-card">
        <div className="section-card-header">
          <div className="section-card-icon-wrap security-icon-wrap">
            <Key size={18} />
          </div>
          <div className="security-header-text">
            <h3>Password & Security</h3>
            <p>Keep your account safe by setting a strong, unique password.</p>
          </div>
          <button
            type="button"
            className="security-action-btn"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Lock size={14} />
            {showPasswordSection ? "Hide Password Form" : "Change Password"}
          </button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handlePasswordChange} className="password-change-form">
            {passwordError && (
              <div className="password-error-alert">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="profile-form-grid">
              <div className="profile-input-group">
                <label htmlFor="curr-password">Current Password</label>
                <input
                  id="curr-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="profile-input"
                  required
                />
              </div>

              <div className="profile-input-group">
                <label htmlFor="new-password">New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="profile-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-eye"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="profile-input-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="profile-input"
                  required
                />
              </div>
            </div>

            <div className="password-requirements-box">
              <div className="requirement-item">
                <CheckCircle2 size={13} className={newPassword.length >= 6 ? "checked" : ""} />
                <span>At least 6 characters</span>
              </div>
              <div className="requirement-item">
                <CheckCircle2 size={13} className={/[A-Z]/.test(newPassword) ? "checked" : ""} />
                <span>At least 1 uppercase letter</span>
              </div>
              <div className="requirement-item">
                <CheckCircle2 size={13} className={/[0-9]/.test(newPassword) ? "checked" : ""} />
                <span>At least 1 number or special symbol</span>
              </div>
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordError("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={changingPassword}
              >
                <Lock size={15} />
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reset Password via Email Section */}
      <div className="profile-section-card reset-email-section-card">
        <div className="section-card-header">
          <div className="section-card-icon-wrap email-reset-icon-wrap">
            <Mail size={18} />
          </div>
          <div className="security-header-text">
            <h3>Reset Password via Email</h3>
            <p>
              Forgot your current password? We can send a secure One-Time Password (OTP) to your registered email to reset your credentials.
            </p>
          </div>
          <button
            type="button"
            className="security-action-btn email-reset-action-btn"
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email || user?.email || "")}`)}
          >
            <KeyRound size={14} />
            <span>Reset via Email OTP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsTab;
