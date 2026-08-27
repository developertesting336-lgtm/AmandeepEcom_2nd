import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";
import "./Taglines.css";

interface Tagline {
  _id: string;
  title: string;
  isUsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_ADMIN_TAGLINES = `${API_BASE_URL}/api/taglines`;

const Taglines = () => {
  const [taglines, setTaglines] = useState<Tagline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isUsed, setIsUsed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchTaglines = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const res = await fetch(API_ADMIN_TAGLINES, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const rawList = result.data?.taglines || result.data || result.taglines || [];
        setTaglines(Array.isArray(rawList) ? rawList : []);
      } else {
        throw new Error(result.message || "Failed to fetch taglines");
      }
    } catch (err) {
      console.error("Fetch taglines error:", err);
      setError(err instanceof Error ? err.message : "Unable to load taglines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaglines();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle("");
    setIsUsed(true);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (tagline: Tagline) => {
    setEditingId(tagline._id);
    setTitle(tagline.title);
    setIsUsed(tagline.isUsed !== false);
    setModalError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTitle("");
    setIsUsed(true);
    setModalError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setModalError("Tagline title is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      const token = localStorage.getItem("token");

      const isEdit = !!editingId;
      const url = isEdit ? `${API_ADMIN_TAGLINES}/${editingId}` : API_ADMIN_TAGLINES;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          isUsed,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isEdit ? "update" : "create"} tagline`);
      }

      handleCloseModal();
      fetchTaglines();
    } catch (err) {
      console.error("Submit tagline error:", err);
      setModalError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this tagline?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_ADMIN_TAGLINES}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete tagline");
      }

      setTaglines((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete tagline error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete tagline");
    }
  };

  const filteredTaglines = taglines.filter((tagline) =>
    tagline.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <section className="taglines-section">
      {/* HEADER */}
      <div className="taglines-header">
        <div>
          <span className="taglines-eyebrow">ADMINISTRATION</span>
          <h1>Taglines</h1>
          <p>Manage dynamic marketing taglines displayed on the store homepage.</p>
        </div>

        <button type="button" className="add-tagline-btn" onClick={handleOpenAddModal}>
          <Plus size={18} />
          Add Tagline
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="taglines-toolbar">
        <div className="tagline-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search taglines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="tagline-count">
          {filteredTaglines.length} {filteredTaglines.length === 1 ? "Tagline" : "Taglines"}
        </span>
      </div>

      {/* ERROR */}
      {error && <div className="tagline-error">{error}</div>}

      {/* LIST / TABLE */}
      {loading ? (
        <div className="tagline-loading">Loading taglines...</div>
      ) : filteredTaglines.length === 0 ? (
        <div className="tagline-empty">
          <h3>No taglines found</h3>
          <p>Create a tagline to display promotional banners on the homepage.</p>
        </div>
      ) : (
        <div className="taglines-table-wrapper">
          <table className="taglines-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaglines.map((tagline) => (
                <tr key={tagline._id}>
                  <td>
                    <strong>{tagline.title}</strong>
                  </td>

                  <td>
                    <span className={`status-badge-tag ${tagline.isUsed !== false ? "used" : "unused"}`}>
                      {tagline.isUsed !== false ? "Active / In Use" : "Disabled"}
                    </span>
                  </td>

                  <td>
                    {tagline.createdAt
                      ? new Date(tagline.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td>
                    <div className="tagline-actions">
                      <button
                        className="tagline-edit-btn"
                        onClick={() => handleOpenEditModal(tagline)}
                        title="Edit tagline"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        className="tagline-delete-btn"
                        onClick={() => handleDelete(tagline._id)}
                        title="Delete tagline"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="tagline-modal-overlay">
          <div className="tagline-modal">
            <div className="tagline-modal-header">
              <h2>{editingId ? "Edit Tagline" : "Add New Tagline"}</h2>
              <button className="tagline-modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {modalError && <div className="tagline-error">{modalError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="tagline-form-group">
                <label htmlFor="tagline-title">Tagline Title *</label>
                <input
                  id="tagline-title"
                  type="text"
                  placeholder="e.g. Best Sellers, Exclusive Offer, Summer Sale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="tagline-form-group">
                <label className="tagline-checkbox-group">
                  <input
                    type="checkbox"
                    checked={isUsed}
                    onChange={(e) => setIsUsed(e.target.checked)}
                  />
                  <span>Active / Display on Homepage</span>
                </label>
              </div>

              <div className="tagline-modal-actions">
                <button
                  type="button"
                  className="tagline-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button type="submit" className="tagline-btn-submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Update Tagline" : "Create Tagline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Taglines;
