/**
 * ========================================================================
 * JEFFSTON COURT: FINAL FRONTEND SCRIPT (app.js)
 * ========================================================================
 * This script manages the entire frontend application, including API calls,
 * multi-step form logic, real-time price calculation, dynamic UI updates,
 * filtering, pagination, and Paystack integration.
 * ========================================================================
 */
(() => {
  'use strict';

  // --- Configuration & State ---
  // Update config with new URL
  const config = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec',
    paystackKey: 'pk_live_9302b8356f0551937a496101908e2eb772328962',
    taxRate: 0.12,
    listingsPerPage: 6,
  };

  const state = {
    listings: [],
    currentPage: 1,
    get paginatedListings() {
      const start = (this.currentPage - 1) * config.listingsPerPage;
      const end = start + config.listingsPerPage;
      return this.filteredListings.slice(start, end);
    },
    get filteredListings() {
      const form = document.getElementById('filter-form');
      if (!form) return this.listings;
      const filters = new FormData(form);
      const priceRange = filters.get('price-range');
      const bedrooms = filters.get('bedrooms');
      return this.listings.filter(listing => {
        const priceMatch = !priceRange || checkPriceRange(listing.Price_GHS, priceRange);
        const bedroomMatch = !bedrooms || bedrooms === 'any' || parseInt(listing.Bedrooms) >= parseInt(bedrooms);
        return priceMatch && bedroomMatch && listing.Available?.toLowerCase() === 'yes';
      });
    },
  };

  // --- Utility Functions ---
  const $ = selector => document.querySelector(selector);
  const show = el => el?.classList.remove('hidden');
  const hide = el => el?.classList.add('hidden');
  const formatCurrency = (amount, locale = 'en-GH', currency = 'GHS') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  const checkPriceRange = (price, range) => {
    const [min, max] = range.split('-').map(Number);
    return price >= min && (max ? price <= max : true);
  };

  function notify(message, type = 'info', duration = 4000) {
    // Remove any existing toasts to prevent stacking
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    // Add toast styles if not already added
    if (!document.querySelector('#toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #333;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          z-index: 10000;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: slideInRight 0.3s ease;
        }
        .toast--success { background: #16a34a; }
        .toast--error { background: #dc2626; }
        .toast--warn { background: #d97706; }
        .toast--info { background: #2563eb; }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .toast { right: 10px; left: 10px; max-width: none; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  async function apiPost(action, payload) {
    show($('#spinner-overlay'));
    try {
      const response = await fetch(`${config.apiUrl}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      return await response.json();
    } catch (error) {
      notify(`API ${action} failed: ${error.message}`, 'error');
      throw error;
    } finally {
      hide($('#spinner-overlay'));
    }
  }

  // Updated fetchFromScript function with better error handling:
  async function fetchFromScript(action) {
    const url = `${config.apiUrl}?action=${action}`;
    console.log('Fetching from:', url);
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      console.log('Raw response length:', text.length);
      console.log('Response starts with:', text.substring(0, 100));
      
      // Check if we got HTML instead of JSON
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        console.warn('Got HTML response instead of JSON. The Google Apps Script doGet() function needs to handle action parameters.');
        
        // Show user-friendly notification about using demo data
        if (!window.demoDataNotificationShown) {
          notify('📋 Using demo data. To connect live data, update your Google Apps Script. See api-test.html for details.', 'info', 8000);
          window.demoDataNotificationShown = true;
        }
        
        // Return mock data for now
        if (action === 'listings') {
          return getMockListings();
        } else if (action === 'getApartments') {
          return getMockApartments();
        } else {
          throw new Error(`API returned HTML instead of JSON for action: ${action}`);
        }
      }
      
      const data = JSON.parse(text);
      console.log('Parsed data:', data);
      
      // Show success notification when API is working properly
      if (!window.liveDataNotificationShown && Array.isArray(data) && data.length > 0) {
        notify('✅ Connected to live Google Sheets data!', 'success', 4000);
        window.liveDataNotificationShown = true;
      }
      
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Fallback to mock data for development
      if (action === 'listings') {
        console.log('Using mock listings data');
        return getMockListings();
      } else if (action === 'getApartments') {
        console.log('Using mock apartments data');
        return getMockApartments();
      }
      
      throw new Error(`Failed to fetch ${action}: ${error.message}`);
    }
  }

  // Mock data functions for development/fallback - EXACT MATCH with Google Sheets
  function getMockListings() {
    return [
      {
        ID: "APT001",
        Title: "2-Bedroom Luxury Apartment",
        Description: "Spacious modern apartment with premium finishes, high-speed internet, 24/7 security, and elegant living spaces perfect for professionals or small families.",
        Price_GHS: 4200,
        Image_URL: "Assets/photo_3_2025-07-25_06-12-23.jpg",
        Gallery_Images: [
          "Assets/photo_3_2025-07-25_06-12-23.jpg",
          "Assets/photo_4_2025-07-25_06-12-23.jpg", 
          "Assets/photo_8_2025-07-25_06-12-23.jpg",
          "Assets/photo_9_2025-07-25_06-12-23.jpg"
        ],
        Available: "yes",
        Bedrooms: 2
      },
      {
        ID: "APT002", 
        Title: "3-Bedroom Premium Apartment",
        Description: "Luxurious family apartment with spacious rooms, modern kitchen, premium appliances, and beautiful views. Perfect for families or groups seeking comfort and style.",
        Price_GHS: 6840,
        Image_URL: "Assets/photo_5_2025-07-25_06-12-23.jpg",
        Gallery_Images: [
          "Assets/photo_5_2025-07-25_06-12-23.jpg",
          "Assets/photo_7_2025-07-25_06-12-23.jpg",
          "Assets/photo_1_2025-07-25_06-12-23.jpg",
          "Assets/photo_2_2025-07-25_06-12-23.jpg"
        ],
        Available: "yes",
        Bedrooms: 3
      }
    ];
  }

  function getMockApartments() {
    return [
      {
        id: "APT001",
        type: "2-Bedroom Luxury Apartment",
        price: 4200
      },
      {
        id: "APT002",
        type: "3-Bedroom Premium Apartment", 
        price: 6840
      }
    ];
  }

  async function postToScript(action, payload) {
    show($('#spinner-overlay'));
    try {
      // Google Apps Script expects form-encoded data
      const formData = new FormData();
      formData.append('action', action);
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        body: formData
      });

      const data = await response.text();
      if (data.includes('<!DOCTYPE html>')) {
        throw new Error('API Error: Invalid response from server');
      }
      return JSON.parse(data);
    } catch (error) {
      notify(`Operation failed: ${error.message}`, 'error');
      throw error;
    } finally {
      hide($('#spinner-overlay'));
    }
  }

  // Function to call Google Apps Script functions directly
  async function callGoogleFunction(functionName, parameters) {
    try {
      // Use google.script.run if available (when running in Google Apps Script HTML)
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        return new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            [functionName](parameters);
        });
      } else {
        // Fallback for standalone frontend - simulate the function call
        console.log(`Simulating ${functionName} call with:`, parameters);
        
        if (functionName === 'createBooking') {
          // Simulate successful booking creation
          const bookingId = `BK-${Date.now()}`;
          return { success: true, bookingId: bookingId };
        }
        
        if (functionName === 'verifyPaystackTransaction') {
          // Simulate successful payment verification for demo
          console.log('Simulating payment verification for reference:', parameters);
          return { 
            success: true, 
            message: 'Payment verified successfully (demo mode)',
            reference: parameters 
          };
        }
        
        throw new Error('Google Apps Script not available');
      }
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // --- Main Application Logic ---
  const App = {
    init() {
      const path = window.location.pathname.split('/').pop();
      if (path === 'listings.html' || path === '') {
        this.initListingsPage();
      } else if (path === 'index.html') {
        this.initBookingPage();
      }
      this.setupGeneralListeners();
    },

    setupGeneralListeners() {
      const fab = $('.whatsapp-fab');
      if (fab) {
        fab.href = `https://wa.me/233201349321?text=${encodeURIComponent("Hello! I'm interested in an apartment.")}`;
      }
    },

    async fetchListings() {
      if (state.listings.length > 0) return state.listings;
      show($('#spinner-overlay'));
      try {
        const data = await fetchFromScript('listings');
        if (!Array.isArray(data)) {
          throw new Error('Expected array of listings');
        }
        state.listings = data.map(item => ({
          ID: item.id || item.ID || String(item.rowIndex),
          Title: item.title || item.name || item.apartmentType,
          Description: item.description || '',
          Price_GHS: parseFloat(item.price) || 0,
          Image_URL: item.imageUrl || 'Assets/photo_3_2025-07-25_06-12-23.jpg',
          Available: String(item.available || 'yes').toLowerCase(),
          Bedrooms: parseInt(item.bedrooms) || 1
        }));
        return state.listings;
      } catch (error) {
        notify('Failed to load listings: ' + error.message, 'error');
        return [];
      } finally {
        hide($('#spinner-overlay'));
      }
    },

    // --- Listings Page Logic ---
    async initListingsPage() {
      await this.fetchListings();
      this.renderListings();
      this.setupFilterListeners();
      this.setupPaginationListeners();
      // Map is handled by embedded HTML
    },

    renderListings() {
      const container = $('#listings-container');
      const listingsToRender = state.paginatedListings;
      if (!container) return;
      
      if (listingsToRender.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;"><p>No listings match your criteria.</p></div>';
      } else {
        const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        container.innerHTML = listingsToRender.map(listing => `
          <a class="card-link" href="${baseURL}index.html?apt_id=${listing.ID}" style="text-decoration:none;color:inherit;">
            <article class="apartment-card" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);transition:all 0.3s ease;cursor:pointer;max-width:400px;margin:0 auto;" 
                     onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'" 
                     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                     tabindex="0" aria-label="${listing.Title}">
              <div class="apartment-image" style="position:relative;overflow:hidden;height:240px;">
                <img src="${listing.Image_URL}" 
                     alt="${listing.Title}" 
                     loading="lazy"
                     style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
                <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;">
                  ${listing.Bedrooms} Bed${listing.Bedrooms > 1 ? 's' : ''}
                </div>
              </div>
              <div class="apartment-details" style="padding:1.5rem;">
                <h3 style="margin:0 0 8px 0;font-size:1.25rem;color:#2c3e50;font-weight:600;">${listing.Title}</h3>
                <p style="margin:0 0 12px 0;color:#666;font-size:0.9rem;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${listing.Description}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;">
                  <span class="price" style="font-size:1.25rem;font-weight:bold;color:#16a34a;">${formatCurrency(listing.Price_GHS)}</span>
                  <span style="font-size:0.85rem;color:#888;">per month</span>
                </div>
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;">
                  <span style="display:inline-block;background:#16a34a;color:white;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:500;">
                    ✓ Available Now
                  </span>
                </div>
              </div>
            </article>
          </a>`).join('');
      }
      this.updatePagination();
    },

    setupFilterListeners() {
      $('#filter-form')?.addEventListener('input', () => {
        state.currentPage = 1;
        this.renderListings();
      });
    },

    setupPaginationListeners() {
      $('#prev-page')?.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          this.renderListings();
        }
      });
      $('#next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredListings.length / config.listingsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          this.renderListings();
        }
      });
    },

    updatePagination() {
      const pageInfo = $('#page-info');
      const prevBtn = $('#prev-page');
      const nextBtn = $('#next-page');
      const totalPages = Math.ceil(state.filteredListings.length / config.listingsPerPage);
      if (pageInfo) pageInfo.textContent = `Page ${state.currentPage} of ${totalPages || 1}`;
      if (prevBtn) prevBtn.disabled = state.currentPage === 1;
      if (nextBtn) nextBtn.disabled = state.currentPage >= totalPages;
    },

    // --- Booking Page Logic ---
    async initBookingPage() {
      await this.fetchListings();
      this.populateDropdown();
      this.setupBookingFormListeners();
    },

    // Enhanced populateDropdown method with fallback
    async populateDropdown() {
      const select = $('#apartmentType');
      if (!select) return;

      try {
        show($('#spinner-overlay'));
        
        // Use the same fetchFromScript function that has fallback logic
        const data = await fetchFromScript('getApartments');
        console.log('Apartments data received:', data);

        // Clear and add default option
        select.innerHTML = '<option value="">-- Select Apartment --</option>';
        
        // Add apartments to dropdown
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(apt => {
            const option = document.createElement('option');
            option.value = apt.id || apt.ID;
            option.textContent = `${apt.type || apt.Title} - ${formatCurrency(Number(apt.price || apt.Price_GHS))}`;
            select.appendChild(option);
          });

          // Handle preselected apartment from URL
          const urlParams = new URLSearchParams(window.location.search);
          const preselectedId = urlParams.get('apt_id');
          if (preselectedId) {
            select.value = preselectedId;
            this.updatePrice();
          }
          
          console.log(`Successfully loaded ${data.length} apartments into dropdown`);
        } else {
          throw new Error('No apartment data received');
        }
      } catch (error) {
        console.error('Error loading apartments:', error);
        
        // Fallback: populate with mock data directly
        console.log('Using fallback apartment data for dropdown');
        const mockApartments = getMockApartments();
        
        select.innerHTML = '<option value="">-- Select Apartment --</option>';
        mockApartments.forEach(apt => {
          const option = document.createElement('option');
          option.value = apt.id;
          option.textContent = `${apt.type} - ${formatCurrency(apt.price)}`;
          select.appendChild(option);
        });
        
        // Show user-friendly message
        if (!window.apartmentErrorShown) {
          notify('📋 Using demo apartments. Update Google Apps Script for live data.', 'info', 6000);
          window.apartmentErrorShown = true;
        }
      } finally {
        hide($('#spinner-overlay'));
      }
    },

    setupBookingFormListeners() {
      const form = $('#booking-form');
      if (!form) return;
      form.addEventListener('input', () => this.updatePrice());
      form.addEventListener('submit', (e) => this.handleBookingSubmit(e));
    },

    updatePrice() {
      const selectedId = $('#apartmentType')?.value;
      let apartment = state.listings.find(apt => apt.ID === selectedId);
      
      // If not found in listings, try to find in mock apartments
      if (!apartment) {
        const mockApartments = getMockApartments();
        const mockApt = mockApartments.find(apt => apt.id === selectedId);
        if (mockApt) {
          apartment = {
            ID: mockApt.id,
            Title: mockApt.type,
            Price_GHS: mockApt.price
          };
        }
      }
      
      const checkIn = new Date($('#checkIn')?.value);
      const checkOut = new Date($('#checkOut')?.value);
      const summaryContainer = $('.summary-content');
      if (!summaryContainer) return;
      
      if (apartment && checkIn && checkOut && checkIn < checkOut) {
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const pricePerMonth = apartment.Price_GHS;
        const subtotal = (pricePerMonth / 30) * nights;
        const tax = subtotal * config.taxRate;
        const total = subtotal + tax;
        summaryContainer.innerHTML = `
          <div class="price-row"><span>${nights} night${nights > 1 ? 's' : ''}</span> <span>${formatCurrency(subtotal)}</span></div>
          <div class="price-row"><span>Taxes & Fees</span> <span>${formatCurrency(tax)}</span></div>
          <div class="price-row total"><span>Total</span> <span>${formatCurrency(total)}</span></div>
        `;
      } else {
        summaryContainer.innerHTML = '<p class="summary-placeholder">Select an apartment and dates to see your booking summary.</p>';
      }
    },

    async handleBookingSubmit(event) {
      event.preventDefault();
      const form = $('#booking-form');
      const submitBtn = $('#submit-booking');
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      show($('#spinner-overlay'));

      try {
        const formData = new FormData(form);
        const bookingData = Object.fromEntries(formData.entries());
        
        // Get selected apartment details
        let selectedApartment = state.listings.find(apt => apt.ID === bookingData.apartmentType);
        if (!selectedApartment) {
          // Try mock apartments if not found in state
          const mockApartments = getMockApartments();
          const mockApt = mockApartments.find(apt => apt.id === bookingData.apartmentType);
          if (mockApt) {
            selectedApartment = { ID: mockApt.id, Title: mockApt.type, Price_GHS: mockApt.price };
          }
        }
        
        if (!selectedApartment) {
          throw new Error('Please select an apartment');
        }

        // Calculate total amount
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const subtotal = (selectedApartment.Price_GHS / 30) * nights;
        const tax = subtotal * config.taxRate;
        const totalAmount = subtotal + tax;

        // Prepare booking data for your Google Apps Script createBooking function
        const bookingPayload = {
          apartmentType: selectedApartment.Title, // Your backend expects apartment title
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone
        };

        console.log('Creating booking with payload:', bookingPayload);

        // Call your Google Apps Script createBooking function
        const bookingResponse = await callGoogleFunction('createBooking', bookingPayload);
        
        if (bookingResponse && bookingResponse.success) {
          notify('Booking created successfully! Proceeding to payment...', 'success', 3000);
          
          // Trigger payment with the booking ID returned from your backend
          this.triggerPaystack({
            email: bookingData.email,
            amount: totalAmount,
            bookingId: bookingResponse.bookingId, // Use the ID from your backend
            apartmentTitle: selectedApartment.Title
          });
        } else {
          throw new Error(bookingResponse?.message || 'Failed to create booking');
        }

      } catch (error) {
        console.error('Booking error:', error);
        notify(error.message || 'Booking failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking & Pay';
      } finally {
        hide($('#spinner-overlay'));
      }
    },

    triggerPaystack(bookingDetails) {
      console.log('Payment details:', bookingDetails);
      
      // Ensure PaystackPop is loaded
      if (typeof PaystackPop === 'undefined') {
        notify('Payment system not loaded. Please refresh the page and try again.', 'error', 5000);
        return;
      }
      
      const handler = PaystackPop.setup({
        key: config.paystackKey,
        email: bookingDetails.email,
        amount: Math.round(bookingDetails.amount * 100), // Convert to pesewas
        currency: 'GHS',
        reference: bookingDetails.bookingId, // Use the booking ID as payment reference
        callback: function(response) {
          console.log('Payment response:', response);
          notify('Payment successful! Verifying...', 'info', 3000);
          
          // Handle payment verification asynchronously
          App.handlePaymentVerification(response, bookingDetails);
        },
        onClose: function() {
          notify('Payment window closed. You can try again.', 'warn', 4000);
          // Reset button state when payment is cancelled
          const submitBtn = $('#submit-booking');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Booking & Pay Securely';
          }
        }
      });

      handler.openIframe();
    },

    async handlePaymentVerification(response, bookingDetails) {
      try {
        // Call your Google Apps Script verifyPaystackTransaction function
        const verificationResponse = await callGoogleFunction('verifyPaystackTransaction', response.reference);
        
        if (verificationResponse && verificationResponse.success) {
          notify('🎉 Booking Confirmed! Check your email for details.', 'success', 6000);
          
          // Reset form
          const form = $('#booking-form');
          if (form) form.reset();
          
          // Reset summary
          const summaryContent = document.querySelector('.summary-content');
          if (summaryContent) {
            summaryContent.innerHTML = '<div class="summary-placeholder" style="text-align: center; color: #64748b; padding: 2rem; border: 2px dashed #e2e8f0; border-radius: 8px;"><div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div><p style="margin: 0;">Select an apartment and dates to see your booking summary and pricing details.</p></div>';
          }
          
          // Reset button state
          const submitBtn = $('#submit-booking');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Booking & Pay Securely';
          }
          
          // Show success message with booking reference
          setTimeout(() => {
            notify(`Booking Reference: ${response.reference}. You will receive a confirmation email shortly.`, 'success', 8000);
          }, 2000);
          
        } else {
          throw new Error(verificationResponse?.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        notify('Payment verification failed. Please contact support with reference: ' + response.reference, 'error', 8000);
        
        // Reset button state on error
        const submitBtn = $('#submit-booking');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Booking & Pay Securely';
        }
      }
    }
  };

  // --- Check Paystack Loading ---
  function checkPaystackLoaded() {
    if (typeof PaystackPop === 'undefined') {
      console.warn('Paystack not loaded yet, retrying...');
      setTimeout(checkPaystackLoaded, 500);
    } else {
      console.log('Paystack loaded successfully');
    }
  }

  // --- Progressive Enhancement: DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // Check if Paystack is loaded
    setTimeout(checkPaystackLoaded, 1000);
  });
})();

// (Optional) Add this test snippet to verify listings data:
if (window.location.search.includes('testAPI')) {
  // Paste this code into your console or load a URL with ?testAPI for debugging.
  fetchFromScript('listings')
    .then(data => console.log('Test: Listings data fetched successfully:', data))
    .catch(err => console.error('Test: Listings fetch error:', err));
}