/**
 * Application Configuration
 * Centralized configuration for the Jeffston Court booking system
 */

const CONFIG = {
  // API Configuration
  api: {
    baseUrl: 'https://script.google.com/macros/s/AKfycbxfAKrIYIeeMTWfvLrvBZbYaKbNXDYcIyBhHYmj-oj5KWHvEE0zlz-6vhOGyr-08D9W/exec',
    timeout: 30000, // 30 seconds
  },

  // Payment Configuration
  payment: {
    paystackPublicKey: 'pk_live_9302b8356f0551937a496101908e2eb772328962',
    currency: 'GHS',
    taxRate: 0.12,
  },

  // Business Information
  business: {
    name: 'Jeffston Court Apartments',
    phone: '+233201349321',
    whatsappMessage: "Hello! I'm interested in booking an apartment.",
    address: {
      street: 'Nii Darko Street',
      city: 'Accra',
      country: 'Ghana',
    },
  },

  // Application Settings
  app: {
    listingsPerPage: 6,
    maxGuests: 10,
    minStayDays: 1,
    maxStayDays: 365,
    notificationDuration: 4000,
  },

  // Development Settings
  dev: {
    enableLogging: false, // Set to true only for development
    useMockData: false, // Fallback to mock data if API fails
  },
};

// Make configuration read-only
Object.freeze(CONFIG);

// Export for module systems or make globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}