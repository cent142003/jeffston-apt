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
    
    // Ensure consistent data format
    listing.ID = listing.ID || listing.id || `APT${String(i).padStart(3, '0')}`;
    listing.Price_GHS = Number(listing.Price_GHS || listing.price || 0);
    listing.Available = String(listing.Available || 'yes').toLowerCase();
    listing.Bedrooms = Number(listing.Bedrooms || listing.bedrooms || 1);
    
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
      type: listing.Title || listing.name || listing.apartmentType,
      price: listing.Price_GHS
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
        return createBooking(data);
      case 'verifyPayment':
        return verifyPayment(data);
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

// Create a new booking
function createBooking(data) {
  try {
    const sheet = SpreadsheetApp.openById('1H6-tRH7p8U-6HGiZ6whjGQYyTKv6jWcZGECBpMfP5Po').getSheetByName('Bookings');
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const spreadsheet = SpreadsheetApp.openById('1H6-tRH7p8U-6HGiZ6whjGQYyTKv6jWcZGECBpMfP5Po');
      const newSheet = spreadsheet.insertSheet('Bookings');
      
      // Add headers
      newSheet.getRange(1, 1, 1, 12).setValues([[
        'Timestamp', 'Reference', 'Name', 'Email', 'Phone', 
        'Apartment', 'Check-in', 'Check-out', 'Guests', 
        'Amount', 'Status', 'Payment Reference'
      ]]);
    }
    
    // Add the booking data
    const timestamp = new Date();
    const row = [
      timestamp,
      data.reference,
      data.name,
      data.email,
      data.phone,
      data.apartmentTitle,
      data.checkIn,
      data.checkOut,
      data.guests,
      data.amount,
      'Pending',
      ''
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Booking created successfully',
        reference: data.reference
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Booking creation error:', error);
    throw error;
  }
}

// Verify payment (placeholder - integrate with Paystack webhook)
function verifyPayment(data) {
  try {
    // Here you would verify the payment with Paystack
    // For now, we'll just update the booking status
    
    const sheet = SpreadsheetApp.openById('1H6-tRH7p8U-6HGiZ6whjGQYyTKv6jWcZGECBpMfP5Po').getSheetByName('Bookings');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find the booking by reference
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === data.bookingId) { // Reference column
        sheet.getRange(i + 1, 11).setValue('Confirmed'); // Status column
        sheet.getRange(i + 1, 12).setValue(data.reference); // Payment reference
        break;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Payment verified successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
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
  <title>Book Your Stay</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 2rem; display: flex; justify-content: center; align-items: center; }
    .container { max-width: 600px; width: 100%; background: #fff; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
    h1 { text-align: center; color: #333; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
    input, select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 1rem; }
    button { width: 100%; padding: 0.8rem; background-color: #28a745; color: white; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
    button:disabled { background-color: #9ddcb1; cursor: not-allowed; }
    #booking-message { text-align: center; margin-top: 1rem; font-weight: bold; min-height: 24px; }
  </style>
</head>
<body>

  <div class="container">
    <h1>Book Your Stay</h1>
    <form id="booking-form" novalidate>
      <div class="form-group">
        <label for="apartmentType">Select Apartment</label>
        <select id="apartmentType" name="apartmentType" required>
          <option value="">-- Please choose an option --</option>
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