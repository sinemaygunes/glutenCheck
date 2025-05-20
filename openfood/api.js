// API Service Object
const API = {
  // Configuration
  baseUrl: "https://world.openfoodfacts.org",
  rateLimit: 1000, // 1 second delay between requests

  // API endpoints
  endpoints: {
    product: "/api/v0/product",
    search: "/cgi/search.pl",
  },

  // Search parameters
  params: {
    defaultFields: ["code", "product_name", "brands", "categories", "allergens_tags", "labels_tags", "image_url", "selected_images"],
    pageSize: 24,
    language: "en",
  },

  // Helper function for delay
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Helper function to build URL with parameters
  buildUrl(endpoint, params = {}) {
    const url = new URL(this.baseUrl + endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(","));
      } else if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.toString();
  },

  // Helper function for API calls
  async fetchAPI(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "User-Agent": "GlutenCheck - Android - Version 1.0 - www.glutencheck.com",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  },

  // API Functions
  async searchByBarcode(barcode) {
    const url = this.buildUrl(`${this.endpoints.product}/${barcode}.json`, {
      lc: this.params.language,
    });
    const data = await this.fetchAPI(url);
    await this.delay(this.rateLimit);
    return data;
  },

  async searchByName(name) {
    const url = this.buildUrl(this.endpoints.search, {
      search_terms: name,
      search_simple: 1,
      action: "process",
      json: 1,
      page_size: this.params.pageSize,
      lc: this.params.language,
      fields: this.params.defaultFields,
    });
    const data = await this.fetchAPI(url);
    await this.delay(this.rateLimit);
    return data;
  },

  async getById(code) {
    const url = this.buildUrl(`${this.endpoints.product}/${code}.json`, {
      lc: this.params.language,
    });
    const data = await this.fetchAPI(url);
    await this.delay(500); // Shorter delay for individual product fetches
    return data;
  },
};
