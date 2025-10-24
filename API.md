# API Documentation

**Base URL:** `http://kunalc-001-site1.ktempurl.com`

---

## Table of Contents

1. [User Authentication API](#user-authentication-api)
2. [Category API](#category-api)
3. [Account Service API](#account-service-api)
4. [Ads Service API](#ads-service-api)
5. [Listings Service API](#listings-service-api)
6. [Error Handling](#error-handling)

---

## User Authentication API

### 1. User Login

**URL:** `/api/User/login`

**Request Type:** POST

**Request Payload:**

```json
{
  "email": string,
  "password": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number (optional),
  "status_message": string (optional),
  "data": any
}
```

---

### 2. Forgot Password

**URL:** `/api/User/forgot-password`

**Request Type:** POST

**Request Payload:**

```json
{
  "email": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number (optional),
  "status_message": string (optional)
}
```

---

### 3. Reset Password

**URL:** `/api/User/reset-password`

**Request Type:** POST

**Request Payload:**

```json
{
  "email": string,
  "token": string,
  "newPassword": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number (optional),
  "status_message": string (optional)
}
```

---

### 4. User Register

**URL:** `/api/User/register`

**Request Type:** POST

**Request Payload:**

```json
{
  "email": string,
  "firstName": string,
  "lastName": string,
  "password": string,
  "role": string,
  "company": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number (optional),
  "status_message": string (optional),
  "data": any
}
```

---

## Category API

### 5. Get Categories with Super Categories

**URL:** `/api/Category`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "data": [
    {
      "id": number,
      "title": string,
      "colorClass": string,
      "icon": string,
      "categories": [
        {
          "id": number,
          "name": string,
          "icon": string,
          "count": number,
          "superCategoryId": number
        }
      ]
    }
  ]
}
```

---

## Account Service API

These endpoints manage provider accounts (Individual and Company profiles).

### 6. Register Individual Account

**URL:** `/api/account/register/individual`

**Request Type:** POST

**Request Payload:**

```json
{
  "fullName": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Individual",
    "fullName": string,
    "email": string,
    "phone": string,
    "createdAt": string (ISO date)
  }
}
```

---

### 7. Register Company Account

**URL:** `/api/account/register/company`

**Request Type:** POST

**Request Payload:**

```json
{
  "companyName": string,
  "contactName": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": [],
    "verification": {
      "status": "Unverified"
    },
    "createdAt": string (ISO date)
  }
}
```

---

### 8. Get Current Account

**URL:** `/api/account/me`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Individual" | "Company",
    "email": string,
    "phone": string,
    "createdAt": string,
    "fullName": string (for Individual),
    "companyName": string (for Company),
    "contactName": string (for Company),
    "personnel": array (for Company),
    "verification": object (for Company)
  }
}
```

---

### 9. Update Individual Profile

**URL:** `/api/account/individual/profile`

**Request Type:** PUT

**Request Payload:**

```json
{
  "fullName": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Individual",
    "fullName": string,
    "email": string,
    "phone": string,
    "createdAt": string
  }
}
```

---

### 10. Update Company Profile

**URL:** `/api/account/company/profile`

**Request Type:** PUT

**Request Payload:**

```json
{
  "companyName": string,
  "contactName": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": array,
    "verification": object,
    "createdAt": string
  }
}
```

---

### 11. Add Personnel

**URL:** `/api/account/company/personnel`

**Request Type:** POST

**Request Payload:**

```json
{
  "name": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": [
      {
        "id": number,
        "name": string,
        "email": string,
        "phone": string
      }
    ],
    "verification": object,
    "createdAt": string
  }
}
```

---

### 12. Remove Personnel

**URL:** `/api/account/company/personnel/{id}`

**Request Type:** DELETE

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": array,
    "verification": object,
    "createdAt": string
  }
}
```

---

### 13. Update Personnel

**URL:** `/api/account/company/personnel/{id}`

**Request Type:** PUT

**Request Payload:**

```json
{
  "id": number,
  "name": string,
  "email": string,
  "phone": string
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": [
      {
        "id": number,
        "name": string,
        "email": string,
        "phone": string
      }
    ],
    "verification": object,
    "createdAt": string
  }
}
```

---

### 14. Submit Company Verification

**URL:** `/api/account/company/verification/submit`

**Request Type:** POST

**Request Payload:**

```json
{
  "note": string (optional),
  "documents": string[] (optional, array of document URLs or paths)
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": array,
    "verification": {
      "status": "Pending",
      "submittedAt": string (ISO date),
      "note": string (optional)
    },
    "createdAt": string
  }
}
```

---

### 15. Mark Company as Verified

**URL:** `/api/account/company/verification/approve`

**Request Type:** POST

**Request Payload:**

```json
{
  "note": string (optional)
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "type": "Company",
    "companyName": string,
    "contactName": string,
    "email": string,
    "phone": string,
    "personnel": array,
    "verification": {
      "status": "Verified",
      "submittedAt": string (ISO date),
      "verifiedAt": string (ISO date),
      "note": string (optional)
    },
    "createdAt": string
  }
}
```

---

## Ads Service API

These endpoints manage advertisements/postings created by providers.

### 16. Create Ad

**URL:** `/api/ads`

**Request Type:** POST

**Request Payload:**

```json
{
  "title": string,
  "category": string,
  "type": "Sell" | "Rent" | "Exchange" | "Service",
  "location": string,
  "price": number,
  "unit": string (optional),
  "cover": string,
  "personnelId": number (optional, for company personnel)
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "title": string,
    "category": string,
    "type": "Sell" | "Rent" | "Exchange" | "Service",
    "location": string,
    "price": number,
    "unit": string (optional),
    "cover": string,
    "date": string (ISO date),
    "views": number,
    "rating": number,
    "verified": boolean,
    "verifiedType": "Company" | "KYC" (optional),
    "accountId": number,
    "accountType": "Individual" | "Company",
    "companyName": string (optional),
    "contactName": string,
    "contactEmail": string,
    "contactPhone": string
  }
}
```

---

### 17. Get All Ads (with pagination)

**URL:** `/api/ads`

**Request Type:** GET

**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 20)
category: string (optional)
location: string (optional)
type: "Sell" | "Rent" | "Exchange" | "Service" (optional)
verified: boolean (optional)
```

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "title": string,
      "category": string,
      "type": "Sell" | "Rent" | "Exchange" | "Service",
      "location": string,
      "price": number,
      "unit": string (optional),
      "cover": string,
      "date": string (ISO date),
      "views": number,
      "rating": number,
      "verified": boolean,
      "verifiedType": "Company" | "KYC" (optional),
      "accountId": number,
      "accountType": "Individual" | "Company",
      "companyName": string (optional),
      "contactName": string,
      "contactEmail": string,
      "contactPhone": string
    }
  ]
}
```

---

### 18. Get Ad by ID

**URL:** `/api/ads/{id}`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "title": string,
    "category": string,
    "type": "Sell" | "Rent" | "Exchange" | "Service",
    "location": string,
    "price": number,
    "unit": string (optional),
    "cover": string,
    "date": string (ISO date),
    "views": number,
    "rating": number,
    "verified": boolean,
    "verifiedType": "Company" | "KYC" (optional),
    "accountId": number,
    "accountType": "Individual" | "Company",
    "companyName": string (optional),
    "contactName": string,
    "contactEmail": string,
    "contactPhone": string
  }
}
```

