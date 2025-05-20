// Variables for the website
var recentSearches = [];
var favorites = [];
const maxSearches = 5;

// Function to show the modal
function showModal() {
  var modal = document.getElementById("productModal");
  modal.style.display = "flex";
  // Force reflow to enable animation
  modal.offsetHeight;
  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  // Close when clicking outside
  modal.onclick = function (e) {
    if (e.target == modal) {
      closeModal();
    }
  };

  // Close with X button
  var closeBtn = modal.querySelector(".close-modal");
  closeBtn.onclick = function () {
    closeModal();
  };

  // Close with ESC key
  document.onkeydown = function (e) {
    if (e.key == "Escape") {
      closeModal();
    }
  };
}

// Function to close the modal
function closeModal() {
  var modal = document.getElementById("productModal");
  modal.classList.remove("show");

  // Wait for animation to complete before hiding
  setTimeout(function () {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }, 300); // Match this with CSS transition duration
}

// Function to copy barcode
function copyBarcode(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      button.innerHTML = "✓";
      button.style.backgroundColor = "#4CAF50";

      // Change back after 2 seconds
      setTimeout(function () {
        button.innerHTML = "📋";
        button.style.backgroundColor = "";
      }, 2000);
    })
    .catch(function (err) {
      console.log("Could not copy text: ", err);
    });
}

// Function to make copy button
function makeCopyButton(barcode) {
  var btn = document.createElement("button");
  btn.innerHTML = "📋";
  btn.onclick = function (e) {
    e.stopPropagation();
    copyBarcode(barcode, btn);
  };
  return btn;
}

// Function to show loading
function showLoading(show) {
  var spinner = document.getElementById("loadingSpinner");
  var barcodeBtn = document.getElementById("barcodeButton");
  var nameBtn = document.getElementById("nameButton");

  if (show) {
    spinner.style.display = "block";
    barcodeBtn.disabled = true;
    nameBtn.disabled = true;
  } else {
    spinner.style.display = "none";
    barcodeBtn.disabled = false;
    nameBtn.disabled = false;
  }
}

// Function to show error
function showError(message) {
  var results = document.getElementById("searchResults");
  results.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">' + "<p>😕 " + message + "</p>" + '<p style="font-size: 14px; color: #666;">Try again later</p>' + "</div>";
}

// Function to get recent searches
function getRecentSearches() {
  var searches = localStorage.getItem("recentSearches");
  return searches ? JSON.parse(searches) : [];
}

// Function to add recent search
function addRecentSearch(term, type) {
  var searches = getRecentSearches();

  // Remove if already exists
  for (var i = 0; i < searches.length; i++) {
    if (searches[i].term == term && searches[i].type == type) {
      searches.splice(i, 1);
      break;
    }
  }

  // Add to start
  searches.unshift({
    term: term,
    type: type,
    date: new Date().toISOString(),
  });

  // Keep only 5 searches
  if (searches.length > maxSearches) {
    searches = searches.slice(0, maxSearches);
  }

  localStorage.setItem("recentSearches", JSON.stringify(searches));
  showRecentSearches();
}

// Function to remove recent search
function removeRecentSearch(index) {
  var searches = getRecentSearches();
  searches.splice(index, 1);
  localStorage.setItem("recentSearches", JSON.stringify(searches));
  showRecentSearches();
}

// Function to show recent searches
function showRecentSearches() {
  var searches = getRecentSearches();
  var container = document.getElementById("recentSearchesList");
  container.innerHTML = "";

  if (searches.length == 0) {
    container.innerHTML = "<p>No recent searches</p>";
    return;
  }

  for (var i = 0; i < searches.length; i++) {
    var search = searches[i];
    var div = document.createElement("div");
    div.className = "recent-search-item";

    div.onclick = (function (search) {
      return function (e) {
        if (e.target.className == "remove-search") return;

        document.getElementById("searchInput").value = search.term;
        if (search.type == "barcode") {
          searchByBarcode();
        } else {
          searchByName();
        }
      };
    })(search);

    div.innerHTML = '<div class="search-content">' + "<span>" + search.term + "</span>" + "<span>" + (search.type == "barcode" ? "Barcode" : "Name") + "</span>" + "</div>" + '<span class="remove-search" onclick="removeRecentSearch(' + i + ')">×</span>';

    container.appendChild(div);
  }
}

