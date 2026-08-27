import React from 'react';
import './Featured.css';

interface Product {
    id: number;
    category: 'ELECTRONICS' | 'FASHION' | 'TOYS';
    title: string;
    image: string;
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    rating: number;
}

const products: Product[] = [
    {
        id: 1,
        category: 'ELECTRONICS',
        title: 'RGB Gaming Mouse',
        // New, high-resolution source for a gaming mouse
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop',
        originalPrice: 1499,
        discountedPrice: 1199,
        discountPercentage: 20,
        rating: 4.5,
    },
    {
        id: 2,
        category: 'FASHION',
        title: 'Tango shirt',
        // New, high-resolution source for a light blue button-down shirt
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
        originalPrice: 600,
        discountedPrice: 500,
        discountPercentage: 17,
        rating: 4.2,
    },
    {
        id: 3,
        category: 'FASHION',
        title: 'Leather Tote Bag',
        // New, high-resolution source for a brown leather tote bag
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop',
        originalPrice: 500,
        discountedPrice: 400,
        discountPercentage: 20,
        rating: 4.7,
    },
    {
        id: 4,
        category: 'TOYS',
        title: 'Classic Train Set',
        // New, high-resolution source for a wooden toy train
        image: 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?q=80&w=600&auto=format&fit=crop',
        originalPrice: 4400,
        discountedPrice: 10,
        discountPercentage: 100,
        rating: 4.9,
    },
];



const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="product-card">
        <div className="card-image-container">
            <img src={product.image} alt={product.title} className="product-image" />
            <span className="discount-badge">-{product.discountPercentage}% OFF</span>
            <button className="wishlist-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
        </div>
        <div className="card-details">
            <div className="category-rating">
                <span className="product-category">{product.category}</span>
                <div className="product-rating">
                    <span className="star-icon">★</span> {product.rating}
                </div>
            </div>
            <h3 className="product-title">{product.title}</h3>
            <div className="price-cart">
                <div className="product-prices">
                    <span className="discounted-price">₹{product.discountedPrice.toLocaleString()}</span>
                    <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                </div>
                <button className="add-to-cart-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    Add to Cart
                </button>
            </div>
        </div>
    </div>
);

const FeaturedProducts: React.FC = () => {
    return (
        <section className="featured-products-section">
            <div className="container">
                <header className="section-header">
                    <div className="header-titles">
                        <span className="sub-header">CURATED COLLECTION</span>
                        <h1 className="main-header">Featured Products</h1>
                    </div>
                    <div className="header-filters">
                        <button className="view-all-button">View All</button>
                    </div>
                </header>

                <div className="product-carousel">
                    <button className="carousel-control prev">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    <button className="carousel-control next">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;