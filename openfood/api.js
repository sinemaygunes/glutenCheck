// API functions for the website
var API = {
  // Base URL for the API
  url: "https://world.openfoodfacts.org",

  // Wait time between requests (1 second)
  waitTime: 1000,

  // Function to wait
  wait: function (ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  },

  // Function to make URL
  makeUrl: function (path, params) {
    var url = this.url + path;

    // Add parameters if they exist
    if (params) {
      url += "?";
      for (var key in params) {
        if (params[key] != null) {
          // Handle arrays
          if (Array.isArray(params[key])) {
            url += key + "=" + params[key].join(",") + "&";
          } else {
            url += key + "=" + params[key] + "&";
          }
        }
      }
      // Remove last &
      url = url.slice(0, -1);
    }

    return url;
  },

  // Function to call API
  callApi: function (url) {
    return fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GlutenCheck - Android - Version 1.0 - www.glutencheck.com",
      },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .catch(function (error) {
        console.log("API error:", error);
        throw error;
      });
  },

  // Function to search by barcode
  searchByBarcode: function (barcode) {
    var url = this.makeUrl("/api/v0/product/" + barcode + ".json", {
      lc: "en",
    });

    return this.callApi(url).then(
      function (data) {
        return this.wait(this.waitTime).then(function () {
          return data;
        });
      }.bind(this)
    );
  },

  // Function to search by name
  searchByName: function (name) {
    var url = this.makeUrl("/cgi/search.pl", {
      search_terms: name,
      search_simple: 1,
      action: "process",
      json: 1,
      page_size: 24,
      lc: "en",
      fields: ["code", "product_name", "brands", "categories", "allergens_tags", "labels_tags", "image_url", "selected_images"],
    });

    return this.callApi(url).then(
      function (data) {
        return this.wait(this.waitTime).then(function () {
          return data;
        });
      }.bind(this)
    );
  },

  // Function to get product by ID
  getById: function (code) {
    var url = this.makeUrl("/api/v0/product/" + code + ".json", {
      lc: "en",
    });

    return this.callApi(url).then(
      function (data) {
        return this.wait(500).then(function () {
          return data;
        });
      }.bind(this)
    );
  },
};