// Function to get favorites
function getFavorites() {
  var favs = localStorage.getItem("favorites");
  return favs ? JSON.parse(favs) : [];
}

// Function to toggle favorite
function toggleFavorite(code) {
  var favorites = getFavorites();
  var index = favorites.indexOf(code);

  if (index == -1) {
    favorites.push(code);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  var favButton = document.getElementById("favoritesButton");
  if (favButton.classList.contains("active")) {
    showFavorites();
  }

  return index == -1;
}

// Function to check if product is favorite
function isFavorite(code) {
  var favorites = getFavorites();
  return favorites.indexOf(code) != -1;
}

// Function to check if product has gluten
function hasGluten(product) {
  if (!product.labels_tags || !product.allergens_tags) {
    return null; // unknown
  }

  // Check if labeled gluten-free
  for (var i = 0; i < product.labels_tags.length; i++) {
    if (product.labels_tags[i] == "en:gluten-free") {
      return false;
    }
  }

  // Check allergens
  var glutenThings = ["en:gluten", "en:wheat", "en:barley", "en:rye", "en:oats"];
  for (var i = 0; i < product.allergens_tags.length; i++) {
    for (var j = 0; j < glutenThings.length; j++) {
      if (product.allergens_tags[i] == glutenThings[j]) {
        return true;
      }
    }
  }

  return false;
}

// Function to show product in modal
function showProductInModal(product) {
  document.getElementById("modalProductName").innerText = product.product_name || "Unknown Product";
  document.getElementById("modalBrand").innerText = product.brands || "Not specified";
  document.getElementById("modalCategory").innerText = product.categories || "Not specified";

  // Show barcode with copy button
  var barcodeDiv = document.getElementById("modalBarcode");
  barcodeDiv.innerHTML = "";
  var barcode = product.code || "No barcode";

  var span = document.createElement("span");
  span.innerText = barcode;
  barcodeDiv.appendChild(span);

  if (barcode != "No barcode") {
    barcodeDiv.appendChild(makeCopyButton(barcode));
  }

  // Show gluten status
  var statusDiv = document.getElementById("modalGlutenStatus");
  var hasGlutenStatus = hasGluten(product);

  if (hasGlutenStatus === false) {
    statusDiv.innerHTML = '<span style="color: green">✓ Gluten Free</span>';
  } else if (hasGlutenStatus === null) {
    statusDiv.innerHTML = '<span style="color: orange">? Unknown</span>';
  } else {
    statusDiv.innerHTML = '<span style="color: red">⚠ Has Gluten</span>';
  }

  // Show allergens
  var allergens = [];
  if (product.allergens_tags) {
    for (var i = 0; i < product.allergens_tags.length; i++) {
      var allergen = product.allergens_tags[i].replace("en:", "").replace(/-/g, " ");
      allergen = allergen.charAt(0).toUpperCase() + allergen.slice(1);
      allergens.push(allergen);
    }
  }
  document.getElementById("modalAllergens").innerText = allergens.length > 0 ? allergens.join(", ") : "None listed";

  // Show image
  var imgContainer = document.getElementById("modalProductImage").parentElement;
  var imgUrl = product.image_url;
  if (!imgUrl && product.selected_images && product.selected_images.front && product.selected_images.front.display) {
    imgUrl = product.selected_images.front.display.url;
  }

  if (imgUrl) {
    imgContainer.innerHTML = '<img id="modalProductImage" src="' + imgUrl + '" alt="' + (product.product_name || "Product") + '">';
  } else {
    imgContainer.innerHTML = '<div class="no-image-placeholder">No image</div>';
  }

  showModal();
}

// Function to show search results
function showSearchResults(products) {
  var container = document.getElementById("searchResults");
  container.innerHTML = "";

  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    var div = document.createElement("div");
    div.className = "result-item";

    var hasGlutenStatus = hasGluten(product);
    if (hasGlutenStatus === false) {
      div.className += " gluten-free";
    } else if (hasGlutenStatus === null) {
      div.className += " gluten-unknown";
    }

    var name = product.product_name || "Unknown Product";
    var imgUrl = product.image_url;
    if (!imgUrl && product.selected_images && product.selected_images.front && product.selected_images.front.display) {
      imgUrl = product.selected_images.front.display.url;
    }
    var barcode = product.code || "No barcode";
    var isFav = isFavorite(barcode);

    var imgHtml = imgUrl ? '<img src="' + imgUrl + '" alt="' + name + '">' : '<div class="no-image-placeholder">No image</div>';

    div.innerHTML = imgHtml + '<button class="fav-button ' + (isFav ? "active" : "") + "\" onclick=\"event.stopPropagation(); this.classList.toggle('active'); toggleFavorite('" + barcode + "');\">" + "♥" + "</button>" + '<div class="product-info">' + '<span class="product-name">' + name + "</span>" + '<span class="barcode">' + barcode + (barcode != "No barcode" ? '<button class="copy-button" onclick="event.stopPropagation(); copyBarcode(\'' + barcode + "', this)\">📋</button>" : "") + "</span>" + "</div>";

    div.onclick = (function (product) {
      return function () {
        showProductInModal(product);
      };
    })(product);

    container.appendChild(div);
  }
}

