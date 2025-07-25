/**
 * GOOGLE APPS SCRIPT - JEFFSTON COURT APARTMENTS
 * Copy this code to your Google Apps Script editor to fix the API endpoints
 * 
 * This script handles both:
 * 1. HTML form rendering (when no action parameter is provided)
 * 2. JSON API responses (when action parameter is provided)
 */

// Main function that handles all GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  // If no action parameter, return the HTML booking form
  if (!action) {
    return getBookingFormHtml();
  }
  
  // Handle API calls based on action parameter
  try {
    let data;
    
    switch (action) {
      case 'listings':
        data = getListingsAsJson();
        break;
      case 'getApartments':
        data = getAvailableApartmentTitles();
        break;
      case 'bookings':
        data = getBookingsAsJson();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('API Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        error: true,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get listings data as JSON
function getListingsAsJson() {
  const sheet = SpreadsheetApp.openById('1H6-tRH7p8U-6HGiZ6whjGQYyTKv6jWcZGECBpMfP5Po').getSheetByName('Listings');
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return [];
  
  const headers = data[0];
  const listings = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const listing = {};
    
    headers.forEach((header, index) => {
      listing[header] = row[index];
    });
    
    // Ensure consistent data format - match your Google Sheets column names exactly
    listing.ID = listing.ID || listing.id || `APT${String(i).padStart(3, '0')}`;
    listing.Title = listing.Title || listing['Apartment Type'] || listing.Name || listing.title;
    listing.Price_GHS = Number(listing.Price_GHS || listing.Price || listing.price || 0);
    listing.Available = String(listing.Available || listing.Status || 'yes').toLowerCase();
    listing.Bedrooms = Number(listing.Bedrooms || listing.bedrooms || 1);
    listing.Description = listing.Description || listing.description || '';
    
    listings.push(listing);
  }
  
  return listings;
}

// Get available apartment titles and prices for dropdown
function getAvailableApartmentTitles() {
  const listings = getListingsAsJson();
  
  return listings
    .filter(listing => listing.Available === 'yes')
    .map(listing => ({
      id: listing.ID,
      type: listing.Title || listing.Name || listing.apartmentType || listing['Apartment Type'],
      price: listing.Price_GHS || listing.Price || listing['Price_GHS']
    }));
}

// Get bookings data as JSON (if you have a Bookings sheet)
function getBookingsAsJson() {
  try {
    const sheet = SpreadsheetApp.openById('1H6-tRH7p8U-6HGiZ6whjGQYyTKv6jWcZGECBpMfP5Po').getSheetByName('Bookings');
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) return [];
    
    const headers = data[0];
    const bookings = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const booking = {};
      
      headers.forEach((header, index) => {
        booking[header] = row[index];
      });
      
      bookings.push(booking);
    }
    
    return bookings;
  } catch (error) {
    console.log('No Bookings sheet found or error reading bookings:', error);
    return [];
  }
}

