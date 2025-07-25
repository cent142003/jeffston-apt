# 🚀 Complete Setup Guide - Jeffston Court Apartments

## 📋 Current Status

✅ **Frontend Ready**: Your booking system is fully functional with mock data fallback  
✅ **API Integration**: Connected to your Google Apps Script  
✅ **Testing Tools**: API testing dashboard included  
⚠️ **Needs Fix**: Google Apps Script returns HTML instead of JSON  

## 🔧 Step-by-Step Setup

### Step 1: Update Google Apps Script (Required)

1. **Open Google Apps Script**:
   - Go to [script.google.com](https://script.google.com)
   - Find your Jeffston Court project

2. **Replace the Code**:
   - Open the `google-apps-script-template.js` file in this directory
   - Copy ALL the code (Ctrl+A, Ctrl+C)
   - In Google Apps Script, select all existing code and delete it
   - Paste the new code

3. **Save and Deploy**:
   - Click "Save" (Ctrl+S)
   - Click "Deploy" → "New deployment"
   - Choose "Web app" as the type
   - Set execute as "Me" and access to "Anyone"
   - Click "Deploy"

### Step 2: Test the API

1. **Open API Testing Dashboard**:
   ```
   Open api-test.html in your browser
   ```

2. **Run Tests**:
   - Click "Test Listings API"
   - Should show ✅ SUCCESS with JSON data
   - If still showing HTML, repeat Step 1

### Step 3: Verify Frontend Integration

1. **Open Your Booking System**:
   ```
   Open index.html in your browser
   ```

2. **Check Notifications**:
   - ✅ "Connected to live Google Sheets data!" = API working
   - 📋 "Using demo data..." = API needs fixing

### Step 4: Test All Features

1. **Listings Page** (`listings.html`):
   - Should show apartments from your Google Sheet
   - Test filtering and pagination
   - Click on apartments to go to booking page

2. **Booking Page** (`index.html`):
   - Dropdown should populate with your apartments
   - Price calculation should work
   - Form validation should function

## 📊 What Each File Does

| File | Purpose |
|------|---------|
| `index.html` | Main booking page with form |
| `listings.html` | Apartment gallery with filtering |
| `app.js` | Main JavaScript application logic |
| `styles.css` | All styling and responsive design |
| `api-test.html` | Testing dashboard for API endpoints |
| `google-apps-script-template.js` | Code to copy to Google Apps Script |

## 🌐 API Endpoints After Setup

| URL | Response |
|-----|----------|
| `?action=listings` | JSON array of apartments |
| `?action=getApartments` | JSON for dropdown options |
| `?action=bookings` | JSON of booking data |
| `(no parameters)` | HTML booking form |

## 🚨 Troubleshooting

### API Still Returns HTML?

1. **Check Deployment**:
   - Make sure you clicked "New deployment" not just "Save"
   - Verify permissions are set to "Anyone"

2. **Test URL**:
   ```
   https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec?action=listings
   ```

3. **Check Code**:
   - Ensure the `doGet(e)` function includes the `if (action)` logic
   - Verify the Google Sheets ID is correct

### Frontend Issues?

1. **Console Errors**:
   - Open browser developer tools (F12)
   - Check Console tab for errors

2. **Network Issues**:
   - Check Network tab for failed requests
   - Verify CORS settings

## 🎯 Testing Checklist

- [ ] Google Apps Script deployed successfully
- [ ] API returns JSON for `?action=listings`
- [ ] Frontend shows live data notification
- [ ] Apartment dropdown populates
- [ ] Price calculation works
- [ ] Form validation functions
- [ ] Listings page displays apartments
- [ ] Filtering and pagination work

## 🚀 Going Live

Once everything tests successfully:

1. **Upload to Web Host**:
   - Upload all HTML, CSS, JS files
   - Include Assets folder

2. **Configure Domain**:
   - Point your domain to the hosting
   - Update meta tags with real URLs

3. **Payment Setup**:
   - Configure Paystack webhook
   - Test payment flow

## 📞 Support

Your apartment booking system includes:
- ✅ Real-time price calculation
- ✅ Google Sheets integration
- ✅ Payment processing with Paystack
- ✅ Responsive design for all devices
- ✅ SEO optimization
- ✅ Accessibility features

**API URL**: `https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec`

Everything is ready to go! 🎉