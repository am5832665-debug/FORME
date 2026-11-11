
const products = [
  {
    id: 1,
    name: "Essential Oversized Hoodie",
    category: "hoodie",
    price: 950,
    originalPrice: 1100,
    isSale: true,
    isBestSeller: true,
    isNew: false,
    badge: "BESTSELLER",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85",
    colors: [
      { name: "Black", hex: "#242424" },
      { name: "Cream", hex: "#e8dfce" },
      { name: "Olive", hex: "#676b48" }
    ],
    description: "An everyday oversized essential with a relaxed fit and a clean, minimal silhouette."
  },
  {
    id: 2,
    name: "Utility Jacket",
    category: "jacket",
    price: 1650,
    originalPrice: null,
    isSale: false,
    isBestSeller: false,
    isNew: true,
    badge: "NEW DROP",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=85",
    colors: [
      { name: "Black", hex: "#242424" },
      { name: "Brown", hex: "#74513a" },
      { name: "Olive", hex: "#676b48" }
    ],
    description: "A versatile outer layer designed for everyday city wear."
  },
  {
    id: 3,
    name: "Core Everyday Hoodie",
    category: "hoodie",
    price: 850,
    originalPrice: 950,
    isSale: true,
    isBestSeller: false,
    isNew: false,
    badge: "",
    image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=800&q=85",
    colors: [
      { name: "Grey", hex: "#a8a8a4" },
      { name: "Black", hex: "#242424" },
      { name: "Cream", hex: "#e8dfce" }
    ],
    description: "A simple everyday layer with a relaxed silhouette and understated styling."
  },
  {
    id: 4,
    name: "Urban Outerwear",
    category: "jacket",
    price: 1850,
    originalPrice: null,
    isSale: false,
    isBestSeller: false,
    isNew: true,
    badge: "",
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=85",
    colors: [
      { name: "Black", hex: "#242424" },
      { name: "Brown", hex: "#74513a" }
    ],
    description: "Contemporary outerwear with a clean shape made for everyday styling."
  }
];

const currency = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 0
});

const money = amount => `EGP ${currency.format(amount)}`;
const $ = selector => document.querySelector(selector);

const productsContainer = $("#products");
const itemCount = $("#item-count");
const cartCount = $("#cart-count");
const cartItems = $("#cart-items");
const cartTotal = $("#cart-total");
const drawerCount = $("#drawer-count");
const drawer = $("#cart-drawer");
const backdrop = $("#drawer-backdrop");
const dialog = $("#product-dialog");
const detailContainer = $("#product-detail");
const toast = $("#toast");

let activeFilter = "all";
let activeCollection = "all";
let selectedProduct = null;
let selectedSize = "M";
let selectedColor = "";
let toastTimer;

let cart = [];
let wishlist = [];

// Load and validate saved cart.
try {
  const savedCart = JSON.parse(localStorage.getItem("forme-cart") || "[]");

  if (Array.isArray(savedCart)) {
    cart = savedCart.filter(item => {
      const product = products.find(p => p.id === item.id);

      return product &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        ["S", "M", "L", "XL"].includes(item.size) &&
        product.colors.some(color => color.name === item.color);
    });
  }
} catch {
  cart = [];
}

// Load saved wishlist.
try {
  const savedWishlist = JSON.parse(
    localStorage.getItem("forme-wishlist") || "[]"
  );

  if (Array.isArray(savedWishlist)) {
    wishlist = [...new Set(
      savedWishlist.filter(id =>
        Number.isInteger(id) &&
        products.some(product => product.id === id)
      )
    )];
  }
} catch {
  wishlist = [];
}

function saveCart() {
  try {
    localStorage.setItem("forme-cart", JSON.stringify(cart));
  } catch {
    showToast("Cart will only be available during this session.");
  }
}

function saveWishlist() {
  try {
    localStorage.setItem("forme-wishlist", JSON.stringify(wishlist));
  } catch {
    showToast("Wishlist will only be available during this session.");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function updateWishlistCount() {
  $("#wishlist-count").textContent = wishlist.length;
}

function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(productId => productId !== id);
    showToast("Removed from wishlist");
  } else {
    wishlist.push(id);
    showToast("Added to wishlist");
  }

  saveWishlist();
  updateWishlistCount();
  renderProducts();
}

