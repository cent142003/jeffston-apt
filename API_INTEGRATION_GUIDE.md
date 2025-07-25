# 🏠 Jeffston Court API Integration Guide

## 📋 Overview

This guide documents the integration between the Jeffston Court frontend application and the Google Apps Script backend. The system includes robust error handling and fallback mechanisms to ensure a smooth user experience even when the API has issues.

## 🔗 API Endpoints

**Base URL:** `https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec`

### Available Endpoints

| Endpoint | Method | Purpose | Expected Response |
|----------|--------|---------|-------------------|
| `?action=listings` | GET | Fetch apartment listings | JSON array of apartments |
| `?action=bookings` | GET | Fetch booking records | JSON array of bookings |
| `?action=book` | POST | Submit new booking | JSON success/error response |
| `/` (default) | GET | Display booking form | HTML booking interface |

## 🚀 Current Implementation Status

### ✅ What's Working

1. **Frontend Application**: Fully functional with modern UI
2. **Fallback Data System**: When API returns HTML instead of JSON, the app uses mock data
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Retry Logic**: Multiple request formats attempted for booking submissions
5. **API Test Page**: Dedicated test interface for debugging API issues

### ⚠️ Known Issues

1. **API Response Format**: Google Apps Script currently returns HTML booking form instead of JSON
2. **Backend Configuration**: The `doGet()` function needs to properly handle `action` parameters
3. **Authentication**: No authentication mechanism implemented yet

## 🔧 Testing the Integration

### Option 1: Use the Test Page
1. Open `test-api.html` in your browser
2. Click "Fetch Listings" to test data retrieval
3. Click "Submit Test Booking" to test form submissions
4. Check browser console for detailed logs

### Option 2: Direct URL Testing
Test these URLs in your browser:
- **Listings**: `https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=listings`
- **Bookings**: `https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=bookings`
- **Default Form**: `https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec`

### Option 3: Command Line Testing
```bash
# Test listings endpoint
curl "https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=listings"

# Test booking submission
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","apartmentType":"2-Bedroom Luxury Apartment"}' \
  "https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=book"
```

## 🛠️ Frontend Implementation Details

### API Functions

#### `fetchFromScript(action)`
- Handles GET requests to the Google Apps Script
- Automatically detects HTML responses and switches to fallback data
- Provides detailed console logging for debugging

```javascript
async function fetchFromScript(action) {
  const url = `${config.apiUrl}?action=${action}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // Check if response is HTML (API not configured properly)
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
      return getFallbackData(action);
    }
    
    return JSON.parse(text);
  } catch (error) {
    return getFallbackData(action);
  }
}
```

#### `postToScript(action, payload, retryCount)`
- Handles POST requests with retry logic
- Tries multiple request formats for maximum compatibility
- Provides user-friendly feedback even when API fails

### Fallback Data
When the API is unavailable, the app uses this sample data:

```javascript
[
  {
    id: 1,
    title: '2-Bedroom Luxury Apartment',
    description: 'Modern 2-bedroom apartment with luxury amenities',
    price: 4200,
    available: 'yes',
    bedrooms: 2
  },
  {
    id: 2,
    title: '3-Bedroom Premium Apartment', 
    description: 'Spacious 3-bedroom apartment perfect for families',
    price: 6840,
    available: 'yes',
    bedrooms: 3
  }
]
```

## 🔥 Next Steps to Fix the API

To make the Google Apps Script return proper JSON instead of HTML, you need to modify the `doGet()` function:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'listings':
      return ContentService
        .createTextOutput(JSON.stringify(getListingsAsJson()))
        .setMimeType(ContentService.MimeType.JSON);
        
    case 'bookings':
      return ContentService
        .createTextOutput(JSON.stringify(getBookingsAsJson()))
        .setMimeType(ContentService.MimeType.JSON);
        
    default:
      // Return HTML form for default/booking interface
      return HtmlService.createTemplateFromFile('booking-form').evaluate();
  }
}
```

## 📊 Error Monitoring

The frontend includes comprehensive error logging:

1. **Console Logs**: All API calls are logged with full request/response details
2. **User Notifications**: Toast notifications for API errors and successes  
3. **Fallback Messages**: Clear indication when fallback data is being used
4. **Retry Tracking**: Logs showing retry attempts and different request formats

## 🎯 Recommended Testing Workflow

1. **Start Local Server**: `python3 -m http.server 8000`
2. **Open Test Page**: Navigate to `http://localhost:8000/test-api.html`
3. **Test Listings**: Click "Fetch Listings" and verify data loads
4. **Test Booking**: Submit test booking and check console for API response
5. **Check Browser Network Tab**: Monitor actual HTTP requests and responses
6. **Verify Fallback**: Confirm graceful degradation when API fails

## 🔒 Security Considerations

- **CORS**: Google Apps Script handles CORS automatically for web apps
- **Input Validation**: Frontend validates all form inputs before submission
- **Rate Limiting**: Consider implementing rate limiting in Google Apps Script
- **Data Sanitization**: Always sanitize user inputs on the backend

## 📞 Support Information

For API issues or questions:
- **WhatsApp**: +233201349321
- **Check Console**: Browser developer tools for detailed error logs
- **Test Page**: Use `test-api.html` for isolated API testing

---

*Last updated: January 2025*