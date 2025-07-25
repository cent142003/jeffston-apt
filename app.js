/**
 * Jeffston Court Apartments - Booking System
 * Professional booking application with Paystack integration
 */

class BookingApp {
  constructor() {
    this.state = {
      listings: [],
      currentPage: 1,
      isLoading: false,
    };

    this.selectors = {
      spinnerOverlay: '#spinner-overlay',
      bookingForm: '#booking-form',
      apartmentSelect: '#apartmentType',
      summaryContent: '.summary-content',
      listingsContainer: '#listings-container',
      filterForm: '#filter-form',
      prevPageBtn: '#prev-page',
      nextPageBtn: '#next-page',
      pageInfo: '#page-info',
    };

    this.init();
  }

  // Initialization
  init() {
    this.bindEvents();
    this.loadPage();
  }

  bindEvents() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupWhatsAppLink();
    });
  }

  loadPage() {
    const currentPage = this.getCurrentPage();
    
    switch (currentPage) {
      case 'listings':
        this.initListingsPage();
        break;
      case 'booking':
        this.initBookingPage();
        break;
      default:
        this.initBookingPage();
    }
  }

  getCurrentPage() {
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'listings.html') return 'listings';
    if (path === 'index.html' || path === '') return 'booking';
    
    return 'booking';
  }

  // Utility Methods
  $(selector) {
    return document.querySelector(selector);
  }

  $$(selector) {
    return document.querySelectorAll(selector);
  }

  show(element) {
    if (element) element.classList.remove('hidden');
  }

  hide(element) {
    if (element) element.classList.add('hidden');
  }

  log(message, data = null) {
    if (CONFIG.dev.enableLogging) {
      console.log(`[BookingApp] ${message}`, data);
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: CONFIG.payment.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Notification System
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification--show');
    });

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('notification--show');
      setTimeout(() => notification.remove(), 300);
    }, CONFIG.app.notificationDuration);
  }

  // Loading State Management
  setLoading(isLoading) {
    this.state.isLoading = isLoading;
    const spinner = this.$(this.selectors.spinnerOverlay);
    
    if (isLoading) {
      this.show(spinner);
    } else {
      this.hide(spinner);
    }
  }

  // API Communication
  async apiRequest(action, data = null) {
    const url = `${CONFIG.api.baseUrl}?action=${action}`;
    this.log(`Making API request to: ${action}`, data);

    try {
      const options = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log(`API response for ${action}:`, result);
      
      return result;
    } catch (error) {
      this.log(`API error for ${action}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      // Fallback to mock data for development
      if (CONFIG.dev.useMockData) {
        return this.getMockData(action);
      }
      
      throw new Error(`Failed to ${action}: ${error.message}`);
    }
  }

  // Mock Data (Development Only)
  getMockData(action) {
    const mockData = {
      listings: [
        {
          ID: 'APT001',
          Title: '2-Bedroom Luxury Apartment',
          Description: 'Spacious apartment with modern amenities, high-speed internet, and 24/7 security.',
          Price_GHS: 4200,
          Image_URL: 'Assets/photo_3_2025-07-25_06-12-23.jpg',
          Available: 'yes',
          Bedrooms: 2,
        },
        {
          ID: 'APT002',
          Title: '3-Bedroom Premium Apartment',
          Description: 'Premium apartment perfect for families with full kitchen and living areas.',
          Price_GHS: 6840,
          Image_URL: 'Assets/photo_4_2025-07-25_06-12-23.jpg',
          Available: 'yes',
          Bedrooms: 3,
        },
        {
          ID: 'APT003',
          Title: 'Executive 1-Bedroom Suite',
          Description: 'Perfect for business travelers with workspace and luxury amenities.',
          Price_GHS: 3200,
          Image_URL: 'Assets/photo_5_2025-07-25_06-12-23.jpg',
          Available: 'yes',
          Bedrooms: 1,
        },
      ],
      getApartments: [
        { id: 'APT001', type: '2-Bedroom Luxury Apartment', price: 4200 },
        { id: 'APT002', type: '3-Bedroom Premium Apartment', price: 6840 },
        { id: 'APT003', type: 'Executive 1-Bedroom Suite', price: 3200 },
      ],
    };

    return mockData[action] || [];
  }

  // Listings Page
  async initListingsPage() {
    try {
      this.setLoading(true);
      await this.loadListings();
      this.renderListings();
      this.setupFilters();
      this.setupPagination();
    } catch (error) {
      this.showNotification('Failed to load listings', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async loadListings() {
    if (this.state.listings.length > 0) return;
    
    const data = await this.apiRequest('listings');
    this.state.listings = Array.isArray(data) ? data : [];
  }

  renderListings() {
    const container = this.$(this.selectors.listingsContainer);
    if (!container) return;

    const listings = this.getFilteredListings();
    const paginatedListings = this.getPaginatedListings(listings);

    if (paginatedListings.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <h3>No apartments match your criteria</h3>
          <p>Try adjusting your filters or check back later for new listings.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = paginatedListings.map(listing => `
      <a class="card-link" href="index.html?apt_id=${listing.ID}" aria-label="Book ${listing.Title}">
        <article class="card">
          <img src="${listing.Image_URL}" alt="${listing.Title}" loading="lazy">
          <div class="card-content">
            <h3>${listing.Title}</h3>
            <p>${listing.Description}</p>
            <span class="price">${this.formatCurrency(listing.Price_GHS)} / month</span>
          </div>
        </article>
      </a>
    `).join('');

    this.updatePaginationUI(listings.length);
  }

  getFilteredListings() {
    const form = this.$(this.selectors.filterForm);
    if (!form) return this.state.listings;

    const formData = new FormData(form);
    const priceRange = formData.get('price-range');
    const bedrooms = formData.get('bedrooms');

    return this.state.listings.filter(listing => {
      const priceMatch = !priceRange || this.checkPriceRange(listing.Price_GHS, priceRange);
      const bedroomMatch = !bedrooms || bedrooms === 'any' || 
        parseInt(listing.Bedrooms) >= parseInt(bedrooms);
      const availableMatch = listing.Available?.toLowerCase() === 'yes';

      return priceMatch && bedroomMatch && availableMatch;
    });
  }

  checkPriceRange(price, range) {
    const [min, max] = range.split('-').map(Number);
    return price >= min && (max ? price <= max : true);
  }

  getPaginatedListings(listings) {
    const start = (this.state.currentPage - 1) * CONFIG.app.listingsPerPage;
    const end = start + CONFIG.app.listingsPerPage;
    return listings.slice(start, end);
  }

  setupFilters() {
    const form = this.$(this.selectors.filterForm);
    if (!form) return;

    form.addEventListener('input', () => {
      this.state.currentPage = 1;
      this.renderListings();
    });
  }

  setupPagination() {
    const prevBtn = this.$(this.selectors.prevPageBtn);
    const nextBtn = this.$(this.selectors.nextPageBtn);

    prevBtn?.addEventListener('click', () => {
      if (this.state.currentPage > 1) {
        this.state.currentPage--;
        this.renderListings();
      }
    });

    nextBtn?.addEventListener('click', () => {
      const filteredListings = this.getFilteredListings();
      const totalPages = Math.ceil(filteredListings.length / CONFIG.app.listingsPerPage);
      
      if (this.state.currentPage < totalPages) {
        this.state.currentPage++;
        this.renderListings();
      }
    });
  }

  updatePaginationUI(totalItems) {
    const pageInfo = this.$(this.selectors.pageInfo);
    const prevBtn = this.$(this.selectors.prevPageBtn);
    const nextBtn = this.$(this.selectors.nextPageBtn);
    
    const totalPages = Math.ceil(totalItems / CONFIG.app.listingsPerPage);
    
    if (pageInfo) {
      pageInfo.textContent = `Page ${this.state.currentPage} of ${totalPages || 1}`;
    }
    
    if (prevBtn) prevBtn.disabled = this.state.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.state.currentPage >= totalPages;
  }

  // Booking Page
  async initBookingPage() {
    try {
      this.setLoading(true);
      await this.loadListings();
      await this.populateApartmentDropdown();
      this.setupBookingForm();
      this.handlePreselectedApartment();
    } catch (error) {
      this.showNotification('Failed to initialize booking form', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async populateApartmentDropdown() {
    const select = this.$(this.selectors.apartmentSelect);
    if (!select) return;

    try {
      const apartments = await this.apiRequest('getApartments');
      
      select.innerHTML = '<option value="">-- Select Apartment --</option>';
      
      apartments.forEach(apt => {
        const option = document.createElement('option');
        option.value = apt.id || apt.ID;
        option.textContent = `${apt.type || apt.Title} - ${this.formatCurrency(Number(apt.price || apt.Price_GHS))}`;
        select.appendChild(option);
      });
    } catch (error) {
      this.showNotification('Failed to load apartment options', 'error');
      select.innerHTML = '<option value="">Error loading apartments</option>';
    }
  }

  handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const apartmentId = urlParams.get('apt_id');
    
    if (apartmentId) {
      const select = this.$(this.selectors.apartmentSelect);
      if (select) {
        select.value = apartmentId;
        this.updateBookingSummary();
      }
    }
  }

  setupBookingForm() {
    const form = this.$(this.selectors.bookingForm);
    if (!form) return;

    form.addEventListener('input', () => this.updateBookingSummary());
    form.addEventListener('submit', (e) => this.handleBookingSubmission(e));
  }

  updateBookingSummary() {
    const apartmentId = this.$(this.selectors.apartmentSelect)?.value;
    const checkIn = this.$('#checkIn')?.value;
    const checkOut = this.$('#checkOut')?.value;
    const summaryContainer = this.$(this.selectors.summaryContent);

    if (!summaryContainer) return;

    if (!apartmentId || !checkIn || !checkOut) {
      summaryContainer.innerHTML = `
        <p class="summary-placeholder">
          Select an apartment and dates to see your booking summary.
        </p>
      `;
      return;
    }

    const apartment = this.state.listings.find(apt => apt.ID === apartmentId);
    if (!apartment) return;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      summaryContainer.innerHTML = `
        <p class="summary-error">Check-out date must be after check-in date.</p>
      `;
      return;
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const dailyRate = apartment.Price_GHS / 30;
    const subtotal = dailyRate * nights;
    const tax = subtotal * CONFIG.payment.taxRate;
    const total = subtotal + tax;

    summaryContainer.innerHTML = `
      <div class="price-breakdown">
        <div class="price-row">
          <span>${nights} night${nights > 1 ? 's' : ''}</span>
          <span>${this.formatCurrency(subtotal)}</span>
        </div>
        <div class="price-row">
          <span>Taxes & Fees</span>
          <span>${this.formatCurrency(tax)}</span>
        </div>
        <div class="price-row price-row--total">
          <span>Total</span>
          <span>${this.formatCurrency(total)}</span>
        </div>
      </div>
    `;
  }

  async handleBookingSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      submitBtn.disabled = true;
      this.setLoading(true);

      const bookingData = this.extractBookingData(form);
      const bookingReference = this.generateBookingReference();
      
      // Create booking record
      await this.createBooking({
        ...bookingData,
        reference: bookingReference,
      });

      // Process payment
      await this.processPayment({
        email: bookingData.email,
        amount: bookingData.totalAmount,
        reference: bookingReference,
      });

    } catch (error) {
      this.showNotification(error.message, 'error');
    } finally {
      this.setLoading(false);
      submitBtn.disabled = false;
    }
  }

  extractBookingData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const apartment = this.state.listings.find(apt => apt.ID === data.apartmentType);
    if (!apartment) {
      throw new Error('Selected apartment not found');
    }

    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const subtotal = (apartment.Price_GHS / 30) * nights;
    const tax = subtotal * CONFIG.payment.taxRate;
    const totalAmount = subtotal + tax;

    return {
      ...data,
      apartmentTitle: apartment.Title,
      nights,
      subtotal,
      tax,
      totalAmount,
    };
  }

  generateBookingReference() {
    return `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  async createBooking(bookingData) {
    try {
      const response = await this.apiRequest('createBooking', bookingData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create booking');
      }
      
      return response;
    } catch (error) {
      throw new Error(`Booking creation failed: ${error.message}`);
    }
  }

  async processPayment(paymentData) {
    return new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: CONFIG.payment.paystackPublicKey,
        email: paymentData.email,
        amount: Math.round(paymentData.amount * 100), // Convert to pesewas
        currency: CONFIG.payment.currency,
        reference: paymentData.reference,
        callback: async (response) => {
          try {
            await this.verifyPayment(response.reference);
            this.showNotification('Booking confirmed! Check your email for details.', 'success');
            this.resetBookingForm();
            resolve(response);
          } catch (error) {
            this.showNotification('Payment verification failed. Please contact support.', 'error');
            reject(error);
          }
        },
        onClose: () => {
          reject(new Error('Payment cancelled by user'));
        },
      });

      handler.openIframe();
    });
  }

  async verifyPayment(reference) {
    return this.apiRequest('verifyPayment', { reference });
  }

  resetBookingForm() {
    const form = this.$(this.selectors.bookingForm);
    if (form) {
      form.reset();
      this.updateBookingSummary();
    }
  }

  // General Setup
  setupWhatsAppLink() {
    const whatsappBtn = this.$('.whatsapp-fab');
    if (whatsappBtn) {
      const message = encodeURIComponent(CONFIG.business.whatsappMessage);
      whatsappBtn.href = `https://wa.me/${CONFIG.business.phone.replace('+', '')}?text=${message}`;
    }
  }
}

// Initialize the application
new BookingApp();