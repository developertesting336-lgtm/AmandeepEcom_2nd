import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, variantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // 1. Find Product
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is inactive",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    // 2. Validate Variant if product has variants
    let targetVariantId = null;
    if (product.hasVariants) {
      if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid variant option for this product",
        });
      }

      const matchedVariant = product.variants.find(
        (v) => v._id.toString() === variantId.toString() && v.isActive !== false
      );

      if (!matchedVariant) {
        return res.status(400).json({
          success: false,
          message: "Selected variant is unavailable or invalid",
        });
      }

      targetVariantId = matchedVariant._id;
    }

    // 3. Find or Create Cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [
          {
            product: productId,
            variantId: targetVariantId,
            quantity: Number(quantity),
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Product added to cart",
        data: { cart },
      });
    }

    // 4. Check for Existing Item matching BOTH product and variantId
    const existingItem = cart.items.find((item) => {
      const sameProduct = item.product.toString() === productId;
      const sameVariant = targetVariantId
        ? item.variantId && item.variantId.toString() === targetVariantId.toString()
        : !item.variantId;
      return sameProduct && sameVariant;
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + Number(quantity);

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} item(s) available in stock`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        variantId: targetVariantId,
        quantity: Number(quantity),
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
      error: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {

    // console.log("cart api hitted")
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate({
      path: "items.product",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalItems: 0,
          subtotal: 0,
        },
      });
    }

    let subtotal = 0;
    let totalItems = 0;

    const items = cart.items
      .filter((item) => item.product && item.product.isActive)
      .map((item) => {
        const product = item.product;
        let price =
          product.salePrice && product.salePrice > 0
            ? product.salePrice
            : product.price;
        let selectedVariant = null;

        // Extract variant pricing & attributes if product has variants
        if (product.hasVariants && item.variantId && Array.isArray(product.variants)) {
          const variant = product.variants.find(
            (v) => v._id.toString() === item.variantId.toString()
          );

          if (variant) {
            price =
              variant.salePrice && variant.salePrice > 0
                ? variant.salePrice
                : variant.price;

            selectedVariant = {
              _id: variant._id,
              price: variant.price,
              salePrice: variant.salePrice,
              attributes: variant.attributes || [],
              isActive: variant.isActive !== false,
            };
          }
        }

        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        totalItems += item.quantity;

        return {
          _id: item._id,
          product,
          variantId: item.variantId || null,
          variant: selectedVariant,
          price,
          quantity: item.quantity,
          lineTotal,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        items,
        totalItems,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, variantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Match by item._id OR by product (+ optional variantId)
    const item = cart.items.find((i) => {
      if (i._id && i._id.toString() === productId) return true;
      const sameProduct = i.product.toString() === productId;
      if (!sameProduct) return false;
      if (variantId !== undefined) {
        return variantId
          ? i.variantId && i.variantId.toString() === variantId.toString()
          : !i.variantId;
      }
      return true;
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    item.quantity = Number(quantity);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantId = req.query.variantId || req.body?.variantId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Filter out item by item._id OR by product (+ optional variantId)
    const initialCount = cart.items.length;
    cart.items = cart.items.filter((item) => {
      if (item._id && item._id.toString() === productId) return false;
      const sameProduct = item.product.toString() === productId;
      if (!sameProduct) return true;
      if (variantId !== undefined) {
        const sameVariant = variantId
          ? item.variantId && item.variantId.toString() === variantId.toString()
          : !item.variantId;
        return !sameVariant;
      }
      return false;
    });

    if (cart.items.length === initialCount) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data: { cart },
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product",
      error: error.message,
    });
  }
};