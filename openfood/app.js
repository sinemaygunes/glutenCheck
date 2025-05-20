// Constants
const MAX_RECENT_SEARCHES = 5;
const FAVORITES_KEY = "favorites";

// API Configuration
const API_BASE_URL = "https://world.openfoodfacts.org";
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

// Add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Modal functions
function showModal() {
  const modal = document.getElementById("productModal");
  document.body.style.overflow = "hidden";
  modal.classList.add("show");

  // Close modal when clicking outside
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Close modal when clicking close button
  const closeBtn = modal.querySelector(".close-modal");
  closeBtn.onclick = closeModal;

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById("productModal");
  document.body.style.overflow = "";
  modal.classList.remove("show");
}

// Add copy functionality
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copied");
    button.innerHTML = "✓";

    // Reset button after 2 seconds
    setTimeout(() => {
      button.classList.remove("copied");
      button.innerHTML = "📋";
    }, 2000);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
}

// Create copy button element
function createCopyButton(barcode) {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.innerHTML = "📋";
  button.onclick = (e) => {
    e.stopPropagation(); // Prevent modal from opening when clicking copy button
    copyToClipboard(barcode, button);
  };
  return button;
}

function displayInModal(product) {
  // Set modal content
  document.getElementById("modalProductName").textContent = product.product_name || "Unnamed Product";
  document.getElementById("modalBrand").textContent = product.brands || "Not specified";
  document.getElementById("modalCategory").textContent = product.categories || "Not specified";

  // Update barcode display with copy button
  const barcodeContainer = document.getElementById("modalBarcode");
  const barcode = product.code || "No barcode available";
  barcodeContainer.innerHTML = "";
  barcodeContainer.className = "barcode-container";

  const barcodeText = document.createElement("span");
  barcodeText.textContent = barcode;
  barcodeContainer.appendChild(barcodeText);

  if (barcode !== "No barcode available") {
    barcodeContainer.appendChild(createCopyButton(barcode));
  }

  // Set gluten status with appropriate styling
  const glutenStatusElement = document.getElementById("modalGlutenStatus");
  if (isGlutenFree(product)) {
    glutenStatusElement.innerHTML = '<span class="gluten-free-status status-safe">✓ Gluten Free</span>';
  } else if (!product.allergens_tags && !product.labels_tags) {
    glutenStatusElement.innerHTML = '<span class="gluten-free-status status-unknown">? Status Unknown</span>';
  } else {
    glutenStatusElement.innerHTML = '<span class="gluten-free-status status-unsafe">⚠ Contains Gluten</span>';
  }

  // Set allergens
  const allergens = (product.allergens_tags || [])
    .map((allergen) =>
      allergen
        .replace("en:", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    )
    .join(", ");
  document.getElementById("modalAllergens").textContent = allergens || "None specified";

  // Set product image
  const modalImageContainer = document.getElementById("modalProductImage").parentElement;
  const imageUrl = product.image_url || product.selected_images?.front?.display?.url || "";

  if (imageUrl) {
    modalImageContainer.innerHTML = `<img id="modalProductImage" src="${imageUrl}" alt="${product.product_name || "Product"}" onerror="this.parentElement.innerHTML='<div class=\'no-image-placeholder\'>No image available</div>'">`;
  } else {
    modalImageContainer.innerHTML = '<div class="no-image-placeholder">No image available</div>';
  }

  showModal();
}

// Loading state management
function setLoading(isLoading) {
  const spinner = document.getElementById("loadingSpinner");
  const barcodeButton = document.getElementById("barcodeButton");
  const nameButton = document.getElementById("nameButton");

  if (isLoading) {
    spinner.style.display = "block";
    barcodeButton.disabled = true;
    nameButton.disabled = true;
  } else {
    spinner.style.display = "none";
    barcodeButton.disabled = false;
    nameButton.disabled = false;
  }
}

// Error handling
function showError(message) {
  const searchResults = document.getElementById("searchResults");
  searchResults.innerHTML = `
    <div style="color: #dc3545; text-align: center; padding: 20px;">
      <p>😕 ${message}</p>
      <p style="font-size: 0.9em; color: #666;">Please try again later.</p>
    </div>
  `;
}

// Recent searches management
function getRecentSearches() {
  const searches = localStorage.getItem("recentSearches");
  return searches ? JSON.parse(searches) : [];
}

function addRecentSearch(searchTerm, searchType) {
  let searches = getRecentSearches();
  searches = searches.filter((search) => !(search.term === searchTerm && search.type === searchType));
  searches.unshift({ term: searchTerm, type: searchType, timestamp: new Date().toISOString() });
  searches = searches.slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem("recentSearches", JSON.stringify(searches));
  displayRecentSearches();
}

function removeRecentSearch(index) {
  let searches = getRecentSearches();
  searches.splice(index, 1);
  localStorage.setItem("recentSearches", JSON.stringify(searches));
  displayRecentSearches();
}

function displayRecentSearches() {
  const searches = getRecentSearches();
  const container = document.getElementById("recentSearchesList");
  container.innerHTML = "";

  if (searches.length === 0) {
    container.innerHTML = "<p>No recent searches</p>";
    return;
  }

  searches.forEach((search, index) => {
    const searchItem = document.createElement("div");
    searchItem.className = "recent-search-item";
    searchItem.onclick = (e) => {
      // Don't trigger search if clicking the remove button
      if (e.target.classList.contains("remove-search")) return;

      document.getElementById("searchInput").value = search.term;
      if (search.type === "barcode") {
        searchByBarcode();
      } else {
        searchByName();
      }
    };

    searchItem.innerHTML = `
      <div class="search-content">
        <span class="search-term">${search.term}</span>
        <span class="search-type">${search.type === "barcode" ? "Barcode" : "Name"}</span>
      </div>
      <span class="remove-search" onclick="removeRecentSearch(${index})">×</span>
    `;

    container.appendChild(searchItem);
  });
}

// Check if product is gluten-free
function isGlutenFree(product) {
  const labels = product.labels_tags || [];
  if (labels.includes("en:gluten-free")) return true;

  const allergens = product.allergens_tags || [];
  const glutenAllergens = ["en:gluten", "en:wheat", "en:barley", "en:rye", "en:oats"];
  return !allergens.some((allergen) => glutenAllergens.includes(allergen));
}

// Helper function for API calls
async function fetchAPI(url, options = {}) {
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
}

// Helper function to check if product is in English
function isEnglishProduct(product) {
  // Check if product name exists and is in English
  if (!product.product_name) return false;

  // Check for specific English indicators
  const hasEnglishName = product.product_name_en || product.product_name.match(/^[a-zA-Z0-9\s\W]+$/);

  // If product has languages_tags, check if English is included
  if (product.languages_tags) {
    return product.languages_tags.includes("en");
  }

  return hasEnglishName;
}

// Search by barcode
async function searchByBarcode() {
  const searchValue = document.getElementById("searchInput").value;
  if (!searchValue) {
    alert("Please enter a barcode number");
    return;
  }

  // Clear previous results
  document.getElementById("searchResults").innerHTML = "";
  const oldProductInfo = document.getElementById("productInfo");
  if (oldProductInfo) oldProductInfo.remove();

  // Show loading state
  setLoading(true);

  try {
    const data = await API.searchByBarcode(searchValue);

    if (data.status === 1) {
      addRecentSearch(searchValue, "barcode");
      displayInModal(data.product);
    } else {
      showError("Product not found");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Failed to fetch product information");
  } finally {
    setLoading(false);
  }
}

// Search by name
async function searchByName() {
  const searchValue = document.getElementById("searchInput").value;
  if (!searchValue) {
    alert("Please enter a product name");
    return;
  }

  // Clear previous results
  document.getElementById("searchResults").innerHTML = "";
  const oldProductInfo = document.getElementById("productInfo");
  if (oldProductInfo) oldProductInfo.remove();

  // Show loading state
  setLoading(true);

  try {
    const data = await API.searchByName(searchValue);

    if (data.products && data.products.length > 0) {
      addRecentSearch(searchValue, "name");
      displaySearchResults(data.products);
    } else {
      showError("No products found");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Failed to fetch search results");
  } finally {
    setLoading(false);
  }
}

// Add this function to manage favorites
function getFavorites() {
  const favorites = localStorage.getItem(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
}

function toggleFavorite(code) {
  let favorites = getFavorites();
  const index = favorites.indexOf(code);

  if (index === -1) {
    favorites.push(code);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

  // If we're viewing favorites, refresh the display
  const favButton = document.getElementById("favoritesButton");
  if (favButton.classList.contains("active")) {
    showFavorites();
  }

  return index === -1;
}

// Show favorites
async function showFavorites() {
  const favorites = getFavorites();
  if (favorites.length === 0) {
    showError("No favorite products yet! Click the ♥ on products to add them to favorites.");
    return;
  }

  // Clear previous results
  document.getElementById("searchResults").innerHTML = "";
  const oldProductInfo = document.getElementById("productInfo");
  if (oldProductInfo) oldProductInfo.remove();

  // Show loading state
  setLoading(true);

  try {
    const products = [];
    // Fetch details for each favorite product
    for (const code of favorites) {
      try {
        const data = await API.getById(code);
        if (data.status === 1) {
          products.push(data.product);
        }
      } catch (error) {
        console.error(`Error fetching product ${code}:`, error);
      }
    }

    if (products.length > 0) {
      displaySearchResults(products);
    } else {
      showError("Failed to load favorite products. Please try again later.");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("Failed to load favorite products");
  } finally {
    setLoading(false);
  }
}

// Helper function to check if a product is in favorites
function isInFavorites(code) {
  const favorites = getFavorites();
  return favorites.includes(code);
}

// Display search results
function displaySearchResults(products) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";

  products.forEach((product) => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";

    if (isGlutenFree(product)) {
      resultItem.classList.add("gluten-free");
    } else if (!product.allergens_tags && !product.labels_tags) {
      resultItem.classList.add("gluten-unknown");
    }

    const productName = product.product_name || "Unnamed Product";
    const imageUrl = product.image_url || product.selected_images?.front?.display?.url || "";
    const barcode = product.code || "No barcode available";
    const isFavorite = isInFavorites(barcode);

    const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${productName}" onerror="this.parentElement.innerHTML='<div class=\'no-image-placeholder\'>No image available</div>'">` : `<div class="no-image-placeholder">No image available</div>`;

    resultItem.innerHTML = `
      ${imageHtml}
      <button class="fav-button ${isFavorite ? "active" : ""}" onclick="event.stopPropagation(); this.classList.toggle('active'); toggleFavorite('${barcode}');">
        ♥
      </button>
      <div class="product-info">
        <span class="product-name">${productName}</span>
        <span class="barcode">
          ${barcode}
          ${barcode !== "No barcode available" ? `<button class="copy-button" onclick="event.stopPropagation(); copyToClipboard('${barcode}', this)">📋</button>` : ""}
        </span>
      </div>
    `;

    resultItem.onclick = () => displayInModal(product);
    resultsContainer.appendChild(resultItem);
  });
}

// Initialize recent searches display
document.addEventListener("DOMContentLoaded", displayRecentSearches);