---

### 19. Get Ads by Account

**URL:** `/api/ads/account/{accountId}`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "title": string,
      "category": string,
      "type": "Sell" | "Rent" | "Exchange" | "Service",
      "location": string,
      "price": number,
      "unit": string (optional),
      "cover": string,
      "date": string (ISO date),
      "views": number,
      "rating": number,
      "verified": boolean,
      "verifiedType": "Company" | "KYC" (optional),
      "accountId": number,
      "accountType": "Individual" | "Company",
      "companyName": string (optional),
      "contactName": string,
      "contactEmail": string,
      "contactPhone": string
    }
  ]
}
```

---

### 20. Update Ad

**URL:** `/api/ads/{id}`

**Request Type:** PUT

**Request Payload:**

```json
{
  "title": string (optional),
  "category": string (optional),
  "type": "Sell" | "Rent" | "Exchange" | "Service" (optional),
  "location": string (optional),
  "price": number (optional),
  "unit": string (optional),
  "cover": string (optional),
  "views": number (optional),
  "rating": number (optional)
}
```

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "title": string,
    "category": string,
    "type": "Sell" | "Rent" | "Exchange" | "Service",
    "location": string,
    "price": number,
    "unit": string (optional),
    "cover": string,
    "date": string (ISO date),
    "views": number,
    "rating": number,
    "verified": boolean,
    "verifiedType": "Company" | "KYC" (optional),
    "accountId": number,
    "accountType": "Individual" | "Company",
    "companyName": string (optional),
    "contactName": string,
    "contactEmail": string,
    "contactPhone": string
  }
}
```

