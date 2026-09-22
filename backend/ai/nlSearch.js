import groq from "./groq.js";

/**
 * Parses a raw / natural language search query into structured search filters using Groq LLM.
 * 
 * @param {string} rawQuery - The conversational or raw search query from the user.
 * @param {Object} [options={}] - Optional context such as available categories or brands.
 * @returns {Promise<Object|null>} Structured intent object or null if parsing fails / times out.
 */
export const parseNaturalLanguageSearch = async (rawQuery, options = {}) => {
  if (!rawQuery || typeof rawQuery !== "string" || !rawQuery.trim()) {
    return null;
  }

  const query = rawQuery.trim();

  // If the query is just a single short word, standard fuzzy/regex search is usually sufficient and faster.
  // Still allow parsing if it contains numbers/currency signs or intent words.
  const hasPriceOrIntent = /(under|below|above|over|between|cheap|budget|costly|expensive|latest|new|best|sale|discount|\d+)/i.test(query);
  const wordCount = query.split(/\s+/).length;

  if (wordCount < 2 && !hasPriceOrIntent) {
    return null;
  }

  const systemPrompt = `
You are an expert e-commerce search query parser for a multi-category retail store.
Store Categories:
- Fashion (Subcategories: Men's Clothing, Women's Clothing, Kids' Clothing, Footwear, Fashion Accessories, Innerwear & Sleepwear, Ethnic Wear, Watches)
- Electronics (Subcategories: Mobile Phones, Televisions, Laptops, Desktop Computers, Computer Accessories, Cameras, Camera Accessories)
- Home & Living (Subcategories: Kitchen & Dining, Home Decor & Lighting, Furniture, Bedding & Mattresses)
- Sports & Outdoors (Subcategories: Fitness & Gym Equipment, Outdoor & Cycling, Sports Gear & Accessories, Camping & Hiking)
- Beauty & Health (Subcategories: Skincare, Haircare & Styling, Fragrances & Perfumes, Health & Personal Care)
- Toys & Games (Subcategories: Building Sets & STEM, Board Games & Puzzles, Remote Control & Drones, Action Figures & Collectibles)
- Grocery (Subcategories: Snacks & Beverages, Staples & Cooking Essential, Breakfast & Dairy, Organic & Gourmet Foods)

Analyze the user's natural language or raw search query and extract structured search parameters into pure JSON.

Available Schema to return:
{
  "keywords": "core product nouns/terms cleaned of filler words (e.g., 'wireless earbuds', 'running shoes', 'cotton t-shirt')",
  "category": "matched store main category or null (e.g., 'Fashion', 'Electronics', 'Home & Living')",
  "subcategory": "matched store subcategory or null (e.g., 'Men\\'s Clothing', 'Footwear', 'Laptops')",
  "brand": "extracted brand name or null (e.g., 'Nike', 'Apple', 'Samsung', 'US POLLO')",
  "minPrice": number or null,
  "maxPrice": number or null,
  "sort": "price_asc" | "price_desc" | "newest" | "name_asc" | null,
  "attributes": ["array", "of", "colors", "specs", "materials", "or", "styles"],
  "inStockOnly": boolean
}

PARSING RULES:
1. "under 1000", "below 500", "less than 2000", "< 2000" -> set maxPrice.
2. "above 1000", "more than 500", "over 2000", "> 500" -> set minPrice.
3. "between 1000 and 3000" -> set minPrice and maxPrice.
4. "cheap", "budget", "affordable", "low price" -> sort: "price_asc".
5. "expensive", "premium", "luxury", "high end" -> sort: "price_desc".
6. "latest", "newest", "recent" -> sort: "newest".
7. "in stock", "available now" -> inStockOnly: true.
8. Strip out pricing phrases, filler words ("for me", "show me", "i want", "cheap", "best"), and keep only the core searchable item names in "keywords".
9. Extract colors, sizes, or materials into "attributes" (e.g., ["red", "cotton"]).
10. Return ONLY a valid JSON object matching the schema.
`;

  try {
    const parsePromise = groq.chat.completions.create({
      model: process.env.GROQ_SEARCH_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Search Query: "${query}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_completion_tokens: 300,
    });

    // 2.5 second timeout safeguard so search stays fast
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Groq NL search parse timeout")), 2500)
    );

    const completion = await Promise.race([parsePromise, timeoutPromise]);
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return null;
    }

    const parsed = JSON.parse(responseContent);

    // Clean up and sanitize parsed values
    const result = {
      rawQuery: query,
      keywords: typeof parsed.keywords === "string" ? parsed.keywords.trim() : query,
      category: typeof parsed.category === "string" ? parsed.category.trim() : null,
      subcategory: typeof parsed.subcategory === "string" ? parsed.subcategory.trim() : null,
      brand: typeof parsed.brand === "string" ? parsed.brand.trim() : null,
      minPrice: typeof parsed.minPrice === "number" && !isNaN(parsed.minPrice) && parsed.minPrice >= 0 ? parsed.minPrice : null,
      maxPrice: typeof parsed.maxPrice === "number" && !isNaN(parsed.maxPrice) && parsed.maxPrice >= 0 ? parsed.maxPrice : null,
      sort: typeof parsed.sort === "string" ? parsed.sort : null,
      attributes: Array.isArray(parsed.attributes) ? parsed.attributes.filter((a) => typeof a === "string" && a.trim()) : [],
      inStockOnly: Boolean(parsed.inStockOnly),
    };

    return result;
  } catch (error) {
    console.warn("⚠️ [NL Search] AI Parsing skipped or timed out, falling back to standard search:", error.message);
    return null;
  }
};

export default parseNaturalLanguageSearch;
