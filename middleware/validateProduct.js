const allowedFields = [
  "name",
  "sku",
  "category",
  "price",
  "quantity",
  "reorderLevel",
  "supplier"
];

const requiredFields = ["name", "sku", "category", "price", "quantity", "supplier"];

const validateProduct = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }

  const fields = Object.keys(body);
  if (fields.length === 0) {
    return res.status(400).json({ message: "Request body cannot be empty" });
  }

  const unknownFields = fields.filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    return res.status(400).json({
      message: "Unknown product field",
      fields: unknownFields
    });
  }

  const missingFields = requiredFields.filter((field) => {
    return req.method === "POST" &&
      (body[field] === undefined || body[field] === null || body[field] === "");
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required product fields",
      fields: missingFields
    });
  }

  next();
};

module.exports = validateProduct;
