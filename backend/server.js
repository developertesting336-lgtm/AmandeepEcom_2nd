import dns from 'dns'
dns.setDefaultResultOrder("ipv4first")
dns.setServers(["8.8.8.8", "8.8.4.4"])
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from './routes/auth.routes.js'
import dashboard from './routes/dashboard.routes.js'
import path from "path";
import adminProducts from './routes/admin.products.routes.js'
import userProducts from './routes/user.products.js'
import tagline from './routes/tagline.routes.js'
import cartRoutes from './routes/cart.routes.js'
import order from './routes/user.order.js'
// import stripe from './config/stripe.js'
import { stripeWebhook } from './controllers/user.order.js'
import adminOrderRoutes from './routes/admin.order.js'
import adminUserRoutes from './routes/admin.users.routes.js'
import googleAuth from './routes/oauth.js'
import notificationRoutes from './routes/notification.routes.js'
import cookieParser from "cookie-parser";


dotenv.config();
// console.log({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// })

const app = express();





app.post(
  "/api/order/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);




// app.use(cors());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "https://amandeep2nd.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

const PORT = process.env.PORT || 5000;
connectDB()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/status', (req, res) => {
  res.send("working")
})


app.use('/api/auth', authRoutes)
app.use('/api/auth/google', googleAuth)
app.use('/api/dashboard', dashboard)
app.use('/api/admin', adminProducts)
app.use('/api', tagline)
app.use('/api', cartRoutes)

app.use('/api', userProducts)
// app.post('api/payment/create-checkout-session',)
app.use('/api/order', order)

app.use('/api/admin/order', adminOrderRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/notifications', notificationRoutes)






app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

