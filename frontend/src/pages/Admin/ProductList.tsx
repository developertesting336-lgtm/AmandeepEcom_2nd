import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
  Star,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ProductList.css";

interface Category {
  _id: string;
  name: string;
}

type ProductImageItem =
  | string
  | { public_id?: string; url?: string; _id?: string };

interface Product {
  _id: string;
  name: string;
  short_description?: string;
  full_description?: string;
  description?: string;
  price: number;
  salePrice: number | null;
  sku: string;
  stock: number;
  category: Category | string;
  subcategory?: Category | string;
  brand: string;
  images: ProductImageItem[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (
  image: string | ProductImageItem | undefined
): string => {
  if (!image) return "";
  const rawUrl = typeof image === "string" ? image : image.url;
  if (!rawUrl) return "";
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

interface ProductTableRowProps {
  product: Product;
  isDeleting: boolean;
  isTogglingActive: boolean;
  isTogglingFeatured: boolean;
  onToggleActive: (productId: string, currentStatus: boolean) => void;
  onToggleFeatured: (productId: string, currentStatus: boolean) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

const ProductTableRow = memo(
  ({
    product,
    isDeleting,
    isTogglingActive,
    isTogglingFeatured,
    onToggleActive,
    onToggleFeatured,
    onEdit,
    onDelete,
  }: ProductTableRowProps) => {
    const categoryName =
      typeof product.category === "object"
        ? product.category?.name || "Uncategorized"
        : product.category || "Uncategorized";

    const subCategoryName =
      typeof product.subcategory === "object"
        ? product.subcategory?.name
        : product.subcategory;

    const hasDiscount =
      product.salePrice !== null &&
      product.salePrice !== undefined &&
      Number(product.salePrice) > 0 &&
      Number(product.salePrice) < Number(product.price);

    return (
      <tr className="product-table-row">
        {/* Product Cell */}
        <td className="cell-product">
          <div className="product-cell">
            <div className="product-image">
              {formatImageUrl(product.images?.[0]) ? (
                <img
                  src={formatImageUrl(product.images?.[0])}
                  alt={product.name}
                  loading="lazy"
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>

            <div className="product-details">
              <strong title={product.name}>{product.name}</strong>
              <span>{product.brand || "Generic Brand"}</span>
            </div>
          </div>
        </td>

        {/* SKU */}
        <td className="cell-sku">
          <span className="sku" title={product.sku || "N/A"}>
            {product.sku || "N/A"}
          </span>
        </td>

        {/* Category & Subcategory */}
        <td className="cell-category">
          <div className="cat-cell">
            <strong className="cat-main">{categoryName}</strong>
            {subCategoryName && (
              <span className="subcategory-tag">
                › {subCategoryName}
              </span>
            )}
          </div>
        </td>

        {/* Price */}
        <td className="cell-price">
          <div className="price-cell">
            {hasDiscount ? (
              <>
                <strong>
                  ₹{Number(product.salePrice).toLocaleString("en-IN")}
                </strong>
                <del>
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </del>
              </>
            ) : (
              <strong>
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </strong>
            )}
          </div>
        </td>

        {/* Stock */}
        <td className="cell-stock">
          <span
            className={`stock-badge ${product.stock === 0
                ? "out"
                : product.stock <= 10
                  ? "low"
                  : "available"
              }`}
          >
            {product.stock === 0
              ? "Out of stock"
              : `${product.stock} in stock`}
          </span>
        </td>

        {/* Status */}
        <td className="cell-status">
          <button
            type="button"
            role="switch"
            aria-checked={product.isActive !== false}
            className={`admin-toggle-badge ${product.isActive !== false ? "active" : "inactive"
              }`}
            onClick={() =>
              onToggleActive(product._id, product.isActive !== false)
            }
            disabled={isTogglingActive}
            title={
              product.isActive !== false
                ? "Active — Click to set Inactive"
                : "Inactive — Click to set Active"
            }
          >
            <span className="toggle-badge-track">
              <span className="toggle-badge-thumb">
                {isTogglingActive ? (
                  <Loader2 size={8} className="toggle-badge-spinner spin" />
                ) : null}
              </span>
            </span>
            <span className="toggle-badge-label">
              {product.isActive !== false ? "Active" : "Inactive"}
            </span>
          </button>
        </td>

        {/* Featured */}
        <td className="cell-featured">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(product.isFeatured)}
            className={`admin-toggle-badge ${product.isFeatured ? "featured" : "standard"
              }`}
            onClick={() =>
              onToggleFeatured(product._id, Boolean(product.isFeatured))
            }
            disabled={isTogglingFeatured}
            title={
              product.isFeatured
                ? "Featured — Click to remove from Featured"
                : "Standard — Click to set as Featured"
            }
          >
            <span className="toggle-badge-track">
              <span className="toggle-badge-thumb">
                {isTogglingFeatured ? (
                  <Loader2 size={8} className="toggle-badge-spinner spin" />
                ) : product.isFeatured ? (
                  <Star size={8} className="toggle-star-icon" />
                ) : null}
              </span>
            </span>
            <span className="toggle-badge-label">
              {product.isFeatured ? "Featured" : "Standard"}
            </span>
          </button>
        </td>

        {/* Actions */}
        <td className="cell-actions">
          <div className="product-actions">
            <button
              type="button"
              className="edit-btn"
              onClick={() => onEdit(product._id)}
              title="Edit product"
            >
              <Pencil size={15} />
              <span className="btn-text-mobile">Edit</span>
            </button>

            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(product._id)}
              disabled={isDeleting}
              title="Delete product"
            >
              {isDeleting ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Trash2 size={15} />
              )}
              <span className="btn-text-mobile">Delete</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }
);

ProductTableRow.displayName = "ProductTableRow";

const ProductList = () => {
  const navigate = useNavigate();

  const [allFetchedProducts, setAllFetchedProducts] = useState<Product[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.max(
    1,
    Number(searchParams.get("page")) || 1
  );
  const [perPage, setPerPage] = useState<number>(200);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // Server-side pagination state (if API provides server-side pagination)
  const [serverPagination, setServerPagination] = useState<{
    totalPages?: number;
    totalProducts?: number;
    currentPage?: number;
  } | null>(null);

  const fetchProducts = useCallback(
    async (pageToFetch = currentPage, limitToFetch = perPage) => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const queryParams = new URLSearchParams({
          page: String(pageToFetch),
          perPage: String(limitToFetch),
          limit: String(limitToFetch),
        });

        const response = await fetch(
          `${API_BASE_URL}/api/admin/all/products?${queryParams.toString()}`,
          { headers, credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Unable to reach backend product service");
        }

        const result = await response.json();

        // Extract products array from valid response format
        const productList: Product[] =
          result.data?.products ||
          result.products ||
          (Array.isArray(result.data) ? result.data : []) ||
          (Array.isArray(result) ? result : []);

        setAllFetchedProducts(productList);

        // Check if server returned explicit pagination info
        if (result.data?.pagination) {
          setServerPagination({
            totalPages: result.data.pagination.totalPages,
            totalProducts: result.data.pagination.totalProducts,
            currentPage: result.data.pagination.currentPage,
          });
        } else if (
          result.pagination ||
          result.totalPages ||
          result.totalProducts
        ) {
          setServerPagination({
            totalPages: result.pagination?.totalPages || result.totalPages,
            totalProducts:
              result.pagination?.totalProducts ||
              result.totalProducts ||
              result.total,
            currentPage:
              result.pagination?.currentPage || result.page || pageToFetch,
          });
        } else {
          setServerPagination(null);
        }
      } catch (err) {
        console.error("Fetch Products Error:", err);
        setError("Unable to load products. Please check your connection or login credentials.");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, perPage]
  );

  useEffect(() => {
    fetchProducts(currentPage, perPage);
  }, [currentPage, perPage, fetchProducts]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return allFetchedProducts.filter((product) => {
      if (!search.trim()) return true;
      const value = search.toLowerCase().trim();

      const catName =
        typeof product.category === "object"
          ? product.category?.name
          : product.category;

      const subCatName =
        typeof product.subcategory === "object"
          ? product.subcategory?.name
          : product.subcategory;

      return (
        product.name?.toLowerCase().includes(value) ||
        product.sku?.toLowerCase().includes(value) ||
        product.brand?.toLowerCase().includes(value) ||
        String(catName || "").toLowerCase().includes(value) ||
        String(subCatName || "").toLowerCase().includes(value)
      );
    });
  }, [allFetchedProducts, search]);

  // Statistics calculation for overview bar
  const stats = useMemo(() => {
    const total = allFetchedProducts.length;
    const active = allFetchedProducts.filter((p) => p.isActive !== false).length;
    const inactive = total - active;
    const featured = allFetchedProducts.filter((p) => Boolean(p.isFeatured)).length;
    const outOfStock = allFetchedProducts.filter((p) => Number(p.stock) <= 0).length;
    const lowStock = allFetchedProducts.filter(
      (p) => Number(p.stock) > 0 && Number(p.stock) <= 10
    ).length;

    return { total, active, inactive, featured, outOfStock, lowStock };
  }, [allFetchedProducts]);

  // Calculate dynamic pagination
  const isServerPaginated =
    serverPagination !== null &&
    typeof serverPagination.totalPages === "number" &&
    serverPagination.totalPages > 1 &&
    allFetchedProducts.length <= perPage;

  const totalProductsCount = isServerPaginated
    ? serverPagination.totalProducts || filteredProducts.length
    : filteredProducts.length;

  const totalPages = isServerPaginated
    ? serverPagination.totalPages || 1
    : Math.max(1, Math.ceil(filteredProducts.length / perPage));

  const effectivePage = Math.min(Math.max(1, currentPage), totalPages || 1);

  // If currentPage is out of range, normalize to page 1
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", "1");
        return params;
      });
    }
  }, [currentPage, totalPages, setSearchParams]);

  // Determine items to display on current page
  const displayedProducts = isServerPaginated
    ? filteredProducts
    : filteredProducts.slice(
      (effectivePage - 1) * perPage,
      effectivePage * perPage
    );

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const handlePageChange = (newPage: number) => {
    if (
      newPage >= 1 &&
      newPage <= totalPages &&
      newPage !== currentPage
    ) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", String(newPage));
        return params;
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const resetToFirstPage = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      return params;
    });
  };

  const handlePerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLimit = Number(e.target.value);
    setPerPage(newLimit);
    resetToFirstPage();
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(e.target.value);
    resetToFirstPage();
  };

  const handleDelete = useCallback(async (productId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to delete product");
      }

      // Refresh list
      await fetchProducts(currentPage, perPage);
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  }, [currentPage, perPage, fetchProducts]);

  // Optimistic Toggle for Active status (0ms delay)
  const handleToggleActive = useCallback(async (
    productId: string,
    currentActiveStatus: boolean
  ) => {
    const newStatus = !currentActiveStatus;
    setAllFetchedProducts((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, isActive: newStatus } : item
      )
    );

    try {
      setTogglingActiveId(productId);
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/active/${productId}`,
        {
          method: "PUT",
          headers,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to update product active status"
        );
      }

      const confirmedStatus =
        typeof result.data?.isActive === "boolean"
          ? result.data.isActive
          : typeof result.product?.isActive === "boolean"
            ? result.product.isActive
            : newStatus;

      if (confirmedStatus !== newStatus) {
        setAllFetchedProducts((prev) =>
          prev.map((item) =>
            item._id === productId ? { ...item, isActive: confirmedStatus } : item
          )
        );
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      setAllFetchedProducts((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, isActive: currentActiveStatus } : item
        )
      );
      alert(
        err instanceof Error
          ? err.message
          : "Failed to toggle product active status"
      );
    } finally {
      setTogglingActiveId(null);
    }
  }, []);

  // Optimistic Toggle for Featured status (0ms delay)
  const handleToggleFeatured = useCallback(async (
    productId: string,
    currentFeaturedStatus: boolean
  ) => {
    const newStatus = !currentFeaturedStatus;
    setAllFetchedProducts((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, isFeatured: newStatus } : item
      )
    );

    try {
      setTogglingFeaturedId(productId);
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/featured/${productId}`,
        {
          method: "PUT",
          headers,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to update product featured status"
        );
      }

      const confirmedStatus =
        typeof result.data?.isFeatured === "boolean"
          ? result.data.isFeatured
          : typeof result.product?.isFeatured === "boolean"
            ? result.product.isFeatured
            : newStatus;

      if (confirmedStatus !== newStatus) {
        setAllFetchedProducts((prev) =>
          prev.map((item) =>
            item._id === productId ? { ...item, isFeatured: confirmedStatus } : item
          )
        );
      }
    } catch (err) {
      console.error("Toggle featured error:", err);
      setAllFetchedProducts((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, isFeatured: currentFeaturedStatus } : item
        )
      );
      alert(
        err instanceof Error
          ? err.message
          : "Failed to toggle product featured status"
      );
    } finally {
      setTogglingFeaturedId(null);
    }
  }, []);

  const handleEdit = useCallback((productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  }, [navigate]);

  // Helper to generate page numbers
  const getPageNumbers = () => {
    const total = totalPages;
    const current = currentPage;
    const delta = 1;
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift("...");
    }
    if (current + delta < total - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range;
  };

  const startRecord =
    totalProductsCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endRecord = Math.min(currentPage * perPage, totalProductsCount);

  return (
    <section className="product-list-section">
      {/* Header */}
      <div className="product-list-header">
        <div className="header-info">
          <span className="product-list-eyebrow">PRODUCT MANAGEMENT</span>
          <h1>Products Catalog</h1>
          <p>
            Manage inventory, update listings, monitor stock levels, and publish new products.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="refresh-btn"
            onClick={() => fetchProducts(currentPage, perPage)}
            disabled={loading}
            title="Refresh Products"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="add-product-btn"
            onClick={() => navigate("/admin/add/product")}
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Chips */}
      {allFetchedProducts.length > 0 && (
        <div className="catalog-stats-bar">
          <div className="stat-chip">
            <Package size={15} className="stat-icon total" />
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>

          <div className="stat-chip">
            <CheckCircle2 size={15} className="stat-icon active" />
            <span className="stat-label">Active</span>
            <span className="stat-value">{stats.active}</span>
          </div>

          <div className="stat-chip">
            <XCircle size={15} className="stat-icon inactive" />
            <span className="stat-label">Inactive</span>
            <span className="stat-value">{stats.inactive}</span>
          </div>

          <div className="stat-chip">
            <Star size={15} className="stat-icon featured" />
            <span className="stat-label">Featured</span>
            <span className="stat-value">{stats.featured}</span>
          </div>

          {stats.outOfStock > 0 && (
            <div className="stat-chip alert">
              <AlertTriangle size={15} className="stat-icon danger" />
              <span className="stat-label">Out of Stock</span>
              <span className="stat-value">{stats.outOfStock}</span>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="product-toolbar">
        <div className="product-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, SKU, brand, or category..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearch("");
                const params = new URLSearchParams(searchParams);
                params.set("page", "1");
                setSearchParams(params);
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="toolbar-controls">
          <div className="per-page-selector">
            <label htmlFor="perPageSelect">Show:</label>
            <select
              id="perPageSelect"
              value={perPage}
              onChange={handlePerPageChange}
              disabled={loading}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
            </select>
          </div>

          <span className="product-count">
            Total: <strong>{totalProductsCount}</strong> items
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="product-error">
          <span>{error}</span>
          <button onClick={() => fetchProducts(currentPage, perPage)}>Retry</button>
        </div>
      )}

      {/* Content Area */}
      {loading && allFetchedProducts.length === 0 ? (
        <div className="product-loading">
          <Loader2 size={36} className="spin" />
          <p>Loading catalog products...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="product-empty">
          <div className="empty-icon-circle">
            <Package size={32} />
          </div>
          <h3>No products found</h3>
          <p>
            {search
              ? `No results match "${search}". Try checking your spelling or clear search filters.`
              : "Your catalog is empty. Click 'Add Product' to create your first product."}
          </p>
          {search ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSearch("");
                const params = new URLSearchParams(searchParams);
                params.set("page", "1");
                setSearchParams(params);
              }}
            >
              Clear Search
            </button>
          ) : (
            <button
              type="button"
              className="add-product-btn"
              onClick={() => navigate("/admin/add/product")}
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* =====================================================
              UNIFIED RESPONSIVE DATA TABLE
          ===================================================== */}
          <div className="product-table-wrapper">
            {loading && (
              <div className="table-loading-overlay">
                <Loader2 size={24} className="spin" />
                <span>Updating list...</span>
              </div>
            )}

            <table className="product-table">
              <thead>
                <tr>
                  <th className="th-product">Product</th>
                  <th className="th-sku">SKU</th>
                  <th className="th-category">Category</th>
                  <th className="th-price">Price</th>
                  <th className="th-stock">Stock</th>
                  <th className="th-status">Status</th>
                  <th className="th-featured">Featured</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>

              <tbody>
                {displayedProducts.map((product) => (
                  <ProductTableRow
                    key={product._id}
                    product={product}
                    isDeleting={deletingId === product._id}
                    isTogglingActive={togglingActiveId === product._id}
                    isTogglingFeatured={togglingFeaturedId === product._id}
                    onToggleActive={handleToggleActive}
                    onToggleFeatured={handleToggleFeatured}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* =====================================================
              PAGINATION FOOTER BAR
          ===================================================== */}
          {totalPages > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing <strong>{startRecord}</strong> to{" "}
                <strong>{endRecord}</strong> of{" "}
                <strong>{totalProductsCount}</strong> products
              </div>

              <div className="pagination-controls">
                {/* First Page */}
                <button
                  type="button"
                  className="pagination-btn pagination-nav-btn pagination-first-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1 || loading}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  className="pagination-btn pagination-nav-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPreviousPage || loading}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                {/* Mobile Page Indicator */}
                <div className="pagination-mobile-indicator">
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                </div>

                {/* Desktop Page Number Buttons */}
                <div className="pagination-pages">
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === "...") {
                      return (
                        <span key={`dots_${idx}`} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }

                    const num = Number(pageNum);
                    const isActive = num === currentPage;

                    return (
                      <button
                        key={`page_${num}`}
                        type="button"
                        className={`page-num-btn ${isActive ? "active" : ""}`}
                        onClick={() => handlePageChange(num)}
                        disabled={loading}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  className="pagination-btn pagination-nav-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || loading}
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  className="pagination-btn pagination-nav-btn pagination-last-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ProductList;