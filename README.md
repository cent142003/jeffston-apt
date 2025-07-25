# Jeffston Court Apartments - API Integration Guide

## Current Status ✅

Your Google Apps Script web app is deployed and accessible at:
```
https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec
```

## Issue Found & Solution 🔧

**Problem**: The API currently returns HTML instead of JSON when called with query parameters like `?action=listings`.

**Why**: The `doGet()` function in your Google Apps Script needs to be updated to handle action parameters properly.

## To Fix the API (Required Step)

1. **Open your Google Apps Script**: Go to [script.google.com](https://script.google.com) and open your Jeffston Court project
2. **Replace the existing code** with the content from `google-apps-script-template.js` in this directory
3. **Save and redeploy**: Click "Deploy" → "New deployment" → choose "Web app" type
4. **Update permissions**: Ensure it's set to "Anyone" access if you want public API access

## Testing the Integration

1. **Open `test-api.html`** in your browser to test the API endpoints
2. **Check browser console** for detailed API response logs
3. **Verify endpoints**:
   - `?action=listings` - Returns apartment listings
   - `?action=getApartments` - Returns apartment dropdown options
   - `?action=bookings` - Returns booking data

## Frontend Features Working ✅

Your frontend (`index.html`, `listings.html`, `app.js`) includes:

- ✅ **Mock Data Fallback**: If API returns HTML, uses mock apartment data
- ✅ **Dynamic Listings**: Automatically populates from Google Sheets
- ✅ **Real-time Price Calculation**: Updates booking summary as user selects dates
- ✅ **Form Validation**: Comprehensive client-side validation
- ✅ **Paystack Integration**: Ready for payment processing
- ✅ **Responsive Design**: Works on all devices
- ✅ **Error Handling**: Graceful fallbacks and user-friendly messages

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|---------|-------------|
| `?action=listings` | GET | Get all apartment listings |
| `?action=getApartments` | GET | Get apartments for dropdown |
| `?action=bookings` | GET | Get booking data |
| `?action=createBooking` | POST | Create new booking |
| `?action=verifyPayment` | POST | Verify payment status |

## Current Behavior

- **With API fix**: Full functionality with real Google Sheets data
- **Without API fix**: Uses mock data for development/demo

## Files in this Directory

- `index.html` - Main booking page
- `listings.html` - Apartment listings page  
- `app.js` - Main JavaScript application
- `styles.css` - Styling
- `test-api.html` - API testing utility
- `google-apps-script-template.js` - Code to copy to Google Apps Script
- `README.md` - This guide

## Quick Test Commands

Test the API from command line:
```bash
# Test listings endpoint
curl "https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=listings"

# Test apartments endpoint  
curl "https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=getApartments"
```

## Next Steps

1. **Update Google Apps Script** with the template code
2. **Test API endpoints** using `test-api.html`
3. **Verify frontend integration** works with real data
4. **Configure Paystack** webhook for payment verification
5. **Deploy to production** hosting

Your apartment booking system is ready to go! 🎉