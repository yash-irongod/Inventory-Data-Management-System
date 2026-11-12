const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, fallback, field, maximum) => {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value))) {
    const error = new Error(`${field} must be a positive integer`);
    error.statusCode = 400;
    throw error;
  }

  const parsed = Number(value);
  if (parsed < 1 || (maximum && parsed > maximum)) {
    const error = new Error(`${field} must be between 1 and ${maximum || Number.MAX_SAFE_INTEGER}`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    name,
    category,
    supplier,
    minPrice,
    maxPrice,
    minQuantity,
    maxQuantity,
    lowStock,
    sort
  } = req.query;

  const page = parsePositiveInteger(req.query.page, 1, "page");
  const limit = parsePositiveInteger(req.query.limit, 10, "limit", 100);
  const filter = {};

  if (search) {
    const expression = new RegExp(escapeRegex(String(search)), "i");
    filter.$or = [{ name: expression }, { sku: expression }, { category: expression }, { supplier: expression }];
  }
  if (name) filter.name = new RegExp(escapeRegex(String(name)), "i");
  if (category) filter.category = new RegExp(`^${escapeRegex(String(category))}$`, "i");
  if (supplier) filter.supplier = new RegExp(escapeRegex(String(supplier)), "i");

  const priceFilter = {};
  if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
  if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length > 0) {
    if (Object.values(priceFilter).some((value) => !Number.isFinite(value) || value < 0)) {
      const error = new Error("Price filters must be non-negative numbers");
      error.statusCode = 400;
      throw error;
    }
    filter.price = priceFilter;
  }

  const quantityFilter = {};
  if (minQuantity !== undefined) quantityFilter.$gte = Number(minQuantity);
  if (maxQuantity !== undefined) quantityFilter.$lte = Number(maxQuantity);
  if (Object.keys(quantityFilter).length > 0) {
    if (Object.values(quantityFilter).some((value) => !Number.isInteger(value) || value < 0)) {
      const error = new Error("Quantity filters must be non-negative whole numbers");
      error.statusCode = 400;
      throw error;
    }
    filter.quantity = quantityFilter;
  }

  if (lowStock === "true") {
    filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  } else if (lowStock !== undefined && lowStock !== "false") {
    const error = new Error("lowStock must be true or false");
    error.statusCode = 400;
    throw error;
  }

  const sortFields = ["name", "sku", "category", "price", "quantity", "createdAt", "updatedAt"];
  const sortField = sort ? String(sort).replace(/^-/, "") : "createdAt";
  if (!sortFields.includes(sortField)) {
    const error = new Error(`sort must be one of: ${sortFields.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const sortOrder = sort && String(sort).startsWith("-") ? -1 : sort ? 1 : -1;
  const sortOptions = { [sortField]: sortOrder };
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOptions).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);

  res.status(200).json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.status(200).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true, context: "query" }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.status(200).json(product);
});

const adjustStock = asyncHandler(async (req, res) => {
  const change = req.body && req.body.change;

  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({ message: "change must be a non-zero whole number" });
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      $expr: { $gte: [{ $add: ["$quantity", change] }, 0] }
    },
    { $inc: { quantity: change } },
    { new: true }
  );

  if (product) {
    return res.status(200).json({ message: "Stock updated", product });
  }

  const existingProduct = await Product.findById(req.params.id);
  if (!existingProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(400).json({ message: "Stock quantity cannot become negative" });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json({ message: "Product deleted", id: product._id });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] }
  }).sort({ quantity: 1, name: 1 });

  res.status(200).json({
    count: lowStockItems.length,
    lowStockItems
  });
});

const getInventorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    categories: summary.length,
    summary
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStockProducts,
  getInventorySummary
};