// Handle POST requests (for booking submissions)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || e.parameter.action;
    
    switch (action) {
      case 'createBooking':
        return ContentService
          .createTextOutput(JSON.stringify(createBooking(data)))
          .setMimeType(ContentService.MimeType.JSON);
      case 'verifyPayment':
        return ContentService
          .createTextOutput(JSON.stringify(verifyPaystackTransaction(data.reference)))
          .setMimeType(ContentService.MimeType.JSON);
      default:
        throw new Error(`Unknown POST action: ${action}`);
    }
  } catch (error) {
    console.error('POST Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Your existing createBooking function (matches your code.gs)
function createBooking(bookingDetails) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName('Bookings');
  const listings = getListingsAsJson();
  const listingData = listings.find(apt => apt.Title === bookingDetails.apartmentType);
  if (!listingData) throw new Error('The selected apartment could not be found.');

  const bookingId = `BK-${new Date().getTime()}`;
  const newRow = [
    new Date(), bookingId, listingData.ID, listingData.Title, new Date(bookingDetails.checkIn),
    new Date(bookingDetails.checkOut), bookingDetails.guests, bookingDetails.name,
    bookingDetails.email, bookingDetails.phone, 'Pending', 'Submitted via web form.'
  ];
  
  bookingsSheet.appendRow(newRow);
  return { success: true, bookingId: bookingId };
}

// Your existing verifyPaystackTransaction function (matches your code.gs)
function verifyPaystackTransaction(reference) {
  const PAYSTACK_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('PAYSTACK_SECRET_KEY');
  if (!PAYSTACK_SECRET_KEY) throw new Error('Paystack secret key not configured.');
  
  const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
  const options = { headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` }, muteHttpExceptions: true };
  const response = UrlFetchApp.fetch(url, options);
  const responseData = JSON.parse(response.getContentText());

  if (responseData.status === true && responseData.data.status === 'success') {
    const bookingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
    const data = bookingsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === reference) {
        bookingsSheet.getRange(i + 1, 11).setValue('Confirmed');
        // Email logic can be added here
        return { success: true, message: 'Payment verified and booking confirmed.' };
      }
    }
  }
  throw new Error(responseData.message || 'Payment verification failed.');
}

// Return the HTML booking form
function getBookingFormHtml() {
  const apartmentOptions = getAvailableApartmentTitles();
  
  let optionsHtml = '';
  apartmentOptions.forEach(apt => {
    optionsHtml += `<option value="${apt.type}">${apt.type} - GHS ${apt.price}</option>\n`;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book Your Stay - Jeffston Court</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 2rem; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
    .container { max-width: 600px; width: 100%; background: #fff; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    h1 { text-align: center; color: #2c3e50; margin-bottom: 0.5rem; font-size: 2rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50; }
    input, select { width: 100%; padding: 0.875rem; border: 2px solid #e1e8ed; border-radius: 8px; box-sizing: border-box; font-size: 1rem; transition: border-color 0.3s; }
    input:focus, select:focus { outline: none; border-color: #16a34a; }
    button { width: 100%; padding: 1rem; background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.3s; }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(22, 163, 74, 0.3); }
    button:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
    #booking-message { text-align: center; margin-top: 1rem; font-weight: bold; min-height: 24px; }
    .logo { text-align: center; margin-bottom: 1rem; }
  </style>
</head>
<body>

  <div class="container">
    <div class="logo">
      <h1>🏡 Jeffston Court</h1>
      <p class="subtitle">Luxury Apartments in Accra</p>
    </div>
    <form id="booking-form" novalidate>
      <div class="form-group">
        <label for="apartmentType">Select Apartment</label>
        <select id="apartmentType" name="apartmentType" required>
          <option value="">-- Choose your perfect home --</option>
          ${optionsHtml}
        </select>
      </div>
      <div class="form-group">
        <label for="check-in">Check-in Date</label>
        <input type="date" id="check-in" name="checkIn" required>
      </div>
      <div class="form-group">
        <label for="check-out">Check-out Date</label>
        <input type="date" id="check-out" name="checkOut" required>
      </div>
      <div class="form-group">
        <label for="guests">Number of Guests</label>
        <input type="number" id="guests" name="guests" min="1" max="10" required>
      </div>
      <div class="form-group">
        <label for="name">Full Name</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="phone">Phone Number</label>
        <input type="tel" id="phone" name="phone" required>
      </div>
      <button type="submit" id="submit-booking">Confirm Booking</button>
    </form>
    <p id="booking-message"></p>
  </div>

  <script>
    (() => {
      'use strict';
      const BOOKING_API_URL = 'https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec';

      const bookingForm = document.getElementById('booking-form');
      const bookingMessage = document.getElementById('booking-message');
      const submitButton = document.getElementById('submit-booking');
      const checkInInput = document.getElementById('check-in');
      const checkOutInput = document.getElementById('check-out');

      function setInitialDateAttributes() {
        const today = new Date().toISOString().split('T')[0];
        checkInInput.setAttribute('min', today);
        checkOutInput.setAttribute('min', today);
      }

      setInitialDateAttributes();

      checkInInput.addEventListener('change', () => {
        const checkInDateValue = checkInInput.value;
        if (checkInDateValue) {
          const minCheckOutDate = new Date(checkInDateValue);
          minCheckOutDate.setDate(minCheckOutDate.getDate() + 1);
          const minDateString = minCheckOutDate.toISOString().split('T')[0];
          checkOutInput.setAttribute('min', minDateString);
          if (checkOutInput.value < minDateString) { checkOutInput.value = ''; }
        }
      });

      function validateBookingForm(form) {
        bookingMessage.textContent = '';
        if (!form.checkValidity()) { form.reportValidity(); return false; }
        const checkIn = new Date(form.checkIn.value);
        const checkOut = new Date(form.checkOut.value);
        if (checkOut <= checkIn) {
          bookingMessage.textContent = 'Check-out date must be after check-in date.';
          bookingMessage.style.color = '#e74c3c';
          form.checkOut.focus();
          return false;
        }
        return true;
      }

      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateBookingForm(bookingForm)) { return; }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        bookingMessage.textContent = '';

        const formData = {
          apartmentType: bookingForm.apartmentType.value,
          checkIn: bookingForm.checkIn.value, checkOut: bookingForm.checkOut.value,
          guests: bookingForm.guests.value, name: bookingForm.name.value.trim(),
          email: bookingForm.email.value.trim(), phone: bookingForm.phone.value.trim()
        };

        try {
          const response = await fetch(BOOKING_API_URL, {
            method: 'POST', body: JSON.stringify(formData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          });
          const result = await response.json();
          if (response.ok && result.success) {
            bookingMessage.style.color = '#2ca02c';
            bookingMessage.textContent = 'Thank you! Your booking request has been received.';
            bookingForm.reset();
            setInitialDateAttributes();
          } else { throw new Error(result.error || 'Booking submission failed.'); }
        } catch (err) {
          bookingMessage.style.color = '#e74c3c';
          bookingMessage.textContent = err.message || 'An unexpected error occurred.';
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Confirm Booking';
        }
      });
    })();
  </script>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Jeffston Court Apartments - Booking')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}