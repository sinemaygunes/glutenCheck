// API Configuration
const API_BASE_URL = "https://world.openfoodfacts.org";
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
const MAX_RECENT_SEARCHES = 5;

// Add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Recent searches management
function getRecentSearches() {
  const searches = localStorage.getItem("recentSearches");
  return searches ? JSON.parse(searches) : [];
}

function addRecentSearch(searchTerm, searchType) {
  let searches = getRecentSearches();

  // Remove if already exists
  searches = searches.filter((search) => !(search.term === searchTerm && search.type === searchType));

  // Add new search at the beginning
  searches.unshift({ term: searchTerm, type: searchType, timestamp: new Date().toISOString() });

  // Keep only the most recent searches
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

    const searchContent = document.createElement("div");
    searchContent.textContent = search.term;
    searchContent.onclick = () => {
      document.getElementById("searchInput").value = search.term;
      if (search.type === "barcode") {
        searchByBarcode();
      } else {
        searchByName();
      }
    };

    const searchType = document.createElement("span");
    searchType.className = "search-type";
    searchType.textContent = search.type === "barcode" ? "Barcode" : "Name";

    const removeButton = document.createElement("span");
    removeButton.className = "remove-search";
    removeButton.textContent = "×";
    removeButton.onclick = (e) => {
      e.stopPropagation();
      removeRecentSearch(index);
    };

    searchItem.appendChild(searchContent);
    searchItem.appendChild(searchType);
    searchItem.appendChild(removeButton);
    container.appendChild(searchItem);
  });
}

// Check if product is gluten-free
function isGlutenFree(product) {
  // Check for gluten-free labels
  const labels = product.labels_tags || [];
  if (labels.includes("en:gluten-free")) return true;

  // Check allergens
  const allergens = product.allergens_tags || [];
  const glutenAllergens = ["en:gluten", "en:wheat", "en:barley", "en:rye", "en:oats"];
  return !allergens.some((allergen) => glutenAllergens.includes(allergen));
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
  document.getElementById("productInfo").style.display = "none";

  // Show loading state
  setLoading(true);

  try {
    // Using the product API for exact barcode matches
    const response = await fetch(`${API_BASE_URL}/api/v0/product/${searchValue}.json`, {
      headers: {
        "User-Agent": "OpenFoodFacts/1.0",
      },
    });

    if (response.status === 429) {
      alert("Rate limit exceeded. Please wait a moment before trying again.");
      return;
    }

    const data = await response.json();

    if (data.status === 1) {
      addRecentSearch(searchValue, "barcode");
      displayProduct(data.product);
    } else {
      alert("Product not found");
    }

    // Add delay after successful request
    await delay(RATE_LIMIT_DELAY);
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again later.");
  } finally {
    // Hide loading state
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
  document.getElementById("productInfo").style.display = "none";

  // Show loading state
  setLoading(true);

  try {
    // Using the optimized search API with specific fields and sorting
    const response = await fetch(`${API_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(searchValue)}&search_simple=1&action=process&json=1&page_size=15&sort_by=popularity_key&fields=product_name,brands,categories,allergens_tags,labels_tags,image_url,selected_images`, {
      headers: {
        "User-Agent": "OpenFoodFacts/1.0",
      },
    });

    if (response.status === 429) {
      alert("Rate limit exceeded. Please wait a moment before trying again.");
      return;
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      addRecentSearch(searchValue, "name");
      displaySearchResults(data.products);
    } else {
      document.getElementById("searchResults").innerHTML = "<p>No products found</p>";
    }

    // Add delay after successful request
    await delay(RATE_LIMIT_DELAY);
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again later.");
  } finally {
    // Hide loading state
    setLoading(false);
  }
}

// Display search results
function displaySearchResults(products) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";

  products.forEach((product) => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";

    // Add gluten-free class if product is gluten-free
    if (isGlutenFree(product)) {
      resultItem.classList.add("gluten-free");
    }

    const productName = product.product_name || "Unnamed Product";
    const imageUrl = product.image_url || product.selected_images?.front?.display?.url || "";

    resultItem.innerHTML = `
            <img src="${imageUrl}" alt="${productName}" onerror="this.style.display='none'">
            <span>${productName}</span>
        `;

    resultItem.onclick = () => displayProduct(product);
    resultsContainer.appendChild(resultItem);
  });
}

// Display product details
function displayProduct(product) {
  const productInfo = document.getElementById("productInfo");
  productInfo.style.display = "block";

  document.getElementById("productName").textContent = product.product_name || "Unnamed Product";
  document.getElementById("brand").textContent = product.brands || "Not specified";
  document.getElementById("category").textContent = product.categories || "Not specified";

  // Display allergens
  const allergens = product.allergens_tags || [];
  const allergensText =
    allergens.length > 0
      ? allergens
          .map((allergen) => {
            return allergen
              .replace("en:", "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
          })
          .join(", ")
      : "Not specified";
  document.getElementById("allergens").textContent = allergensText;

  // Product image
  const imageUrl = product.image_url || product.selected_images?.front?.display?.url;
  const productImage = document.getElementById("productImage");
  if (imageUrl) {
    productImage.src = imageUrl;
    productImage.style.display = "block";
  } else {
    productImage.style.display = "none";
  }

  // Scroll to product info
  productInfo.scrollIntoView({ behavior: "smooth" });
}

// Initialize recent searches display
document.addEventListener("DOMContentLoaded", displayRecentSearches);
