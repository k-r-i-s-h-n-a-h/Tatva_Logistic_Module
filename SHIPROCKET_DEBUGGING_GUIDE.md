# Shiprocket Booking Debugging Guide

## Current Status
❌ **Issue**: 404 Not Found on `/orders/create/ad-hoc`
✅ **Fix Applied**: Code now tries both endpoints and provides better error logging

---

## What The Logs Show

```
POST https://apiv2.shiprocket.in/v1/external/orders/create/ad-hoc → 404 Not Found
```

### Why This Happens
- Your Shiprocket account **doesn't have access** to the `/orders/create/ad-hoc` endpoint
- This is usually due to:
  - **Account tier** - Lower tiers don't have access
  - **API disabled** - Must be enabled in account settings
  - **Permissions** - API keys with limited scope

---

## Solutions (In Order)

### 1️⃣ **Check Your Account Access** (FIRST)
Contact Shiprocket Support:
```
Email: support@shiprocket.in
Tell them: "I need access to the orders/create/ad-hoc endpoint for programmatic order creation"
```

**What to check yourself:**
1. Go to https://dashboard.shiprocket.in/settings/api-credentials
2. Verify your API key is **active** and **not restricted**
3. Check if you have **"Orders API Access"** enabled

### 2️⃣ **Use Shiprocket Dashboard Instead** (TEMPORARY)
While waiting for API access:
1. Create orders manually via: https://dashboard.shiprocket.in/orders
2. Once order exists with shipment_id, your app can still generate AWB with that shipment_id

### 3️⃣ **Use Alternative Endpoint** (OUR CODE HANDLES THIS)
The updated code now tries:
1. `/orders/create` (standard endpoint)
2. `/orders/create/ad-hoc` (fallback endpoint)

---

## Testing Manually

### Test Token Auth:
```bash
curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "krishna.h@tatvaops.com",
    "password": "GcA!TNLJeWKiF76U&9l45UMiu4zEcevC"
  }'
```

### Test Order Creation:
```bash
# Get token first, then:
curl -X POST https://apiv2.shiprocket.in/v1/external/orders/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "order_date": "2026-04-23T10:00:00",
    "pickup_location": "Primary",
    "billing_customer_name": "Krishna",
    "billing_address": "123 Main St",
    "billing_city": "Bangalore",
    "billing_pincode": "560001",
    "payment_method": "Prepaid",
    "sub_total": 500,
    "order_items": [{
      "name": "Box",
      "sku": "BOX-1",
      "units": 1,
      "selling_price": 500
    }]
  }'
```

**If you get:**
- ✅ `200 OK` with `shipment_id` → Your account **HAS ACCESS**
- ❌ `404 Not Found` → Your account **NEEDS UPGRADE or PERMISSIONS**

---

## What We've Improved

✅ **Better Error Messages** - Shows HTTP status codes and full error responses
✅ **Fallback Endpoints** - Tries multiple endpoints automatically
✅ **Debug Logging** - All requests/responses logged for troubleshooting
✅ **Timeout Handling** - 10-second timeouts to prevent hanging

---

## Next Steps

1. **Run backend** with new code:
   ```bash
   source /Users/krishnahonnikhere/Desktop/Tatva_Logistic_module/.venv/bin/activate
   cd /Users/krishnahonnikhere/Desktop/Tatva_Logistic_module/backend
   python -m uvicorn src.main:app --port 8001
   ```

2. **Test order booking** from frontend
3. **Check console logs** for detailed error messages
4. **Contact Shiprocket** if you need account upgrade

---

## Success Response Example

When it works, you'll get:
```json
{
  "status": "success",
  "shiprocket_order_id": "12345",
  "shipment_id": "67890",
  "awb_tracking_number": "ABC123XYZ789",
  "courier_name": "Blue Dart",
  "routing_code": "BLU001"
}
```