// Function to search by barcode
function searchByBarcode() {
  var barcode = document.getElementById("searchInput").value;
  if (!barcode) {
    alert("Please enter a barcode number");
    return;
  }

  document.getElementById("searchResults").innerHTML = "";
  var oldInfo = document.getElementById("productInfo");
  if (oldInfo) oldInfo.remove();

  showLoading(true);

  fetch("https://world.openfoodfacts.org/api/v0/product/" + barcode + ".json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.status == 1) {
        addRecentSearch(barcode, "barcode");
        showProductInModal(data.product);
      } else {
        showError("Product not found");
      }
    })
    .catch(function (error) {
      console.log("Error:", error);
      showError("Could not get product information");
    })
    .finally(function () {
      showLoading(false);
    });
}

// Function to search by name
function searchByName() {
  var name = document.getElementById("searchInput").value;
  if (!name) {
    alert("Please enter a product name");
    return;
  }

  document.getElementById("searchResults").innerHTML = "";
  var oldInfo = document.getElementById("productInfo");
  if (oldInfo) oldInfo.remove();

  showLoading(true);

  var url = "https://world.openfoodfacts.org/cgi/search.pl?" + "search_terms=" + name + "&search_simple=1" + "&action=process" + "&json=1" + "&page_size=24";

  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.products && data.products.length > 0) {
        addRecentSearch(name, "name");
        showSearchResults(data.products);
      } else {
        showError("No products found");
      }
    })
    .catch(function (error) {
      console.log("Error:", error);
      showError("Could not get search results");
    })
    .finally(function () {
      showLoading(false);
    });
}

// Function to show favorites
function showFavorites() {
  var favorites = getFavorites();
  if (favorites.length == 0) {
    showError("No favorite products yet! Click the ♥ on products to add them to favorites.");
    return;
  }

  document.getElementById("searchResults").innerHTML = "";
  var oldInfo = document.getElementById("productInfo");
  if (oldInfo) oldInfo.remove();

  showLoading(true);

  var products = [];
  var loaded = 0;

  for (var i = 0; i < favorites.length; i++) {
    fetch("https://world.openfoodfacts.org/api/v0/product/" + favorites[i] + ".json")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.status == 1) {
          products.push(data.product);
        }
        loaded++;

        if (loaded == favorites.length) {
          if (products.length > 0) {
            showSearchResults(products);
          } else {
            showError("Could not load favorite products");
          }
          showLoading(false);
        }
      })
      .catch(function (error) {
        console.log("Error:", error);
        loaded++;

        if (loaded == favorites.length) {
          if (products.length > 0) {
            showSearchResults(products);
          } else {
            showError("Could not load favorite products");
          }
          showLoading(false);
        }
      });
  }
}

// Show recent searches when page loads
window.onload = function () {
  showRecentSearches();
};
