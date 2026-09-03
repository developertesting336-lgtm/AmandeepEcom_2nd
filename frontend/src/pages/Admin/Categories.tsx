import { useEffect, useState } from "react";
import { Edit, Trash2, Plus, X, FolderTree, Image as ImageIcon, Upload, Link } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import "./CategoryList.css";

interface Category {
  _id: string;
  name: string;
  description: string;
  image?: string;
  parent?: string | { _id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CategoryList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState<"file" | "url">("file");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [parent, setParent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageMode, setEditImageMode] = useState<"file" | "url">("file");
  const [editImage, setEditImage] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageFileName, setEditImageFileName] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/categories/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch categories");
      }

      setCategories(result.data || []);
    } catch (err) {
      console.error("Category fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeviceFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditImageFile(file);
        setEditImageFileName(file.name);
        setEditImage(dataUrl);
      } else {
        setImageFile(file);
        setImageFileName(file.name);
        setImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setModalError("Category name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const token = localStorage.getItem("token");
      let fileToSend: File | null = imageFile;

      if (!fileToSend && image.trim()) {
        try {
          const res = await fetch(image.trim());
          const blob = await res.blob();
          fileToSend = new File([blob], "category.jpg", {
            type: blob.type || "image/jpeg",
          });
        } catch {
          // Fallback if URL cannot be fetched directly (e.g. CORS)
        }
      }

      if (!fileToSend && !image.trim()) {
        setModalError("Category image is required.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (parent) formData.append("parent", parent);

      if (fileToSend) {
        formData.append("image", fileToSend);
      } else if (image.trim()) {
        formData.append("image", image.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/add/categories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to add category");
      }

      setCategories((prev) => [result.data.category, ...prev]);
      fetchCategories();

      setShowAddModal(false);
      setName("");
      setDescription("");
      setImageMode("file");
      setImage("");
      setImageFile(null);
      setImageFileName("");
      setParent("");
    } catch (err) {
      console.error("Add category error:", err);
      setModalError(
        err instanceof Error ? err.message : "Failed to add category"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name || "");
    setEditDescription(category.description || "");
    setEditImage(category.image || "");
    setEditImageFile(null);
    setEditImageFileName("");
    setEditImageMode(category.image ? "url" : "file");

    let parentVal = "";
    if (category.parent) {
      if (typeof category.parent === "object" && category.parent !== null) {
        parentVal = category.parent._id;
      } else if (typeof category.parent === "string") {
        parentVal = category.parent;
      }
    }

    setEditParent(parentVal);
    setEditModalError("");
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;
    if (!editName.trim()) {
      setEditModalError("Category name is required.");
      return;
    }

    try {
      setEditSubmitting(true);
      setEditModalError("");

      const token = localStorage.getItem("token");
      let editFileToSend: File | null = editImageFile;

      if (!editFileToSend && editImage.trim()) {
        try {
          const res = await fetch(editImage.trim());
          const blob = await res.blob();
          editFileToSend = new File([blob], "category.jpg", {
            type: blob.type || "image/jpeg",
          });
        } catch {
          // Fallback if URL cannot be fetched directly
        }
      }

      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("description", editDescription.trim());
      if (editParent) formData.append("parent", editParent);

      if (editFileToSend) {
        formData.append("image", editFileToSend);
      } else if (editImage.trim()) {
        formData.append("image", editImage.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/category/${editingCategory._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update category");
      }

      const updatedCategory = result.data?.category || {
        ...editingCategory,
        name: editName.trim(),
        description: editDescription.trim(),
        image: editImage.trim(),
        parent: editParent ? editParent : null,
      };

      setCategories((prev) =>
        prev.map((c) => (c._id === editingCategory._id ? updatedCategory : c))
      );

      setEditingCategory(null);
    } catch (err) {
      console.error("Update category error:", err);
      setEditModalError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/category/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete category");
      }

      setCategories((prev) =>
        prev.filter((category) => category._id !== categoryId)
      );
    } catch (err) {
      console.error("Delete category error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete category"
      );
    }
  };

  const getParentName = (cat: Category) => {
    if (!cat.parent) return null;
    if (typeof cat.parent === "object" && cat.parent !== null) {
      return cat.parent.name;
    }
    const parentObj = categories.find((c) => c._id === cat.parent);
    return parentObj ? parentObj.name : null;
  };

  const getImageUrl = (imageSrc?: string) => {
    if (!imageSrc) return "";
    if (
      imageSrc.startsWith("http://") ||
      imageSrc.startsWith("https://") ||
      imageSrc.startsWith("data:")
    ) {
      return imageSrc;
    }
    return `${API_BASE_URL}${imageSrc.startsWith("/") ? "" : "/"}${imageSrc}`;
  };

  if (loading) {
    return (
      <section className="category-management">
        <div className="category-loading">
          Loading categories...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="category-management">
        <div className="category-error">
          <p>{error}</p>

          <button onClick={fetchCategories}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="category-management">
      {/* Header */}
      <div className="category-header">
        <div>
          <span className="category-eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h2>Categories</h2>

          <p>
            Manage your product categories, subcategories, and hierarchy.
          </p>
        </div>

        <button
          type="button"
          className="category-add-btn"
          onClick={() => {
            setModalError("");
            setName("");
            setDescription("");
            setImage("");
            setImageFile(null);
            setImageFileName("");
            setImageMode("file");
            setParent("");
            setShowAddModal(true);
          }}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Category Table */}
      <div className="category-table-wrapper">
        <table className="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type / Parent</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="category-empty">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const parentName = getParentName(category);
                const categoryImgUrl = getImageUrl(category.image);

                return (
                  <tr key={category._id} className="category-table-row">
                    {/* Category */}
                    <td className="cell-cat-main">
                      <div className="category-name-wrapper">
                        <div className="category-image">
                          {categoryImgUrl ? (
                            <img
                              src={categoryImgUrl}
                              alt={category.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span>
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="category-name-group">
                          <strong>{category.name}</strong>
                          {parentName && (
                            <span className="cat-mobile-parent-badge">
                              <FolderTree size={11} /> {parentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Parent / Type */}
                    <td className="cell-cat-parent">
                      {parentName ? (
                        <span className="category-parent-badge">
                          <FolderTree size={12} />
                          Subcategory of {parentName}
                        </span>
                      ) : (
                        <span className="category-parent-badge main-cat">
                          Main Category
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="cell-cat-desc">
                      <span className="category-description">
                        {category.description || "No description"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="cell-cat-status">
                      <span
                        className={`category-status ${
                          category.isActive !== false ? "active" : "inactive"
                        }`}
                      >
                        <span className="status-dot" />
                        {category.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="cell-cat-date">
                      <span className="category-date">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="cell-cat-actions">
                      <div className="category-actions">
                        <button
                          type="button"
                          className="category-edit-btn"
                          onClick={() => handleOpenEditModal(category)}
                          title="Edit category"
                        >
                          <Edit size={16} />
                          <span className="cat-btn-text-mobile">Edit</span>
                        </button>

                        <button
                          type="button"
                          className="category-delete-btn"
                          onClick={() => handleDelete(category._id)}
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                          <span className="cat-btn-text-mobile">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="category-footer">
        <span>
          Showing <strong>{categories.length}</strong>{" "}
          {categories.length === 1 ? "category" : "categories"}
        </span>
      </div>

      {/* ADD CATEGORY MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Category</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory}>
              {modalError && (
                <div className="modal-alert-error">{modalError}</div>
              )}

              <div className="modal-form-group">
                <label htmlFor="cat-name">Category Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="e.g. Electronics, Mobile Phones..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="cat-parent">Parent Category (Optional)</label>
                <select
                  id="cat-parent"
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                >
                  <option value="">None (Main Category)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Input Selector */}
              <div className="modal-form-group">
                <label>Category Image</label>
                <div className="image-mode-toggle">
                  <button
                    type="button"
                    className={`image-mode-btn ${imageMode === "file" ? "active" : ""}`}
                    onClick={() => setImageMode("file")}
                  >
                    <Upload size={14} />
                    From Device
                  </button>
                  <button
                    type="button"
                    className={`image-mode-btn ${imageMode === "url" ? "active" : ""}`}
                    onClick={() => setImageMode("url")}
                  >
                    <Link size={14} />
                    Image URL
                  </button>
                </div>

                {imageMode === "file" ? (
                  image ? (
                    <div className="category-image-preview-container">
                      <img
                        src={image}
                        alt="Selected preview"
                        className="category-image-preview-thumb"
                      />
                      <div className="category-image-preview-info">
                        <strong>{imageFileName || "Selected Image"}</strong>
                        <span>File ready to upload</span>
                      </div>
                      <button
                        type="button"
                        className="category-image-remove-btn"
                        onClick={() => {
                          setImage("");
                          setImageFile(null);
                          setImageFileName("");
                        }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="category-image-dropzone"
                      htmlFor="cat-file-input"
                    >
                      <ImageIcon size={26} />
                      <strong>Choose image from device</strong>
                      <span>PNG, JPG, WEBP, GIF up to 5MB</span>
                      <input
                        id="cat-file-input"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleDeviceFileSelect(e, false)}
                      />
                    </label>
                  )
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. /uploads/electronics.jpg or https://..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                )}
              </div>

              <div className="modal-form-group">
                <label htmlFor="cat-desc">Description</label>
                <textarea
                  id="cat-desc"
                  placeholder="Short summary of what products belong in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Category</h3>
              <button
                className="modal-close-btn"
                onClick={() => setEditingCategory(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory}>
              {editModalError && (
                <div className="modal-alert-error">{editModalError}</div>
              )}

              <div className="modal-form-group">
                <label htmlFor="edit-cat-name">Category Name *</label>
                <input
                  id="edit-cat-name"
                  type="text"
                  placeholder="e.g. Electronics..."
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="edit-cat-parent">Parent Category (Optional)</label>
                <select
                  id="edit-cat-parent"
                  value={editParent}
                  onChange={(e) => setEditParent(e.target.value)}
                >
                  <option value="">None (Main Category)</option>
                  {categories
                    .filter((c) => c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Edit Image Input Selector */}
              <div className="modal-form-group">
                <label>Category Image</label>
                <div className="image-mode-toggle">
                  <button
                    type="button"
                    className={`image-mode-btn ${editImageMode === "file" ? "active" : ""}`}
                    onClick={() => setEditImageMode("file")}
                  >
                    <Upload size={14} />
                    From Device
                  </button>
                  <button
                    type="button"
                    className={`image-mode-btn ${editImageMode === "url" ? "active" : ""}`}
                    onClick={() => setEditImageMode("url")}
                  >
                    <Link size={14} />
                    Image URL
                  </button>
                </div>

                {editImageMode === "file" ? (
                  editImage ? (
                    <div className="category-image-preview-container">
                      <img
                        src={getImageUrl(editImage)}
                        alt="Selected preview"
                        className="category-image-preview-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="category-image-preview-info">
                        <strong>
                          {editImageFileName || "Current Category Image"}
                        </strong>
                        <span>Image ready</span>
                      </div>
                      <button
                        type="button"
                        className="category-image-remove-btn"
                        onClick={() => {
                          setEditImage("");
                          setEditImageFile(null);
                          setEditImageFileName("");
                        }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="category-image-dropzone"
                      htmlFor="edit-cat-file-input"
                    >
                      <ImageIcon size={26} />
                      <strong>Choose image from device</strong>
                      <span>PNG, JPG, WEBP, GIF up to 5MB</span>
                      <input
                        id="edit-cat-file-input"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleDeviceFileSelect(e, true)}
                      />
                    </label>
                  )
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. /uploads/electronics.jpg or https://..."
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                  />
                )}
              </div>

              <div className="modal-form-group">
                <label htmlFor="edit-cat-desc">Description</label>
                <textarea
                  id="edit-cat-desc"
                  placeholder="Short description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setEditingCategory(null)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryList;
