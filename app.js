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
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
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

  // Mock data functions for development/fallback - Updated with 2 apartments and proper images
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
      show($('#spinner-overlay'));

      try {
        const formData = new FormData(form);
        const bookingData = Object.fromEntries(formData.entries());
        const selectedApartment = state.listings.find(apt => apt.ID === bookingData.apartmentType);
        
        if (!selectedApartment) {
          throw new Error('Selected apartment not found');
        }

        // Calculate total amount
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const amount = ((selectedApartment.Price_GHS / 30) * nights) * (1 + config.taxRate);

        // Create unique booking reference
        const bookingReference = `BK${Date.now()}`;

        // Prepare booking payload
        const payload = {
          action: 'createBooking',
          reference: bookingReference,
          apartmentId: selectedApartment.ID,
          apartmentTitle: selectedApartment.Title,
          amount: amount,
          ...bookingData
        };

        // Send booking to Google Sheet
        const response = await fetchFromScript(`createBooking&${new URLSearchParams(payload)}`);
        
        if (response.success) {
          // Trigger payment
          this.triggerPaystack({
            email: bookingData.email,
            amount: amount,
            bookingId: bookingReference
          });
        } else {
          throw new Error(response.message || 'Booking failed');
        }

      } catch (error) {
        notify(error.message, 'error');
      } finally {
        hide($('#spinner-overlay'));
        submitBtn.disabled = false;
      }
    },

    triggerPaystack(bookingDetails) {
      console.log('Payment details:', bookingDetails); // Debug log
      
      const handler = PaystackPop.setup({
        key: config.paystackKey,
        email: bookingDetails.email,
        amount: Math.round(bookingDetails.amount * 100), // Convert to pesewas
        currency: 'GHS',
        reference: bookingDetails.bookingId,
        callback: (response) => {
          console.log('Payment response:', response); // Debug log
          notify('Payment successful! Verifying...', 'info');
          postToScript('verifyPayment', { 
            reference: response.reference,
            bookingId: bookingDetails.bookingId
          })
          .then(() => {
            notify('Booking Confirmed! Check your email.', 'success');
            $('#booking-form').reset();
          })
          .catch(err => {
            console.error('Verification error:', err);
            notify('Payment verification failed. Please contact support.', 'error');
          });
        },
        onClose: () => {
          notify('Payment window closed.', 'warn');
        }
      });

      handler.openIframe();
    }
  };

  // --- Progressive Enhancement: DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
})();

// (Optional) Add this test snippet to verify listings data:
if (window.location.search.includes('testAPI')) {
  // Paste this code into your console or load a URL with ?testAPI for debugging.
  fetchFromScript('listings')
    .then(data => console.log('Test: Listings data fetched successfully:', data))
    .catch(err => console.error('Test: Listings fetch error:', err));
}