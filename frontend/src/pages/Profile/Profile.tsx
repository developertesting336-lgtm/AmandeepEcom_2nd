import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<unknown[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setProducts([]);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <main className="dashboard">

      {/* Welcome */}
      <section className="dashboard-welcome">

        <div>
          <p className="dashboard-eyebrow">
            MY ACCOUNT
          </p>

          <h1>
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>

          <p className="welcome-description">
            Manage your account and explore our products.
          </p>
        </div>

        <Link
          to="/products"
          className="dashboard-primary-btn"
        >
          Browse Products
        </Link>

      </section>


      {/* Quick Information */}
      <section className="dashboard-overview">

        <div className="overview-item">
          <span>Orders</span>
          <strong>—</strong>
          <small>Your orders</small>
        </div>

        <div className="overview-item">
          <span>Cart</span>
          <strong>—</strong>
          <small>Items in cart</small>
        </div>

        <div className="overview-item">
          <span>Account</span>
          <strong>Active</strong>
          <small>Your account status</small>
        </div>

      </section>


      {/* Products */}
      <section className="dashboard-products">

        <div className="section-heading">

          <div>
            <p className="dashboard-eyebrow">
              SHOP
            </p>

            <h2>Products</h2>
          </div>

          <Link to="/products">
            View all →
          </Link>

        </div>


        {loadingProducts && (
          <div className="products-loading">

            <div className="loading-spinner" />

            <p>Loading products...</p>

          </div>
        )}


        {!loadingProducts && products.length === 0 && (
          <div className="products-empty">

            <h3>No products available</h3>

            <p>
              Products will appear here when they become available.
            </p>

          </div>
        )}


        {!loadingProducts && products.length > 0 && (
          <div className="products-grid">

            {products.map((_, index) => (
              <div
                className="product-card"
                key={index}
              >
                Product
              </div>
            ))}

          </div>
        )}

      </section>

    </main>
  );
};

export default Dashboard;