import Product from '../models/Product.js'
import UserViewProfile from '../models/UserViewProfile.js'
import User from '../models/user.js'

export async function trackView(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) return;

    // decide: use salePrice if it exists, otherwise price
    const effectivePrice = product.salePrice ?? product.price;
    const priceRange = getPriceRangeBucket(effectivePrice);

    const existingProfile = await UserViewProfile.findOne({
        user: userId,
        "viewedProducts.product": productId
    });


    const existingView = existingProfile?.viewedProducts.find(
        item => item.product.toString() === productId.toString()
    );

    const now = new Date();

    const shouldCount =
        !existingView ||
        now - existingView.lastViewedAt > 10 * 60 * 1000;
    if (shouldCount) {
        // 1. increment existing product entry
        const productUpdated = await UserViewProfile.findOneAndUpdate(
            { user: userId, "viewedProducts.product": productId },
            {
                $inc: { "viewedProducts.$.viewCount": 1 },
                $set: { "viewedProducts.$.lastViewedAt": new Date(), updatedAt: new Date() }
            }
        );

        // 2. otherwise push new entry, capped at 200
        if (!productUpdated) {
            await UserViewProfile.findOneAndUpdate(
                { user: userId },
                {
                    $push: {
                        viewedProducts: {
                            $each: [{ product: productId, viewCount: 1, lastViewedAt: new Date() }],
                            $slice: -10
                        }
                    },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true }
            );
        }

        // 3. category preference — matching by ObjectId now
        const categoryUpdated = await UserViewProfile.findOneAndUpdate(
            { user: userId, "categoryPreferences.category": product.category },
            { $inc: { "categoryPreferences.$.viewCount": 1 } }
        );
        if (!categoryUpdated) {
            await UserViewProfile.findOneAndUpdate(
                { user: userId },
                { $push: { categoryPreferences: { category: product.category, viewCount: 1 } } },
                { upsert: true }
            );
        }

        // 4. price range preference
        const priceUpdated = await UserViewProfile.findOneAndUpdate(
            { user: userId, "priceRangePreferences.min": priceRange.min, "priceRangePreferences.max": priceRange.max },
            { $inc: { "priceRangePreferences.$.viewCount": 1 } }
        );
        if (!priceUpdated) {
            await UserViewProfile.findOneAndUpdate(
                { user: userId },
                { $push: { priceRangePreferences: { ...priceRange, viewCount: 1 } } },
                { upsert: true }
            );
        }
    }
}

function getPriceRangeBucket(price) {
    const bucketSize = 5000;
    const min = Math.floor(price / bucketSize) * bucketSize;
    return { min, max: min + bucketSize };
}