// Render products based on collection and category.
function renderProducts() {
  let visibleProducts = products.filter(product =>
    activeFilter === "all" ||
    product.category === activeFilter
  );

  if (activeCollection === "sale") {
    visibleProducts = visibleProducts.filter(product =>
      product.isSale &&
      Number(product.originalPrice) > product.price
    );
  } else if (activeCollection === "bestsellers") {
    visibleProducts = visibleProducts.filter(product =>
      product.isBestSeller
    );
  } else if (activeCollection === "new") {
    visibleProducts = visibleProducts.filter(product =>
      product.isNew
    );
  } else if (activeCollection === "wishlist") {
    visibleProducts = visibleProducts.filter(product =>
      wishlist.includes(product.id)
    );
  }

  itemCount.textContent =
    `${String(visibleProducts.length).padStart(2, "0")} PIECES`;

  if (visibleProducts.length === 0) {
    productsContainer.innerHTML = `
      <p class="empty-products">
        No products here yet. Explore the other collections.
      </p>
    `;

    updateWishlistCount();
    return;
  }

  productsContainer.innerHTML = visibleProducts.map((product, index) => {
    const isFavorite = wishlist.includes(product.id);
    const hasDiscount =
      product.isSale &&
      Number(product.originalPrice) > product.price;

    const discount = hasDiscount
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

    return `
      <article class="product" style="--card-index:${index}">
        <div
          class="product-image"
          data-details="${product.id}"
          role="button"
          tabindex="0"
          aria-label="View ${product.name}"
        >
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          >

          ${hasDiscount
            ? `<span class="product-label sale-label">${discount}% OFF</span>`
            : ""}

          ${product.badge
            ? `<span class="product-label secondary-label">${product.badge}</span>`
            : ""}

          <button
            class="wishlist-btn ${isFavorite ? "is-favorite" : ""}"
            data-wishlist="${product.id}"
            type="button"
            aria-label="${isFavorite ? "Remove from wishlist" : "Add to wishlist"}"
            aria-pressed="${isFavorite}"
          >${isFavorite ? "♥" : "♡"}</button>

          <button
            class="add-btn"
            data-add="${product.id}"
            type="button"
          >
            QUICK VIEW — ${money(product.price)}
          </button>
        </div>

        <div class="product-info">
          <h3>${product.name}</h3>

          <div class="product-prices">
            <p>${money(product.price)}</p>
            ${hasDiscount ? `<del>${money(product.originalPrice)}</del>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");

  updateWishlistCount();
}

// Category filters.
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    renderProducts();
  });
});

// Collection tabs.
document.querySelectorAll(".collection-btn").forEach(button => {
  button.addEventListener("click", () => {
    activeCollection = button.dataset.collection;

    document.querySelectorAll(".collection-btn").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    renderProducts();
  });
});

// Open product details with a subtle entrance effect.
function openProduct(id) {
  selectedProduct = products.find(product => product.id === id);

  if (!selectedProduct) return;

  selectedSize = "M";
  selectedColor = selectedProduct.colors[0].name;

  renderProductDetails();

  dialog.classList.remove("is-opening");
  dialog.showModal();

  void dialog.offsetWidth;
  dialog.classList.add("is-opening");
}

function renderProductDetails() {
  const product = selectedProduct;

  const hasDiscount =
    product.isSale &&
    Number(product.originalPrice) > product.price;

  detailContainer.innerHTML = `
    <div class="detail-layout">
      <div class="detail-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="detail-content">
        <p class="eyebrow">
          ${product.category === "hoodie" ? "HOODIES" : "JACKETS"}
        </p>

        <h2>${product.name}</h2>

        <div class="detail-prices">
          <p class="detail-price">${money(product.price)}</p>
          ${hasDiscount ? `<del>${money(product.originalPrice)}</del>` : ""}
        </div>

        <p class="detail-description">${product.description}</p>

        <div class="option-group">
          <p class="option-label">Select size</p>

          <div class="size-options">
            ${["S", "M", "L", "XL"].map(size => `
              <button
                class="size-option ${size === selectedSize ? "active" : ""}"
                type="button"
                data-size="${size}"
                aria-pressed="${size === selectedSize}"
              >${size}</button>
            `).join("")}
          </div>
        </div>

        <div class="option-group">
          <p class="option-label">
            Color: <span id="selected-color">${selectedColor}</span>
          </p>

          <div class="color-options">
            ${product.colors.map(color => `
              <button
                class="color-option ${color.name === selectedColor ? "active" : ""}"
                type="button"
                data-color="${color.name}"
                style="background-color: ${color.hex}"
                title="${color.name}"
                aria-label="${color.name}"
                aria-pressed="${color.name === selectedColor}"
              ></button>
            `).join("")}
          </div>
        </div>

        <button
          class="detail-wishlist ${wishlist.includes(product.id) ? "is-favorite" : ""}"
          id="detail-wishlist"
          type="button"
          aria-pressed="${wishlist.includes(product.id)}"
        >
          ${wishlist.includes(product.id) ? "♥ SAVED TO WISHLIST" : "♡ ADD TO WISHLIST"}
        </button>

        <p class="detail-error" id="detail-error" aria-live="polite"></p>

        <button class="button button-dark" id="add-detail" type="button">
          ADD TO BAG — ${money(product.price)}
        </button>
      </div>
    </div>
  `;
}

