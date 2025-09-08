# AsanZindegi Demo API

Base URL (dev): http://localhost:4200

All responses are JSON. These endpoints serve demo data from static JSON and generated fixtures.

## Resources

- Categories
- Service Types
- Providers
- Listings

---

## GET /api/categories
Returns the list of categories.

Response: 200 OK
[
  { "id": 1, "name": "Plumbing" },
  ...
]

---

## GET /api/service-types
Query params (optional):
- categoryId: number
- categoryName: string

Response: 200 OK
[
  { "id": 1, "name": "Leak Fix", "categoryId": 1 },
  ...
]

---

## GET /api/providers
Query params (optional):
- categoryId: number
- categoryName: string

Response: 200 OK
[
  { "id": 1, "name": "Provider Demo", "categoryId": 1, "avatar": "..." },
  ...
]

---

## GET /api/listings
Returns paginated demo listings. Supports filtering.

Query params (optional):
- category: string (exact match)
- type: string (Sell|Rent|Exchange|Service)
- location: string (substring match)
- minPrice: number
- maxPrice: number
- minRating: number (1..5)
- verified: string ("verified" | "unverified")
- page: number (default 1)
- perPage: number (default 10, max 50)

Response: 200 OK
{
  "page": 1,
  "perPage": 10,
  "total": 640,
  "items": [
    {
      "id": 1,
      "title": "Leak Fix - Plumbing",
      "category": "Plumbing",
      "type": "Service",
      "location": "Chennai, India",
      "price": 499,
      "unit": "per visit",
      "cover": "...",
      "date": "2024-08-01",
      "views": 250,
      "rating": 5,
      "verified": true,
      "verifiedType": "Company"
    }
  ]
}

---

## GET /api/listings/:id
Returns a single listing by id.

Response: 200 OK
{ ...listing }

404 if not found.

---

## Notes
- Data files live under public/data/*.json and are copied to the build output.
- Listings are generated deterministically per request using category fixtures to keep bundle size small.
- This API is for demo/dev only; no authentication or persistence is provided.
