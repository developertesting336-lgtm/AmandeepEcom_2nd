import React, { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Tag as TagIcon,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  X,
  Phone,
  User,
  // Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import {
  fetchUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  validateAddress,
  type Address,
  type AddressTag,
  type AddressFormErrors,
} from "../../services/addressService";
import toast from "react-hot-toast";

export const AddressesTab: React.FC = () => {
  const { token, user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formTag, setFormTag] = useState<AddressTag>("Home");
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddressLine, setFormAddressLine] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirm State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const list = await fetchUserAddresses(token);
      setAddresses(list);
    } catch (err) {
      console.error("Error loading addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [token]);

  const openAddModal = () => {
    if (addresses.length >= 3) {
      toast.error("You can save up to 3 addresses. Please edit or delete an existing address.");
      return;
    }
    setEditingAddress(null);
    setFormTag("Home");
    setFormFullName(user?.name || "");
    setFormPhone(user?.phone || "");
    setFormAddressLine("");
    setFormCity("");
    setFormState("");
    setFormPincode("");
    setFormIsDefault(addresses.length === 0);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormTag(addr.tag || "Home");
    setFormFullName(addr.fullName);
    setFormPhone(addr.phone);
    setFormAddressLine(addr.addressLine);
    setFormCity(addr.city);
    setFormState(addr.state);
    setFormPincode(addr.pincode);
    setFormIsDefault(addr.isDefault || false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Address> = {
      fullName: formFullName.trim(),
      phone: formPhone.trim(),
      addressLine: formAddressLine.trim(),
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      tag: formTag,
      isDefault: formIsDefault,
    };

    const errors = validateAddress(payload);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the highlighted form errors");
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveUserAddress(
        {
          ...(editingAddress ? { id: editingAddress.id } : {}),
          fullName: payload.fullName!,
          phone: payload.phone!,
          addressLine: payload.addressLine!,
          city: payload.city!,
          state: payload.state!,
          pincode: payload.pincode!,
          tag: payload.tag || "Home",
          isDefault: payload.isDefault,
        },
        token
      );

      if (res.success) {
        setAddresses(res.data);
        setIsModalOpen(false);
        toast.success(editingAddress ? "Address updated successfully!" : "Address added successfully!");
      } else {
        toast.error(res.error || "Failed to save address");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await deleteUserAddress(id, token);
      if (res.success) {
        setAddresses(res.data);
        setDeleteTargetId(null);
        toast.success("Address removed successfully");
      }
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await setDefaultAddress(id, token);
      if (res.success) {
        setAddresses(res.data);
        toast.success("Default delivery address updated");
      }
    } catch (err) {
      toast.error("Failed to set default address");
    }
  };

  const getTagIcon = (tag: AddressTag) => {
    switch (tag) {
      case "Home":
        return <Home size={13} />;
      case "Work":
        return <Briefcase size={13} />;
      default:
        return <TagIcon size={13} />;
    }
  };

  return (
    <div className="addresses-tab-container">
      {/* Header */}
      <div className="addresses-tab-header">
        <div>
          <div className="addresses-title-row">
            <h3>Saved Addresses</h3>
            <span className="addresses-counter-badge">
              {addresses.length}/3 Saved
            </span>
          </div>
          <p>Manage your delivery locations for fast, seamless one-click checkout.</p>
        </div>

        <button
          type="button"
          className="add-address-btn"
          onClick={openAddModal}
          disabled={addresses.length >= 3}
        >
          <Plus size={16} />
          Add New Address
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="addresses-loading-box">
          <div className="profile-spinner" />
          <p>Fetching your saved addresses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && addresses.length === 0 && (
        <div className="addresses-empty-state">
          <div className="empty-state-icon-wrap map-icon-wrap">
            <MapPin size={36} />
          </div>
          <h3>No Addresses Saved</h3>
          <p>Add your home or workplace delivery address to enable instant checkout.</p>
          <button type="button" className="empty-state-cta-btn" onClick={openAddModal}>
            <Plus size={16} />
            Add First Address
          </button>
        </div>
      )}

      {/* Address Cards Grid */}
      {!loading && addresses.length > 0 && (
        <div className="addresses-grid">
          {addresses.map((addr) => {
            return (
              <div
                key={addr.id}
                className={`address-card ${addr.isDefault ? "default-address-card" : ""}`}
              >
                <div className="address-card-header">
                  <span className={`address-tag-pill tag-${(addr.tag || "Home").toLowerCase()}`}>
                    {getTagIcon(addr.tag || "Home")}
                    {addr.tag || "Home"}
                  </span>

                  {addr.isDefault ? (
                    <span className="default-badge">
                      <Check size={12} />
                      Default Address
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="set-default-btn"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="address-card-body">
                  <h4 className="address-recipient-name">
                    <User size={15} />
                    {addr.fullName}
                  </h4>
                  <p className="address-phone-number">
                    <Phone size={14} />
                    {addr.phone}
                  </p>
                  <div className="address-location-box">
                    <MapPin size={14} className="location-pin-icon" />
                    <p className="address-street">
                      {addr.addressLine}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                  </div>
                </div>

                <div className="address-card-actions">
                  <button
                    type="button"
                    className="address-action-btn edit-btn"
                    onClick={() => openEditModal(addr)}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="address-action-btn delete-btn"
                    onClick={() => setDeleteTargetId(addr.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="profile-modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <MapPin size={20} className="modal-accent-icon" />
                <h4>{editingAddress ? "Edit Shipping Address" : "Add New Shipping Address"}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="address-modal-form">
              {/* Tag Selector */}
              <div className="tag-selector-row">
                <label className="form-field-label">Address Type / Label:</label>
                <div className="tag-buttons-group">
                  {(["Home", "Work", "Other"] as AddressTag[]).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-choice-btn ${formTag === tag ? "active" : ""}`}
                      onClick={() => setFormTag(tag)}
                    >
                      {getTagIcon(tag)}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-form-grid">
                {/* Full Name */}
                <div className="profile-input-group">
                  <label htmlFor="addr-name">Full Name *</label>
                  <input
                    id="addr-name"
                    type="text"
                    placeholder="Recipient's Name"
                    value={formFullName}
                    onChange={(e) => {
                      setFormFullName(e.target.value);
                      if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    className={`profile-input ${formErrors.fullName ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.fullName && <span className="error-note">{formErrors.fullName}</span>}
                </div>

                {/* Mobile Phone */}
                <div className="profile-input-group">
                  <label htmlFor="addr-phone">Mobile Phone (10 digits) *</label>
                  <input
                    id="addr-phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    className={`profile-input ${formErrors.phone ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.phone && <span className="error-note">{formErrors.phone}</span>}
                </div>

                {/* Street Address */}
                <div className="profile-input-group full-width-input">
                  <label htmlFor="addr-line">Street Address / House No / Landmark *</label>
                  <input
                    id="addr-line"
                    type="text"
                    placeholder="Flat 402, Sunshine Heights, Near City Mall"
                    value={formAddressLine}
                    onChange={(e) => {
                      setFormAddressLine(e.target.value);
                      if (formErrors.addressLine) setFormErrors((p) => ({ ...p, addressLine: undefined }));
                    }}
                    className={`profile-input ${formErrors.addressLine ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.addressLine && <span className="error-note">{formErrors.addressLine}</span>}
                </div>

                {/* City */}
                <div className="profile-input-group">
                  <label htmlFor="addr-city">City / District *</label>
                  <input
                    id="addr-city"
                    type="text"
                    placeholder="e.g. Mumbai, New Delhi"
                    value={formCity}
                    onChange={(e) => {
                      setFormCity(e.target.value);
                      if (formErrors.city) setFormErrors((p) => ({ ...p, city: undefined }));
                    }}
                    className={`profile-input ${formErrors.city ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.city && <span className="error-note">{formErrors.city}</span>}
                </div>

                {/* State */}
                <div className="profile-input-group">
                  <label htmlFor="addr-state">State *</label>
                  <input
                    id="addr-state"
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={formState}
                    onChange={(e) => {
                      setFormState(e.target.value);
                      if (formErrors.state) setFormErrors((p) => ({ ...p, state: undefined }));
                    }}
                    className={`profile-input ${formErrors.state ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.state && <span className="error-note">{formErrors.state}</span>}
                </div>

                {/* Pincode */}
                <div className="profile-input-group">
                  <label htmlFor="addr-pincode">PIN / Postal Code (6 digits) *</label>
                  <input
                    id="addr-pincode"
                    type="text"
                    placeholder="e.g. 400001"
                    maxLength={6}
                    value={formPincode}
                    onChange={(e) => {
                      setFormPincode(e.target.value);
                      if (formErrors.pincode) setFormErrors((p) => ({ ...p, pincode: undefined }));
                    }}
                    className={`profile-input ${formErrors.pincode ? "input-error" : ""}`}
                    required
                  />
                  {formErrors.pincode && <span className="error-note">{formErrors.pincode}</span>}
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <div className="modal-checkbox-row">
                <label className="profile-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                  />
                  <span>Make this my default shipping address for all future orders</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={isSaving}
                >
                  <Check size={16} />
                  {isSaving ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="profile-modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <AlertCircle size={20} className="modal-warning-icon" />
                <h4>Delete Address</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-description">
              Are you sure you want to delete this address? This action cannot be reversed.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger-btn"
                onClick={() => handleDeleteAddress(deleteTargetId)}
              >
                Delete Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