// Events for dynamically rendered product cards.
productsContainer.addEventListener("click", event => {
  const wishlistButton = event.target.closest("[data-wishlist]");

  if (wishlistButton) {
    event.stopPropagation();
    toggleWishlist(Number(wishlistButton.dataset.wishlist));
    return;
  }

  const addButton = event.target.closest("[data-add]");

  if (addButton) {
    event.stopPropagation();
    openProduct(Number(addButton.dataset.add));
    return;
  }

  const details = event.target.closest("[data-details]");

  if (details) {
    openProduct(Number(details.dataset.details));
  }
});

productsContainer.addEventListener("keydown", event => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches("[data-details]")
  ) {
    event.preventDefault();
    openProduct(Number(event.target.dataset.details));
  }
});

// Size, color, wishlist and add-to-cart controls in the product dialog.
detailContainer.addEventListener("click", event => {
  const sizeButton = event.target.closest("[data-size]");
  const colorButton = event.target.closest("[data-color]");

  if (sizeButton) {
    selectedSize = sizeButton.dataset.size;

    detailContainer.querySelectorAll("[data-size]").forEach(button => {
      const active = button === sizeButton;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  if (colorButton) {
    selectedColor = colorButton.dataset.color;

    detailContainer.querySelectorAll("[data-color]").forEach(button => {
      const active = button === colorButton;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    $("#selected-color").textContent = selectedColor;
  }

  if (event.target.closest("#detail-wishlist")) {
    toggleWishlist(selectedProduct.id);
    renderProductDetails();
    return;
  }

  if (event.target.closest("#add-detail")) {
    addToCart(selectedProduct.id, selectedSize, selectedColor);
    dialog.close();
    openCart();
  }
});

$("#close-product").addEventListener("click", () => {
  dialog.close();
});

// Shopping cart.
function addToCart(id, size, color) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existingItem = cart.find(item =>
    item.id === id &&
    item.size === size &&
    item.color === color
  );

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ id, size, color, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag`);

  const bagButton = $("#open-cart");
  bagButton.classList.remove("bag-pulse");
  void bagButton.offsetWidth;
  bagButton.classList.add("bag-pulse");
}

function updateQuantity(index, change) {
  const item = cart[index];
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function renderCart() {
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const totalPrice = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  cartCount.textContent = totalQuantity;
  drawerCount.textContent = `(${totalQuantity})`;
  cartTotal.textContent = money(totalPrice);

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        Your bag is empty.<br>
        Find something that feels like you.
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => {
    const product = products.find(p => p.id === item.id);

    return `
      <article class="cart-item">
        <img src="${product.image}" alt="${product.name}">

        <div>
          <h3>${product.name}</h3>
          <p>Size: ${item.size} · Color: ${item.color}</p>
          <strong>${money(product.price * item.quantity)}</strong>

          <div class="quantity-control">
            <button type="button" data-minus="${index}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-plus="${index}" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <button
          class="remove-item"
          type="button"
          data-remove="${index}"
        >Remove</button>
      </article>
    `;
  }).join("");
}

cartItems.addEventListener("click", event => {
  const minus = event.target.closest("[data-minus]");
  const plus = event.target.closest("[data-plus]");
  const remove = event.target.closest("[data-remove]");

  if (minus) updateQuantity(Number(minus.dataset.minus), -1);
  if (plus) updateQuantity(Number(plus.dataset.plus), 1);
  if (remove) removeItem(Number(remove.dataset.remove));
});

// Cart drawer controls.
function openCart() {
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("#close-cart").focus();
}

function closeCart() {
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  $("#open-cart").focus();
}

$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#continue-shopping").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && drawer.classList.contains("open")) {
    closeCart();
  }
});

// Demo checkout — no real order is submitted.
$("#checkout-button").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Your bag is empty.");
    return;
  }

  showToast("Checkout requires a connected backend.");
});

// Demo newsletter — no email is saved.
$("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();

  $("#newsletter-message").textContent =
    "Thanks for your interest! Newsletter signup is not connected yet.";

  event.target.reset();
});

// Initialize.
$("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
updateWishlistCount();
