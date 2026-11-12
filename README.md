# Inventory and Data Management System

REST API built with Node.js, Express.js, MongoDB, Mongoose and dotenv.

## Requirements

- Node.js
- MongoDB running locally or a MongoDB connection string

## Setup

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGO_URI` if your MongoDB connection is different.

3. Start the server:

   ```bash
   npm start
   ```

The API runs at `http://localhost:5000` by default.

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create a product |
| GET | `/api/products` | List products with filtering, sorting and pagination |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update one or more product details |
| PATCH | `/api/products/:id/stock` | Increase or decrease stock |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | Get products at or below their reorder level |
| GET | `/api/products/summary` | Get category-wise inventory summary |

## Product fields

`name`, `sku`, `category`, `price`, `quantity`, `reorderLevel`, and `supplier`.

`reorderLevel` defaults to `10`. The `stockValue` field is calculated as `price * quantity`.

## Filtering, sorting and pagination

`GET /api/products` supports these query parameters:

- `search`: search name, SKU, category or supplier
- `name`, `category`, `supplier`
- `minPrice`, `maxPrice`
- `minQuantity`, `maxQuantity`
- `lowStock=true`
- `sort`: field name for ascending order or prefix it with `-` for descending order
- `page` and `limit` (default `1` and `10`; maximum limit is `100`)

Example:

```text
GET /api/products?category=Electronics&minPrice=100&sort=-price&page=1&limit=10
```

## Stock adjustment

Send a non-zero whole number in `change`. Positive values add stock and negative values record a sale. The API does not allow stock to become negative.

```json
{
  "change": 10
}
```

## Postman

Import `postman/Inventory_Data_Management_System.postman_collection.json` into Postman. The collection includes requests for creating, listing, filtering, viewing, updating, adjusting and deleting products, and for both inventory reports.