---

### 21. Delete Ad

**URL:** `/api/ads/{id}`

**Request Type:** DELETE

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "success": boolean
  }
}
```

---

### 22. Get Provider Metadata for Listing

**URL:** `/api/ads/{id}/provider`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "companyName": string,
    "contactName": string,
    "contactEmail": string,
    "contactPhone": string
  }
}
```

---

## Listings Service API

These endpoints provide read-only access to the product catalog (categories, services, listings, providers).

### 23. Get All Listings (with pagination)

**URL:** `/api/catalog/listings`

**Request Type:** GET

**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 20)
category: string (optional)
type: "Sell" | "Rent" | "Exchange" | "Service" (optional)
```

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "title": string,
      "category": string,
      "type": "Sell" | "Rent" | "Exchange" | "Service",
      "location": string,
      "price": number,
      "unit": string (optional),
      "cover": string,
      "date": string (ISO date),
      "views": number,
      "rating": number,
      "verified": boolean,
      "verifiedType": "Company" | "KYC" (optional)
    }
  ]
}
```

---

### 24. Get Listing by ID

**URL:** `/api/catalog/listings/{id}`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": {
    "id": number,
    "title": string,
    "category": string,
    "type": "Sell" | "Rent" | "Exchange" | "Service",
    "location": string,
    "price": number,
    "unit": string (optional),
    "cover": string,
    "date": string (ISO date),
    "views": number,
    "rating": number,
    "verified": boolean,
    "verifiedType": "Company" | "KYC" (optional)
  }
}
```

---

### 25. Get All Categories

**URL:** `/api/catalog/categories`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "name": string
    }
  ]
}
```

---

### 26. Get All Service Types

**URL:** `/api/catalog/service-types`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "name": string,
      "categoryId": number
    }
  ]
}
```

---

### 27. Get Service Types by Category

**URL:** `/api/catalog/categories/{categoryName}/service-types`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "name": string,
      "categoryId": number
    }
  ]
}
```

---

### 28. Get Providers by Category

**URL:** `/api/catalog/categories/{categoryName}/providers`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "name": string,
      "categoryId": number,
      "avatar": string
    }
  ]
}
```

---

### 29. Get Service Types for Listing

**URL:** `/api/catalog/listings/{listingId}/service-types`

**Request Type:** GET

**Request Payload:** None

**Response Format:**

```json
{
  "message": string,
  "status_code": number,
  "data": [
    {
      "id": number,
      "name": string,
      "categoryId": number
    }
  ]
}
```

---

## Error Handling

All endpoints may return error responses in the following format:

```json
{
  "message": string,
  "status_code": number,
  "status_message": string (optional),
  "error": string (optional)
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

- The base path can be overridden via the `environment.base_path` configuration
- HTTP requests are automatically upgraded to HTTPS when the application runs under an HTTPS protocol
- All POST/PUT requests use JSON content type
- Authentication may be required for Account and Ads endpoints (bearer token in Authorization header)
- Listings endpoints are read-only and don't require authentication
- Path parameters are indicated with `{paramName}` syntax
- Optional query parameters are indicated in Query Parameters section
