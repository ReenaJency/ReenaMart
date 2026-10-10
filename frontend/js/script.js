
"use strict";

/* ==========================================
   REENAMART - MAIN JAVASCRIPT
   Backend: Spring Boot
   API: http://localhost:8080/api
========================================== */

const API_BASE_URL = "http://localhost:8080/api";

const STORAGE_KEYS = {
    user: "currentUser",
    token: "authToken",
    cart: "reenamartCart",
    likes: "reenamartLikes",
    products: "sellerProducts",
    orders: "reenamartOrders",
    recentlyViewed: "recentlyViewed"
};

/* ==========================================
   GENERAL HELPERS
========================================== */

function getElement(selector) {
    return document.querySelector(selector);
}

function getElements(selector) {
    return document.querySelectorAll(selector);
}

function getStoredJSON(key, fallback = []) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Storage read error:", key, error);
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(price) || 0);
}

function showMessage(message, type = "info") {
    let box = getElement("#messageBox");

    if (!box) {
        box = document.createElement("div");
        box.id = "messageBox";

        Object.assign(box.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "99999",
            padding: "12px 18px",
            borderRadius: "8px",
            maxWidth: "320px",
            color: "#ffffff",
            fontSize: "14px",
            boxShadow: "0 4px 15px rgba(0,0,0,.15)"
        });

        document.body.appendChild(box);
    }

    const colors = {
        success: "#1f7a45",
        error: "#c0392b",
        warning: "#b7791f",
        info: "#1f4d3a"
    };

    box.textContent = message;
    box.style.background = colors[type] || colors.info;
    box.style.display = "block";

    clearTimeout(box._hideTimer);

    box._hideTimer = setTimeout(() => {
        box.style.display = "none";
    }, 3500);
}

function getCurrentUser() {
    return getStoredJSON(STORAGE_KEYS.user, null);
}

function getUserRole() {
    const user = getCurrentUser();
    return String(user?.role || "").toUpperCase();
}

function isLoggedIn() {
    return Boolean(getCurrentUser());
}

function requireLogin() {
    if (!isLoggedIn()) {
        showMessage("Please login to continue.", "warning");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

/* ==========================================
   API CONNECTION
========================================== */

async function apiRequest(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = localStorage.getItem(STORAGE_KEYS.token);

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("Backend connection failed:", error);

        throw new Error(
            "Unable to connect to server. Please start Spring Boot backend."
        );
    }

    const contentType = response.headers.get("content-type") || "";

    let data = null;

    if (response.status !== 204) {
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.message || data.error || "Request failed."
                : data || "Request failed.";

        throw new Error(message);
    }

    return data;
}

/* ==========================================
   PRODUCT HELPERS
========================================== */

function getProductId(product) {
    return product?.id ?? product?.productId ?? product?.product_id;
}

function getProductPrice(product) {
    return Number(
        product?.finalPrice ??
        product?.sellingPrice ??
        product?.price ??
        0
    );
}

function getProductImage(product) {
    return product?.imageUrl ||
        product?.image ||
        "https://placehold.co/400x400?text=ReenaMart";
}

function getProductName(product) {
    return product?.name || product?.productName || "Product";
}

function isApproved(product) {
    return String(product?.approvalStatus || "APPROVED")
        .toUpperCase() === "APPROVED";
}

async function getProducts() {
    try {
        const result = await apiRequest("/products");

        const products = Array.isArray(result)
            ? result
            : result?.content || result?.products || [];

        return products.filter(isApproved);
    } catch (error) {
        console.error("Products API error:", error);

        /*
         * Use local fallback only when the API is unavailable.
         * A successful empty API response remains empty.
         */
        const localProducts = getStoredJSON(
            STORAGE_KEYS.products,
            []
        );

        return localProducts.filter(isApproved);
    }
}

/* ==========================================
   PRODUCT DISPLAY
========================================== */

function renderProducts(products, containerSelector = "#productList, #productGrid, #productContainer") {
    const container = getElement(containerSelector);

    if (!container) return;

    if (!products.length) {
        container.innerHTML = `
            <div class="empty-state box center">
                <h3>No Products Found</h3>
                <p>Products will appear here once available.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const id = getProductId(product);
        const safeId = escapeHTML(id);
        const name = escapeHTML(getProductName(product));
        const image = escapeHTML(getProductImage(product));
        const price = getProductPrice(product);
        const originalPrice = Number(
            product.sellerPrice ?? product.costPrice ?? price
        );

        const discount = Number(product.discount || 0);

        return `
            <article class="product-card">
                <img
                    src="${image}"
                    alt="${name}"
                    class="product-image"
                    loading="lazy"
                    style="cursor: pointer;"
                    onclick="openProduct('${safeId}')"
                    onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=Product';"
                >

                <div class="product-info">
                    <h3 style="cursor: pointer;" onclick="openProduct('${safeId}')">${name}</h3>

                    <p class="product-category">
                        ${escapeHTML(product.category || "General")}
                    </p>

                    <p class="product-price">
                        ${formatPrice(price)}
                    </p>

                    ${
                        discount > 0
                            ? `<p class="product-discount">${discount}% OFF</p>`
                            : ""
                    }

                    <div class="product-actions">
                        <button
                            type="button"
                            class="btn small btn-cart"
                            onclick="addToCart('${safeId}')">
                            🛒 Add to Cart
                        </button>

                        <button
                            type="button"
                            class="btn small orange btn-buy"
                            onclick="buyNow('${safeId}')">
                            ⚡ Buy Now
                        </button>

                        <button
                            type="button"
                            class="btn small outline btn-like"
                            onclick="toggleLike('${safeId}')"
                            title="Like product">
                            ${isLiked(id) ? "♥ Liked" : "♡ Like"}
                        </button>

                        <button
                            type="button"
                            class="btn small gray btn-share"
                            onclick="shareProduct('${safeId}')"
                            title="Share product">
                            ↗ Share
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function loadProducts() {
    const products = await getProducts();

    renderProducts(products);

    return products;
}

async function searchProducts(keyword) {
    const products = await getProducts();

    const searchInput = getElement("#searchInput, #search");
    const search = String(keyword !== undefined ? keyword : (searchInput?.value || "")).trim().toLowerCase();
    const categorySelect = getElement("#category, #categoryFilter");
    const selectedCategory = String(categorySelect?.value || "").trim().toLowerCase();

    const filtered = products.filter(product => {
        const name = getProductName(product).toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const description = String(
            product.description || ""
        ).toLowerCase();

        const matchesSearch = !search || (
            name.includes(search) ||
            category.includes(search) ||
            description.includes(search)
        );

        const matchesCategory = !selectedCategory || (category === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

function setupProductSearch() {
    const searchInput = getElement("#searchInput, #search");
    const categorySelect = getElement("#category, #categoryFilter");

    if (searchInput) {
        searchInput.addEventListener("input", event => {
            searchProducts(event.target.value);
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", () => {
            searchProducts(searchInput?.value || "");
        });
    }
}

/* ==========================================
   SHOPPING CART & BUY NOW
========================================== */

function getCart() {
    return getStoredJSON(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
    saveJSON(STORAGE_KEYS.cart, cart);
    updateCartCount();
}

async function addToCart(productId, quantity = 1, size = null) {
    try {
        const products = await getProducts();

        const product = products.find(item =>
            String(getProductId(item)) === String(productId)
        );

        if (!product) {
            showMessage("Product not found or not approved.", "error");
            return false;
        }

        const cart = getCart();
        const isFashion = String(product.category || "").toLowerCase().includes("fashion");
        const defaultSize = product.sizes ? product.sizes.split(",")[0].trim() : (isFashion ? "M" : null);
        const itemSize = size || defaultSize;

        const existing = cart.find(item =>
            String(item.productId) === String(productId) && item.size === itemSize
        );

        if (existing) {
            existing.quantity += Number(quantity) || 1;
        } else {
            cart.push({
                productId: getProductId(product),
                name: getProductName(product),
                price: getProductPrice(product),
                imageUrl: getProductImage(product),
                category: product.category,
                size: itemSize,
                quantity: Number(quantity) || 1
            });
        }

        saveCart(cart);

        showMessage(`${getProductName(product)} added to cart! 🛒`, "success");
        return true;
    } catch (error) {
        showMessage(error.message, "error");
        return false;
    }
}

async function buyNow(productId, size = null, quantity = 1) {
    try {
        const products = await getProducts();

        const product = products.find(item =>
            String(getProductId(item)) === String(productId)
        );

        if (!product) {
            showMessage("Product not found.", "error");
            return;
        }

        const isFashion = String(product.category || "").toLowerCase().includes("fashion");
        const defaultSize = product.sizes ? product.sizes.split(",")[0].trim() : (isFashion ? "M" : null);
        const itemSize = size || defaultSize;

        const buyNowItem = {
            productId: getProductId(product),
            name: getProductName(product),
            price: getProductPrice(product),
            imageUrl: getProductImage(product),
            category: product.category,
            size: itemSize,
            quantity: Number(quantity) || 1
        };

        sessionStorage.setItem("directCheckout", JSON.stringify([buyNowItem]));
        localStorage.setItem("directCheckout", JSON.stringify([buyNowItem]));

        window.location.href = `checkout.html?mode=buyNow&productId=${encodeURIComponent(productId)}`;
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function removeFromCart(productId) {
    const cart = getCart().filter(item =>
        String(item.productId) !== String(productId)
    );

    saveCart(cart);
    renderCart();
}

function updateCartQuantity(productId, quantity) {
    const cart = getCart();

    const item = cart.find(product =>
        String(product.productId) === String(productId)
    );

    if (!item) return;

    const newQuantity = Math.floor(Number(quantity));

    if (!Number.isFinite(newQuantity) || newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    item.quantity = newQuantity;

    saveCart(cart);
    renderCart();
}

function getCartTotal() {
    return getCart().reduce((total, item) => {
        return total +
            (Number(item.price) || 0) *
            (Number(item.quantity) || 0);
    }, 0);
}

function updateCartCount() {
    const count = getCart().reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    getElements("#cartCount, .cart-count").forEach(element => {
        element.textContent = count;
    });
}

function renderCart() {
    const container = getElement("#cartItems, #cartRows");

    if (!container) return;

    const cart = getCart();

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-cart box center">
                <h3>Your cart is empty</h3>
                <p>Add products to continue shopping.</p>
                <br>
                <a href="products.html" class="btn">Continue Shopping</a>
            </div>
        `;

        updateCartSummary();
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item cart-row">
            <img
                src="${escapeHTML(item.imageUrl || "")}"
                alt="${escapeHTML(item.name)}"
                width="90"
                loading="lazy"
            >

            <div class="cart-item-details cart-info">
                <h3>${escapeHTML(item.name)}</h3>

                <p>${formatPrice(item.price)}</p>

                <div class="qty">
                    <label>
                        Qty:
                        <input
                            type="number"
                            min="1"
                            value="${Math.max(1, Number(item.quantity) || 1)}"
                            onchange="updateCartQuantity('${escapeHTML(item.productId)}', this.value)"
                        >
                    </label>
                </div>

                <br>
                <button
                    type="button"
                    class="btn red"
                    onclick="removeFromCart('${escapeHTML(item.productId)}')">
                    Remove
                </button>
            </div>
        </div>
    `).join("");

    updateCartSummary();
}

function updateCartSummary() {
    const total = getCartTotal();

    const summaryContainer = getElement("#cartSummary");
    if (summaryContainer && !getElement("#cartTotal")) {
        summaryContainer.innerHTML = `
            <div class="summary box">
                <h2>Cart Summary</h2>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery</span>
                    <span>Free</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <br>
                <a href="checkout.html" class="btn full">Proceed to Checkout</a>
            </div>
        `;
    }

    const totalElement = getElement("#cartTotal");
    const subtotalElement = getElement("#cartSubtotal");

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(total);
    }

    updateCartCount();
}

/* ==========================================
   LIKES
========================================== */

function getLikes() {
    return getStoredJSON(STORAGE_KEYS.likes, []);
}

function isLiked(productId) {
    return getLikes().some(id =>
        String(id) === String(productId)
    );
}

function toggleLike(productId) {
    if (!requireLogin()) return;

    let likes = getLikes();

    if (isLiked(productId)) {
        likes = likes.filter(id =>
            String(id) !== String(productId)
        );

        showMessage("Product removed from likes.");
    } else {
        likes.push(productId);

        showMessage("Product added to likes.", "success");
    }

    saveJSON(STORAGE_KEYS.likes, likes);

    loadProducts();
    renderLikedProducts();
}

async function renderLikedProducts() {
    const container = getElement("#likedProducts");

    if (!container) return;

    const likes = getLikes();
    const products = await getProducts();

    const likedProducts = products.filter(product =>
        likes.some(id =>
            String(id) === String(getProductId(product))
        )
    );

    renderProducts(likedProducts, "#likedProducts");
}

/* ==========================================
   SHARE PRODUCT
========================================== */

async function shareProduct(productId) {
    const shareUrl = new URL(
        "product-details.html",
        window.location.href
    );

    shareUrl.searchParams.set("id", productId);

    const shareData = {
        title: "ReenaMart Product",
        text: "Check out this product on ReenaMart!",
        url: shareUrl.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl.href);
            showMessage("Product link copied.", "success");
        } else {
            window.prompt("Copy this product link:", shareUrl.href);
        }
    } catch (error) {
        if (error.name !== "AbortError") {
            showMessage("Unable to share product.", "error");
        }
    }
}

/* ==========================================
   PRODUCT DETAILS
========================================== */

async function loadProductDetails() {
    const container = getElement("#productDetails, #details");

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        container.innerHTML = `<div class="box center"><p>Product ID is missing.</p><br><a href="products.html" class="btn">Back to Products</a></div>`;
        return;
    }

    try {
        const products = await getProducts();

        const product = products.find(item =>
            String(getProductId(item)) === String(productId)
        );

        if (!product) {
            container.innerHTML = `<div class="box center"><p>Product not found.</p><br><a href="products.html" class="btn">Back to Products</a></div>`;
            return;
        }

        const safeId = escapeHTML(getProductId(product));
        const name = escapeHTML(getProductName(product));
        const image = escapeHTML(getProductImage(product));
        const price = getProductPrice(product);
        const discount = Number(product.discount || 0);
        const originalPrice = Number(product.sellingPrice || product.sellerPrice || price);
        const category = escapeHTML(product.category || "General");
        const isFashion = String(product.category || "").toLowerCase().includes("fashion");
        
        const availableSizes = product.sizes ? product.sizes.split(",").map(s => s.trim()).filter(Boolean) : ["S", "M", "L", "XL"];

        container.innerHTML = `
            <div class="product-detail">
                <img
                    src="${image}"
                    alt="${name}"
                    class="product-detail-image"
                    onerror="this.onerror=null;this.src='https://placehold.co/500x500?text=Product';"
                >

                <div class="product-detail-content">
                    <h1>${name}</h1>
                    <p class="category" style="margin-bottom: 12px; font-size: 14px;">Category: <strong>${category}</strong></p>

                    <div class="price-box" style="margin: 15px 0;">
                        <span class="price-final" style="font-size: 30px; color: var(--green); font-weight: 800;">${formatPrice(price)}</span>
                        ${discount > 0 ? `<span class="price-old" style="text-decoration: line-through; color: #888; font-size: 18px; margin-left: 10px;">${formatPrice(originalPrice)}</span> <span class="discount" style="color: #e67e22; font-weight: 700; margin-left: 8px;">${discount}% OFF</span>` : ""}
                    </div>

                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        ${escapeHTML(product.description || "High quality product available at ReenaMart.")}
                    </p>

                    ${isFashion ? `
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 700; margin-bottom: 8px;">Select Size:</label>
                            <div id="sizeSelector" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                ${availableSizes.map((sz, idx) => `
                                    <button type="button" class="size-btn ${idx === 0 ? 'active' : ''}" onclick="selectProductSize('${escapeHTML(sz)}', this)" style="padding: 8px 16px; border: 2px solid ${idx === 0 ? 'var(--green)' : '#ccc'}; background: ${idx === 0 ? 'var(--green)' : '#fff'}; color: ${idx === 0 ? '#fff' : '#333'}; border-radius: 6px; font-weight: 700; cursor: pointer;">
                                        ${escapeHTML(sz)}
                                    </button>
                                `).join("")}
                            </div>
                            <input type="hidden" id="selectedSizeInput" value="${escapeHTML(availableSizes[0] || 'M')}">
                        </div>
                    ` : ""}

                    <div style="margin-bottom: 22px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <label style="font-weight: 700;">Quantity:</label>
                        <div style="display: flex; align-items: center; border: 1px solid #ccc; border-radius: 6px; overflow: hidden; background: #fff;">
                            <button type="button" onclick="adjustDetailQty(-1)" style="padding: 8px 14px; background: #f0f0f0; font-weight: bold; cursor: pointer; border: none;">-</button>
                            <input type="number" id="detailQty" value="1" min="1" max="${Math.max(1, product.stock || 50)}" style="width: 50px; text-align: center; border: none; font-weight: bold;" readonly>
                            <button type="button" onclick="adjustDetailQty(1)" style="padding: 8px 14px; background: #f0f0f0; font-weight: bold; cursor: pointer; border: none;">+</button>
                        </div>
                        <span style="font-size: 13px; color: ${product.stock > 0 ? '#27ae60' : '#c0392b'}; font-weight: 600;">
                            ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : 'Out of Stock'}
                        </span>
                    </div>

                    <div class="product-actions" style="margin-top: 25px; display: flex; gap: 12px; flex-wrap: wrap;">
                        <button
                            type="button"
                            class="btn btn-cart"
                            style="padding: 12px 22px; font-size: 15px;"
                            onclick="handleDetailAddToCart('${safeId}')">
                            🛒 Add to Cart
                        </button>

                        <button
                            type="button"
                            class="btn orange btn-buy"
                            style="padding: 12px 26px; font-size: 15px;"
                            onclick="handleDetailBuyNow('${safeId}')">
                            ⚡ Buy Now
                        </button>

                        <button
                            type="button"
                            class="btn outline btn-like"
                            style="padding: 12px 16px;"
                            onclick="toggleLike('${safeId}')">
                            ${isLiked(productId) ? "♥ Liked" : "♡ Like"}
                        </button>

                        <button
                            type="button"
                            class="btn gray btn-share"
                            style="padding: 12px 16px;"
                            onclick="shareProduct('${safeId}')">
                            ↗ Share
                        </button>
                    </div>
                </div>
            </div>
        `;

        const recent = getStoredJSON(
            STORAGE_KEYS.recentlyViewed,
            []
        );

        const updated = [
            productId,
            ...recent.filter(id => String(id) !== String(productId))
        ].slice(0, 10);

        saveJSON(STORAGE_KEYS.recentlyViewed, updated);
    } catch (error) {
        container.textContent = error.message;
    }
}

function selectProductSize(size, btn) {
    const hidden = getElement("#selectedSizeInput");
    if (hidden) hidden.value = size;
    document.querySelectorAll(".size-btn").forEach(b => {
        b.style.borderColor = "#ccc";
        b.style.background = "#fff";
        b.style.color = "#333";
    });
    btn.style.borderColor = "var(--green)";
    btn.style.background = "var(--green)";
    btn.style.color = "#fff";
}

function adjustDetailQty(delta) {
    const input = getElement("#detailQty");
    if (!input) return;
    let val = Math.max(1, (Number(input.value) || 1) + delta);
    input.value = val;
}

function handleDetailAddToCart(productId) {
    const size = getElement("#selectedSizeInput")?.value || null;
    const qty = Number(getElement("#detailQty")?.value) || 1;
    addToCart(productId, qty, size);
}

function handleDetailBuyNow(productId) {
    const size = getElement("#selectedSizeInput")?.value || null;
    const qty = Number(getElement("#detailQty")?.value) || 1;
    buyNow(productId, size, qty);
}

/* ==========================================
   REGISTRATION
========================================== */

async function registerUser(event) {
    event?.preventDefault();

    const form = event?.currentTarget ||
        getElement("#registerForm");

    if (!form) return;

    const formData = new FormData(form);

    const user = {
        name: formData.get("name") ||
            formData.get("username") || "",
        email: formData.get("email") || "",
        password: formData.get("password") || "",
        mobile: formData.get("mobile") || "",
        role: String(
            formData.get("role") || "BUYER"
        ).toUpperCase()
    };

    if (!user.name.trim() || !user.email.trim() || !user.password) {
        showMessage("Please fill all required fields.", "warning");
        return;
    }

    if (!["BUYER", "SELLER"].includes(user.role)) {
        showMessage("Invalid registration role.", "error");
        return;
    }

    try {
        const result = await apiRequest("/users", {
            method: "POST",
            body: JSON.stringify(user)
        });

        showMessage(
            "Registration successful. Please login.",
            "success"
        );

        window.location.href = "login.html";
    } catch (error) {
        showMessage(error.message, "error");
    }
}

/* ==========================================
   LOGIN
========================================== */

async function loginUser(event) {
    event?.preventDefault();

    const form = event?.currentTarget ||
        getElement("#loginForm");

    if (!form) return;

    const formData = new FormData(form);

    const email = String(
        formData.get("email") || ""
    ).trim();

    const password = String(
        formData.get("password") || ""
    );

    if (!email || !password) {
        showMessage("Enter email and password.", "warning");
        return;
    }

    /*
     * This endpoint must exist in your backend.
     * The existing UserController may use a different route.
     */
    try {
        const result = await apiRequest("/users/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (!result || !result.role) {
            showMessage(
                "Login response is missing the user role.",
                "error"
            );
            return;
        }

        const user = {
            id: result.id ?? result.userId,
            name: result.name || result.username || "",
            email: result.email || email,
            role: String(result.role).toUpperCase()
        };

        saveJSON(STORAGE_KEYS.user, user);

        if (result.token) {
            localStorage.setItem(
                STORAGE_KEYS.token,
                result.token
            );
        }

        showMessage("Login successful.", "success");

        redirectByRole(user.role);
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function redirectByRole(role) {
    switch (String(role).toUpperCase()) {
        case "BUYER":
            window.location.href = "products.html";
            break;

        case "SELLER":
            window.location.href = "seller.html";
            break;

        case "ADMIN":
            window.location.href = "admin.html";
            break;

        default:
            showMessage("Unknown user role.", "error");
    }
}

/* ==========================================
   LOGOUT
========================================== */

function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);

    showMessage("Logged out successfully.", "success");

    window.location.href = "index.html";
}

/* ==========================================
   SELLER PRODUCT MANAGEMENT
========================================== */

async function addSellerProduct(event) {
    event?.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser || String(currentUser.role).toUpperCase() !== "SELLER") {
        showMessage("Please login as seller to add products.", "warning");
        setTimeout(() => { window.location.href = "seller-login.html"; }, 800);
        return;
    }

    const form = event?.currentTarget || getElement("#sellerProductForm");
    if (!form) return;

    const name = String(getElement("#productName")?.value || "").trim();
    const description = String(getElement("#description")?.value || "").trim();
    const sellerPrice = Number(getElement("#sellerPrice")?.value || 0);
    const category = String(getElement("#category")?.value || "Fashion").trim();
    const imageUrl = String(getElement("#imageUrl")?.value || "").trim();
    const sizes = String(getElement("#sizes")?.value || "S,M,L,XL,XXL").trim();
    const shopName = String(getElement("#shopName")?.value || "").trim();
    const stock = Number(getElement("#stock")?.value || 10);

    if (!name || !category) {
        showMessage("Please enter product name and category.", "warning");
        getElement("#productName")?.focus();
        return;
    }

    if (sellerPrice <= 0) {
        showMessage("Please enter a valid Seller Price (greater than 0).", "warning");
        getElement("#sellerPrice")?.focus();
        return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting for Approval...";
    }

    const productPayload = {
        name,
        description: description || `${name} by ${shopName || currentUser.shopName || 'Seller'}`,
        category,
        sellerPrice: Math.round(sellerPrice * 100) / 100,
        sellingPrice: 0,
        discount: 0,
        discountAmount: 0,
        finalPrice: 0,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        sizes: sizes || "S,M,L,XL,XXL",
        shopName: shopName || currentUser.shopName || "Seller Store",
        stock: stock > 0 ? stock : 10,
        sellerEmail: currentUser.email || "seller@gmail.com",
        sellerName: currentUser.name || currentUser.username || "Seller",
        approvalStatus: "PENDING"
    };

    try {
        const result = await apiRequest("/products", {
            method: "POST",
            body: JSON.stringify(productPayload)
        });

        // Add admin notification
        try {
            const notifications = getStoredJSON("adminNotifications", []);
            notifications.unshift({
                id: Date.now(),
                productId: result.id,
                productName: result.name,
                sellerEmail: result.sellerEmail,
                sellerPrice: result.sellerPrice,
                category: result.category,
                time: new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }),
                status: "UNREAD"
            });
            saveJSON("adminNotifications", notifications.slice(0, 30));
        } catch (e) {
            console.warn("Notification store error:", e);
        }

        showMessage("Product submitted! Admin notification sent for approval. ⏳", "success");
        form.reset();
        await loadSellerProducts();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

async function loadSellerProducts() {
    const container = getElement("#sellerProducts");
    if (!container) return;

    const user = getCurrentUser();
    if (!user || String(user.role).toUpperCase() !== "SELLER") {
        container.innerHTML = `
            <div class="box center">
                <p>Please login as a seller to view your products.</p>
                <br>
                <a href="seller-login.html" class="btn">Seller Login</a>
            </div>
        `;
        return;
    }

    try {
        const result = await apiRequest("/products");
        const allProducts = Array.isArray(result) ? result : result?.content || [];

        const ownProducts = allProducts.filter(p =>
            String(p.sellerEmail || "").toLowerCase() === String(user.email || "").toLowerCase()
        );

        if (!ownProducts.length) {
            container.innerHTML = `
                <div class="box center" style="padding: 30px 10px;">
                    <p style="color: #666; font-size: 15px;">You have not added any products yet.</p>
                    <p style="color: #888; font-size: 13px;">Fill the form above or click "⚡ Fill Sample Product" to submit a product for Admin approval.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ownProducts.map(product => {
            const status = String(product.approvalStatus || "PENDING").toUpperCase();
            let badgeClass = "badge-pending";
            let statusText = "⏳ PENDING (Awaiting Admin Approval)";

            if (status === "APPROVED") {
                badgeClass = "badge-approved";
                statusText = "✅ APPROVED (Live on ReenaMart)";
            } else if (status === "REJECTED") {
                badgeClass = "badge-rejected";
                statusText = "❌ REJECTED by Admin";
            }

            return `
                <div class="seller-product-row">
                    <div style="display: flex; gap: 14px; align-items: center;">
                        <img
                            src="${escapeHTML(product.imageUrl || '')}"
                            alt="${escapeHTML(product.name)}"
                            style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #eee;"
                            onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=Product';"
                        />
                        <div>
                            <h3 style="margin: 0 0 4px 0; font-size: 15px; color: var(--green, #1f4d3a);">
                                ${escapeHTML(product.name)}
                            </h3>
                            <div style="font-size: 13px; color: #666;">
                                Category: <strong>${escapeHTML(product.category || 'General')}</strong> • Stock: <strong>${product.stock || 0}</strong>
                            </div>
                            <div style="font-size: 13px; color: #444; margin-top: 2px;">
                                Your Seller Price: <strong style="color: var(--green, #1f4d3a);">${formatPrice(product.sellerPrice || 0)}</strong>
                                ${product.sellingPrice > 0 ? ` • Live Store Price: <strong>${formatPrice(product.finalPrice || product.sellingPrice)}</strong>` : ''}
                            </div>
                        </div>
                    </div>
                    <div>
                        <span class="${badgeClass}">${statusText}</span>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

/* ==========================================
   CHECKOUT AND ORDERS
========================================== */

function getCheckoutItems() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "buyNow") {
        const direct = getStoredJSON("directCheckout", null) ||
                       JSON.parse(sessionStorage.getItem("directCheckout") || "null");
        if (direct && Array.isArray(direct) && direct.length) {
            return direct;
        }
    }
    return getCart();
}

function initCheckout() {
    const items = getCheckoutItems();
    const container = getElement("#checkoutItems");
    const subtotalEl = getElement("#checkoutSubtotal");
    const totalEl = getElement("#checkoutTotal");
    const editCartLink = getElement("#editCartLink");

    const params = new URLSearchParams(window.location.search);
    const isBuyNow = params.get("mode") === "buyNow";
    if (isBuyNow && editCartLink) {
        editCartLink.style.display = "none";
    }

    if (!items || !items.length) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 20px 0;">
                    <p>No products selected for checkout.</p>
                    <br>
                    <a href="products.html" class="btn small">Browse Products</a>
                </div>
            `;
        }
        if (subtotalEl) subtotalEl.textContent = formatPrice(0);
        if (totalEl) totalEl.textContent = formatPrice(0);
        return;
    }

    let subtotal = 0;
    if (container) {
        container.innerHTML = items.map(item => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            subtotal += itemTotal;

            return `
                <div class="checkout-item" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border, #eee);">
                    <img
                        src="${escapeHTML(item.imageUrl || '')}"
                        alt="${escapeHTML(item.name)}"
                        style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; background: #f0f0f0;"
                        onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=Product';"
                    >
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="margin: 0 0 4px 0; font-size: 14px; color: var(--green); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHTML(item.name)}
                        </h4>
                        <div style="font-size: 12px; color: #666;">
                            ${item.size ? `<span style="background: #e8ecea; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">Size: ${escapeHTML(item.size)}</span>` : ''}
                            Qty: <strong>${itemQty}</strong>
                        </div>
                        <div style="font-weight: 700; color: var(--green); font-size: 14px; margin-top: 4px;">
                            ${formatPrice(itemTotal)}
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } else {
        subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(subtotal);

    // Auto-fill logged in user info
    const currentUser = getCurrentUser();
    if (currentUser) {
        const nameInput = getElement("#customerName");
        const emailInput = getElement("#email");
        if (nameInput && !nameInput.value && (currentUser.name || currentUser.username)) {
            nameInput.value = currentUser.name || currentUser.username;
        }
        if (emailInput && !emailInput.value && currentUser.email) {
            emailInput.value = currentUser.email;
        }
    }
}

async function checkout(event) {
    event?.preventDefault();

    const form = event?.currentTarget || getElement("#checkoutForm");
    if (!form) return;

    const items = getCheckoutItems();
    if (!items || !items.length) {
        showMessage("Your cart / checkout items are empty.", "warning");
        return;
    }

    const formData = new FormData(form);
    const customerName = String(formData.get("customerName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const mobile = String(formData.get("mobile") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const city = String(formData.get("city") || "Chennai").trim();
    const state = String(formData.get("state") || "Tamil Nadu").trim();
    const pincode = String(formData.get("pincode") || "600001").trim();
    const paymentMethod = String(formData.get("paymentMethod") || "COD").trim();

    if (!customerName) {
        showMessage("Please enter your name.", "warning");
        getElement("#customerName")?.focus();
        return;
    }

    if (!email || !email.includes("@")) {
        showMessage("Please enter a valid email address.", "warning");
        getElement("#email")?.focus();
        return;
    }

    if (!mobile || mobile.length < 10) {
        showMessage("Please enter a valid 10-digit mobile number.", "warning");
        getElement("#mobile")?.focus();
        return;
    }

    if (!address) {
        showMessage("Please enter your delivery address.", "warning");
        getElement("#address")?.focus();
        return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Placing Order...";
    }

    const orderProducts = items.map(item => {
        const isFashion = item.category && String(item.category).toLowerCase().includes("fashion");
        return {
            productId: Number(item.productId),
            quantity: Number(item.quantity) || 1,
            size: item.size || (isFashion ? "M" : null)
        };
    });

    const orderPayload = {
        customerName,
        email,
        mobile,
        address,
        city,
        state,
        pincode,
        paymentMethod,
        products: orderProducts
    };

    try {
        const result = await apiRequest("/orders", {
            method: "POST",
            body: JSON.stringify(orderPayload)
        });

        // Save order receipt for order-success.html
        saveJSON("lastOrder", result);

        const params = new URLSearchParams(window.location.search);
        if (params.get("mode") === "buyNow") {
            sessionStorage.removeItem("directCheckout");
            localStorage.removeItem("directCheckout");
        } else {
            saveCart([]);
        }

        showMessage("Order placed successfully! 🎉", "success");
        window.location.href = "order-success.html";
    } catch (error) {
        showMessage(error.message, "error");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

async function loadOrders() {
    const container = getElement("#orderList, #orders");

    if (!container) return;

    const user = getCurrentUser();
    const lastOrder = getStoredJSON("lastOrder", null);

    try {
        const result = await apiRequest("/orders");
        const orders = Array.isArray(result) ? result : result?.content || [];

        let displayOrders = [];
        if (user && user.email) {
            displayOrders = orders.filter(o =>
                String(o.email || o.buyerEmail || "").toLowerCase() === String(user.email).toLowerCase()
            );
        } else if (lastOrder && lastOrder.email) {
            displayOrders = orders.filter(o =>
                String(o.email || "").toLowerCase() === String(lastOrder.email).toLowerCase()
            );
        } else {
            displayOrders = orders;
        }

        if (!displayOrders.length) {
            container.innerHTML = `
                <div class="empty-state box center">
                    <h3>No Orders Placed Yet</h3>
                    <p>Start shopping to view your orders here.</p>
                    <br>
                    <a href="products.html" class="btn">Explore Products</a>
                </div>
            `;
            return;
        }

        container.innerHTML = displayOrders.map(order => `
            <article class="order-box" style="margin-bottom: 20px; border-left: 4px solid var(--green);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <h3 style="margin: 0; color: var(--green);">Order #${escapeHTML(order.orderId || order.id)}</h3>
                        <small style="color: #666;">Placed on: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</small>
                    </div>
                    <div>
                        <span class="status ${escapeHTML(order.status || 'PLACED')}">${escapeHTML(order.status || 'PLACED')}</span>
                    </div>
                </div>

                <div style="background: #fcfcfc; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <p><strong>Customer:</strong> ${escapeHTML(order.customerName || '')} (${escapeHTML(order.mobile || '')})</p>
                    <p><strong>Address:</strong> ${escapeHTML(order.address || '')}, ${escapeHTML(order.city || '')}, ${escapeHTML(order.state || '')} - ${escapeHTML(order.pincode || '')}</p>
                    <p><strong>Payment:</strong> ${escapeHTML(order.paymentMethod || 'COD')}</p>
                </div>

                ${Array.isArray(order.products) && order.products.length ? `
                    <div style="margin: 12px 0;">
                        <strong>Items:</strong>
                        <ul style="margin: 6px 0 0 20px; padding: 0;">
                            ${order.products.map(p => `
                                <li>${escapeHTML(p.productName || 'Product')} ${p.size ? `(Size: ${escapeHTML(p.size)})` : ''} × ${p.quantity} - <strong>${formatPrice((p.price || 0) * (p.quantity || 1))}</strong></li>
                            `).join("")}
                        </ul>
                    </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px;">
                    <span style="font-weight: 700; font-size: 16px;">Total Amount:</span>
                    <strong style="color: var(--green); font-size: 18px;">${formatPrice(order.total || order.totalAmount || 0)}</strong>
                </div>

                <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 10px;">
                    <a href="tracking.html?id=${encodeURIComponent(order.orderId || order.id)}" class="btn small" style="background: var(--green, #1f4d3a); color: #fff; text-decoration: none;">
                        🚚 Track Order
                    </a>
                </div>
            </article>
        `).join("");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

/* ==========================================
   ADMIN PRODUCT APPROVAL
========================================== */

async function loadAdminProducts() {
    const container = getElement("#productsTable, #adminProducts");
    const sellersTable = getElement("#sellersTable");
    const ordersTable = getElement("#ordersTable");
    const customersTable = getElement("#customersTable");

    if (!container && !ordersTable && !sellersTable) return;

    const adminUser = getCurrentUser();
    const adminBadge = getElement("#adminUserBadge");
    if (adminBadge && adminUser && adminUser.email) {
        adminBadge.textContent = adminUser.email;
    }

    // 1. Fetch & display products
    try {
        const result = await apiRequest("/products");
        const products = Array.isArray(result)
            ? result
            : result?.content || [];

        const pendingCount = products.filter(p => String(p.approvalStatus || "").toUpperCase() === "PENDING").length;

        const totalProductsEl = getElement("#totalProducts");
        if (totalProductsEl) totalProductsEl.textContent = products.length;

        // Update notifications banner if present
        const notifBox = getElement("#adminNotificationBox");
        const notifCountEl = getElement("#pendingNotificationCount");
        const notifListEl = getElement("#adminNotificationList");

        if (notifBox) {
            if (pendingCount > 0) {
                notifBox.style.display = "block";
                if (notifCountEl) notifCountEl.textContent = pendingCount;
                if (notifListEl) {
                    const pendingProducts = products.filter(p => String(p.approvalStatus || "").toUpperCase() === "PENDING");
                    notifListEl.innerHTML = pendingProducts.map(p => `
                        <div class="admin-notification-item">
                            <div>
                                <strong>🔔 New Product: "${escapeHTML(p.name)}"</strong>
                                <br><small style="color:#666;">Seller: ${escapeHTML(p.sellerEmail || "N/A")} • Seller Price: ${formatPrice(p.sellerPrice || 0)} • Category: ${escapeHTML(p.category || 'General')}</small>
                            </div>
                            <button type="button" class="btn small" style="background:#27ae60; color:#fff;" onclick="approveProductWithPrice('${p.id}')">
                                Quick Approve
                            </button>
                        </div>
                    `).join("");
                }
            } else {
                notifBox.style.display = "none";
            }
        }

        if (container && container.tagName === "TBODY") {
            container.innerHTML = products.map(product => {
                const status = String(product.approvalStatus || "PENDING").toUpperCase();
                const isPending = status === "PENDING";
                const suggestedSellingPrice = product.sellingPrice > 0 ? product.sellingPrice : Math.round((product.sellerPrice || 400) * 1.25);
                const suggestedDiscount = product.discount || 10;

                return `
                    <tr style="${isPending ? 'background: #fffdf5;' : ''}">
                        <td><strong>${escapeHTML(product.id)}</strong></td>
                        <td>
                            <strong>${escapeHTML(product.name)}</strong>
                            <br><small style="color:#777;">${escapeHTML(product.category || 'General')}</small>
                        </td>
                        <td>${escapeHTML(product.sellerEmail || 'N/A')}</td>
                        <td><strong style="color:#d35400;">${formatPrice(product.sellerPrice || 0)}</strong></td>
                        <td>
                            ${isPending ? `
                                <input
                                    type="number"
                                    id="sellingPrice_${product.id}"
                                    value="${suggestedSellingPrice}"
                                    min="1"
                                    style="width: 80px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; font-weight: bold;"
                                />
                            ` : `
                                <strong>${formatPrice(product.sellingPrice || 0)}</strong>
                            `}
                        </td>
                        <td>
                            ${isPending ? `
                                <input
                                    type="number"
                                    id="discount_${product.id}"
                                    value="${suggestedDiscount}"
                                    min="0"
                                    max="100"
                                    style="width: 55px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px;"
                                />%
                            ` : `
                                ${product.discount || 0}%
                            `}
                        </td>
                        <td>
                            <strong style="color: var(--green, #1f4d3a);">
                                ${formatPrice(product.finalPrice || product.sellingPrice || product.sellerPrice || 0)}
                            </strong>
                        </td>
                        <td>
                            <span class="${isPending ? 'badge-pending' : (status === 'APPROVED' ? 'badge-approved' : 'badge-rejected')}">
                                ${escapeHTML(status)}
                            </span>
                        </td>
                        <td>
                            ${isPending ? `
                                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                    <button
                                        type="button"
                                        class="btn small"
                                        style="background: #27ae60; color:#fff;"
                                        onclick="approveProductWithPrice('${product.id}')"
                                        title="Approve and publish to ReenaMart">
                                        ✅ Approve
                                    </button>
                                    <button
                                        type="button"
                                        class="btn small gray"
                                        onclick="rejectProduct('${product.id}')"
                                        title="Reject product">
                                        ❌ Reject
                                    </button>
                                </div>
                            ` : (status === 'APPROVED' ? `
                                <span style="color:#27ae60; font-weight:700; font-size:13px;">✓ Live</span>
                            ` : `
                                <span style="color:#c0392b; font-size:12px;">Rejected</span>
                            `)}
                        </td>
                    </tr>
                `;
            }).join("");
        }
    } catch (error) {
        console.error("Admin products load error:", error);
    }

    // 2. Fetch & display orders and revenue
    try {
        const ordersRes = await apiRequest("/orders");
        const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.content || [];

        const totalOrdersEl = getElement("#totalOrders");
        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

        const totalRev = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
        const totalRevEl = getElement("#totalRevenue");
        if (totalRevEl) totalRevEl.textContent = formatPrice(totalRev);

        if (ordersTable) {
            if (!orders.length) {
                ordersTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding:15px;">No orders placed yet.</td></tr>`;
            } else {
                ordersTable.innerHTML = orders.map(o => {
                    const st = String(o.status || "PLACED").toUpperCase();
                    return `
                        <tr>
                            <td>
                                <strong>#${escapeHTML(o.orderId || o.id)}</strong>
                                <br><a href="tracking.html?id=${encodeURIComponent(o.orderId || o.id)}" target="_blank" style="font-size:11px; color:var(--green,#1f4d3a); text-decoration:none;">🚚 Track Live</a>
                            </td>
                            <td>
                                <strong>${escapeHTML(o.customerName || "Customer")}</strong>
                                <br><small style="color:#666;">${escapeHTML(o.mobile || "")} • ${escapeHTML(o.city || "")}</small>
                            </td>
                            <td><strong style="color:var(--green,#1f4d3a);">${formatPrice(o.total || o.totalAmount || 0)}</strong></td>
                            <td>
                                <select onchange="updateAdminOrderStatus('${o.id}', this.value)" style="padding:4px 8px; border-radius:4px; font-weight:600; border:1px solid #ccc; font-size:12px; cursor:pointer;">
                                    <option value="PLACED" ${st === 'PLACED' ? 'selected' : ''}>PLACED</option>
                                    <option value="PROCESSING" ${st === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
                                    <option value="SHIPPED" ${st === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
                                    <option value="DELIVERED" ${st === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                                </select>
                            </td>
                        </tr>
                    `;
                }).join("");
            }
        }
    } catch (orderErr) {
        console.warn("Admin orders load error:", orderErr);
    }

    // 3. Fetch & display sellers and customers
    try {
        const usersRes = await apiRequest("/users");
        const users = Array.isArray(usersRes) ? usersRes : usersRes?.content || [];

        const sellers = users.filter(u => String(u.role || "").toUpperCase() === "SELLER");
        const buyers = users.filter(u => String(u.role || "").toUpperCase() === "BUYER");

        const totalSellersEl = getElement("#totalSellers");
        if (totalSellersEl) totalSellersEl.textContent = sellers.length;

        if (sellersTable) {
            sellersTable.innerHTML = sellers.map(s => `
                <tr>
                    <td><strong>${escapeHTML(s.username || s.name || "Seller")}</strong></td>
                    <td>${escapeHTML(s.email || "")}</td>
                    <td>${escapeHTML(s.shopName || "Seller Store")}</td>
                    <td>${escapeHTML(s.category || "Fashion")}</td>
                    <td><span class="badge-approved" style="font-size:11px; padding:3px 8px;">Active</span></td>
                </tr>
            `).join("");
        }

        if (customersTable) {
            customersTable.innerHTML = buyers.map(b => `
                <tr>
                    <td><strong>${escapeHTML(b.username || b.name || "Customer")}</strong></td>
                    <td>${escapeHTML(b.email || "")}</td>
                </tr>
            `).join("");
        }
    } catch (usersErr) {
        console.warn("Admin users load error:", usersErr);
    }
}

async function updateAdminOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) return;
    try {
        await apiRequest(`/orders/${encodeURIComponent(orderId)}`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });
        showMessage(`Order #${orderId} status updated to ${newStatus}.`, "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function approveProductWithPrice(productId) {
    const spInput = getElement(`#sellingPrice_${productId}`);
    const discInput = getElement(`#discount_${productId}`);
    const sellingPrice = Number(spInput?.value || 0);
    const discount = Number(discInput?.value || 0);

    try {
        if (sellingPrice > 0) {
            await apiRequest(`/products/${encodeURIComponent(productId)}/price?sellingPrice=${sellingPrice}&discount=${discount}`, {
                method: "PUT"
            });
        }

        await apiRequest(`/products/${encodeURIComponent(productId)}/approve`, {
            method: "PUT"
        });

        showMessage("Product approved successfully! It is now live on ReenaMart.", "success");
        await loadAdminProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function rejectProduct(productId) {
    if (!confirm("Are you sure you want to reject this product?")) return;
    try {
        await apiRequest(`/products/${encodeURIComponent(productId)}/reject`, {
            method: "PUT"
        });
        showMessage("Product rejected.", "info");
        await loadAdminProducts();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function approveProduct(productId) {
    return approveProductWithPrice(productId);
}

/* ==========================================
   NAVIGATION AND INITIALIZATION
========================================== */

function renderBuyerNav() {
    const nav = getElement("#nav");
    if (!nav) return;

    const user = getCurrentUser();
    const cartCount = getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
    const likesCount = getLikes().length;

    nav.innerHTML = `
        <a href="products.html">Products</a>
        <a href="wishlist.html">Wishlist ${likesCount > 0 ? `<span class="badge" style="background:#e67e22; color:#fff; padding:2px 6px; border-radius:10px; font-size:11px;">${likesCount}</span>` : ''}</a>
        <a href="order-history.html">My Orders</a>
        <a href="cart.html">Cart (<span id="cartCount" class="cart-count">${cartCount}</span>)</a>
        <a href="#" onclick="event.preventDefault(); if (window.openReenaMartAi) window.openReenaMartAi();" style="color: #e67e22; font-weight: 700;">🤖 Ask AI</a>
        ${user ? `
            <span style="font-weight: 600; color: var(--green, #1f4d3a); margin-left: 6px;">Hi, ${escapeHTML(user.name || user.username || 'User')}</span>
            <button type="button" class="logout-button btn small outline" style="margin-left: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;">Logout</button>
        ` : `
            <a href="login.html" class="btn small" style="margin-left: 8px; padding: 6px 14px;">Login</a>
        `}
    `;

    setupLogoutButtons();
}

function setupLogoutButtons() {
    getElements("#logoutButton, .logout-button").forEach(button => {
        button.addEventListener("click", logoutUser);
    });
}

async function adminLogin(event) {
    event?.preventDefault();
    const emailInput = getElement("#email") || getElement("#adminEmail");
    const passwordInput = getElement("#password") || getElement("#adminPassword");
    const msgBox = getElement("#message");

    let email = String(emailInput?.value || "").trim();
    const password = String(passwordInput?.value || "");

    if (email.toLowerCase() === "admin" || email.toLowerCase() === "admin1") {
        email = "admin@gmail.com";
    }

    if (!email || !password) {
        showMessage("Enter admin email and password.", "warning");
        if (msgBox) msgBox.innerHTML = `<p style="color:#c0392b;">Please enter admin email and password.</p>`;
        return;
    }

    const submitBtn = getElement("#adminLoginForm button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in as Admin...";
    }

    try {
        let result;
        try {
            result = await apiRequest("/users/admin/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
        } catch (err) {
            result = await apiRequest("/users/login", {
                method: "POST",
                body: JSON.stringify({ email, password, role: "ADMIN" })
            });
        }

        if (!result || !result.role || String(result.role).toUpperCase() !== "ADMIN") {
            throw new Error("This account is not authorized as an Administrator.");
        }

        const adminUser = {
            id: result.id ?? result.userId,
            name: result.name || result.username || "Administrator",
            email: result.email || email,
            role: "ADMIN"
        };

        saveJSON(STORAGE_KEYS.user, adminUser);
        if (result.token) {
            localStorage.setItem(STORAGE_KEYS.token, result.token);
        }

        showMessage("Admin login successful! Welcome.", "success");
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 300);
    } catch (error) {
        console.error("Admin login error:", error);
        const errMsg = error.message || "Invalid admin credentials.";
        showMessage(errMsg, "error");
        if (msgBox) {
            msgBox.innerHTML = `
                <div style="background:#fde8e8; color:#c0392b; padding:12px 14px; border-radius:6px; margin:12px 0;">
                    ${escapeHTML(errMsg)}
                    <br><small style="color:#555;">Default Admin: <strong>admin@gmail.com</strong> / <strong>123456</strong></small>
                </div>
            `;
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

async function sellerLogin(event) {
    event?.preventDefault();
    const emailInput = getElement("#email") || getElement("#sellerEmail");
    const passwordInput = getElement("#password");
    const msgBox = getElement("#message");

    const email = String(emailInput?.value || "").trim();
    const password = String(passwordInput?.value || "");

    if (!email || !password) {
        showMessage("Enter email and password.", "warning");
        if (msgBox) msgBox.innerHTML = `<p style="color:#c0392b;">Please enter email and password.</p>`;
        return;
    }

    const submitBtn = getElement("#sellerLoginForm button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
    }

    try {
        let result;
        try {
            result = await apiRequest("/users/seller/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
        } catch (err) {
            result = await apiRequest("/users/login", {
                method: "POST",
                body: JSON.stringify({ email, password, role: "SELLER" })
            });
        }

        if (!result || !result.role) {
            throw new Error("Invalid response from server.");
        }

        const user = {
            id: result.id ?? result.userId,
            name: result.name || result.username || email.split("@")[0],
            email: result.email || email,
            role: "SELLER"
        };

        saveJSON(STORAGE_KEYS.user, user);
        showMessage("Seller login successful! Welcome.", "success");
        setTimeout(() => {
            window.location.href = "seller-dashboard.html";
        }, 300);
    } catch (error) {
        console.error("Seller login error:", error);
        const errMsg = error.message || "Invalid email or password.";
        showMessage(errMsg, "error");
        if (msgBox) {
            msgBox.innerHTML = `
                <div style="background:#fde8e8; color:#c0392b; padding:12px 14px; border-radius:6px; margin:12px 0;">
                    ${escapeHTML(errMsg)}
                    <br><small style="color:#555;">New seller? <a href="seller-register.html" style="color:var(--green, #1f4d3a); font-weight:700;">Click here to register your shop</a></small>
                </div>
            `;
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

async function sellerRegister(event) {
    event?.preventDefault();
    const name = String(getElement("#sellerName")?.value || "").trim();
    const email = String(getElement("#sellerEmail")?.value || "").trim();
    const mobile = String(getElement("#mobile")?.value || "").trim();
    const shopName = String(getElement("#shopName")?.value || "").trim();
    const category = String(getElement("#category")?.value || "Fashion").trim();
    const password = String(getElement("#password")?.value || "");
    const msgBox = getElement("#message");

    if (!name || !email || !password || !mobile || !shopName) {
        showMessage("Please fill all required fields.", "warning");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters.", "warning");
        return;
    }

    const submitBtn = getElement("#sellerRegisterForm button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";
    }

    try {
        const userPayload = {
            username: name,
            email: email,
            password: password,
            role: "SELLER"
        };
        const userRes = await apiRequest("/users/seller/register", {
            method: "POST",
            body: JSON.stringify(userPayload)
        });

        try {
            await apiRequest("/sellers/register", {
                method: "POST",
                body: JSON.stringify({
                    username: name,
                    email: email,
                    phone: mobile,
                    businessName: shopName,
                    category: category,
                    approvalStatus: "APPROVED"
                })
            });
        } catch (sellerErr) {
            console.warn("Seller profile registration note:", sellerErr);
        }

        const sellerUser = {
            id: userRes.id ?? userRes.userId,
            name: userRes.name || userRes.username || name,
            email: userRes.email || email,
            role: "SELLER",
            shopName: shopName
        };
        saveJSON(STORAGE_KEYS.user, sellerUser);

        showMessage("Seller registered successfully! Welcome.", "success");
        setTimeout(() => {
            window.location.href = "seller-dashboard.html";
        }, 500);
    } catch (error) {
        showMessage(error.message, "error");
        if (msgBox) {
            msgBox.innerHTML = `
                <div style="background:#fde8e8; color:#c0392b; padding:10px 14px; border-radius:6px; margin:12px 0;">
                    ${escapeHTML(error.message)}
                </div>
            `;
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

function fillSampleProduct() {
    const nameInput = getElement("#productName");
    const descInput = getElement("#description");
    const priceInput = getElement("#sellerPrice");
    const catInput = getElement("#category");
    const imgInput = getElement("#imageUrl");
    const sizesInput = getElement("#sizes");
    const shopInput = getElement("#shopName");
    const stockInput = getElement("#stock");

    const currentUser = getCurrentUser();

    if (nameInput) nameInput.value = "Festive Embroidered Silk Kurti";
    if (descInput) descInput.value = "Handcrafted pure silk festive kurti with intricate gold zari embroidery.";
    if (priceInput) priceInput.value = "480";
    if (catInput) catInput.value = "Fashion";
    if (imgInput) imgInput.value = "https://images.unsplash.com/photo-1610030469983-98e550d6193c";
    if (sizesInput) sizesInput.value = "S,M,L,XL,XXL";
    if (shopInput) shopInput.value = currentUser?.shopName || "ReenaMart Boutique";
    if (stockInput) stockInput.value = "25";

    showMessage("Sample product details filled! Click 'Submit for Admin Approval'.", "info");
}

/* ==========================================
   ORDER TRACKING
========================================== */

async function loadTrackingPage() {
    const params = new URLSearchParams(window.location.search);
    let orderId = params.get("id");

    const orderIdEl = getElement("#trackingOrderId");
    const container = getElement("#trackingDetailsBox");

    if (!orderId) {
        const lastOrder = getStoredJSON("lastOrder", null);
        if (lastOrder && (lastOrder.orderId || lastOrder.id)) {
            orderId = lastOrder.orderId || lastOrder.id;
        }
    }

    if (!orderId) {
        if (orderIdEl) orderIdEl.textContent = "Please enter an Order ID to track.";
        return;
    }

    if (orderIdEl) orderIdEl.innerHTML = `Tracking Order: <strong>#${escapeHTML(orderId)}</strong>`;

    try {
        const orders = await apiRequest("/orders");
        const allOrders = Array.isArray(orders) ? orders : orders?.content || [];

        const order = allOrders.find(o =>
            String(o.orderId || "").trim().toLowerCase() === String(orderId).trim().toLowerCase() ||
            String(o.id || "").trim() === String(orderId).trim()
        );

        if (!order) {
            if (container) {
                container.innerHTML = `
                    <div class="box center" style="color:#c0392b; background:#fde8e8; margin-top:20px;">
                        <p>Order #${escapeHTML(orderId)} was not found.</p>
                        <br>
                        <a href="order-history.html" class="btn small">View All Orders</a>
                    </div>
                `;
            }
            return;
        }

        renderTrackingStepper(order.status || "PLACED");

        if (container) {
            const placedDate = order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' }) : "Recently";
            const estDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' });

            container.innerHTML = `
                <div class="box" style="margin-top: 25px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h2 style="margin: 0; color: var(--green, #1f4d3a);">Order #${escapeHTML(order.orderId || order.id)}</h2>
                            <small style="color: #666;">Placed on: ${placedDate}</small>
                        </div>
                        <div>
                            <span class="badge-approved" style="font-size: 14px; padding: 6px 14px;">
                                Status: ${escapeHTML(order.status || "PLACED")}
                            </span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; margin-bottom: 20px;">
                        <div style="background: #fcfcfc; padding: 14px; border-radius: 8px; border: 1px solid #eee;">
                            <h4 style="margin: 0 0 8px 0; color: var(--green, #1f4d3a);">📍 Delivery Address</h4>
                            <p style="margin: 0; line-height: 1.5; font-size: 14px;">
                                <strong>${escapeHTML(order.customerName || '')}</strong><br>
                                ${escapeHTML(order.address || '')}<br>
                                ${escapeHTML(order.city || '')}, ${escapeHTML(order.state || '')} - ${escapeHTML(order.pincode || '')}<br>
                                📞 Mobile: ${escapeHTML(order.mobile || '')}
                            </p>
                        </div>

                        <div style="background: #fcfcfc; padding: 14px; border-radius: 8px; border: 1px solid #eee;">
                            <h4 style="margin: 0 0 8px 0; color: var(--green, #1f4d3a);">🚚 Shipping Info</h4>
                            <p style="margin: 0; line-height: 1.5; font-size: 14px;">
                                Estimated Delivery: <strong style="color: #27ae60;">${estDelivery}</strong><br>
                                Courier: <strong>ReenaMart Express Delivery</strong><br>
                                Payment Method: <strong>${escapeHTML(order.paymentMethod || 'COD')}</strong>
                            </p>
                        </div>
                    </div>

                    ${Array.isArray(order.products) && order.products.length ? `
                        <div style="margin: 15px 0;">
                            <h4 style="margin: 0 0 10px 0; color: var(--green, #1f4d3a);">📦 Ordered Items</h4>
                            <div style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                                ${order.products.map(p => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee;">
                                        <div>
                                            <strong>${escapeHTML(p.productName || 'Product')}</strong>
                                            ${p.size ? `<span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:6px;">Size: ${escapeHTML(p.size)}</span>` : ''}
                                            <span style="color:#777; font-size:13px; margin-left:6px;">× ${p.quantity}</span>
                                        </div>
                                        <div>
                                            <strong>${formatPrice((p.price || 0) * (p.quantity || 1))}</strong>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid var(--border); padding-top: 14px; margin-top: 15px;">
                        <span style="font-size: 16px; font-weight: 700;">Total Paid / Payable:</span>
                        <span style="font-size: 20px; font-weight: 800; color: var(--green, #1f4d3a);">
                            ${formatPrice(order.total || order.totalAmount || 0)}
                        </span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderTrackingStepper(status) {
    const s = String(status).toUpperCase();
    const steps = [
        { key: "PLACED", label: "Order Placed", sub: "Confirmed" },
        { key: "PROCESSING", label: "Processing", sub: "Packed at Hub" },
        { key: "SHIPPED", label: "Shipped", sub: "In Transit" },
        { key: "DELIVERED", label: "Delivered", sub: "Destination" }
    ];

    let activeIndex = 0;
    if (s === "PLACED" || s === "CONFIRMED") activeIndex = 0;
    else if (s === "PROCESSING" || s === "PACKED") activeIndex = 1;
    else if (s === "SHIPPED" || s === "IN_TRANSIT" || s === "OUT_FOR_DELIVERY") activeIndex = 2;
    else if (s === "DELIVERED" || s === "COMPLETED") activeIndex = 3;

    const stepperEl = getElement("#trackingStepper");
    if (!stepperEl) return;

    const progressPct = activeIndex === 0 ? 12 : (activeIndex === 1 ? 38 : (activeIndex === 2 ? 70 : 100));

    stepperEl.innerHTML = `
        <div class="tracking-progress-bar" style="width: ${progressPct}%;"></div>
        ${steps.map((st, idx) => {
            let cls = "";
            let icon = idx + 1;
            if (idx < activeIndex) {
                cls = "completed";
                icon = "✓";
            } else if (idx === activeIndex) {
                cls = "active";
                icon = idx === 3 ? "🏠" : (idx === 2 ? "🚚" : (idx === 1 ? "📦" : "✓"));
            }
            return `
                <div class="tracking-step ${cls}">
                    <div class="step-circle">${icon}</div>
                    <div class="step-label">${st.label}</div>
                    <div class="step-subtext">${st.sub}</div>
                </div>
            `;
        }).join("")}
    `;
}

function searchTracking() {
    const input = getElement("#trackSearchInput");
    const val = String(input?.value || "").trim();
    if (val) {
        window.location.href = `tracking.html?id=${encodeURIComponent(val)}`;
    }
}

function setupForms() {
    const registerForm = getElement("#registerForm");
    const loginForm = getElement("#loginForm");
    const sellerForm = getElement("#sellerProductForm");
    const checkoutForm = getElement("#checkoutForm");
    const sellerLoginForm = getElement("#sellerLoginForm");
    const sellerRegisterForm = getElement("#sellerRegisterForm");
    const adminLoginForm = getElement("#adminLoginForm");

    registerForm?.addEventListener("submit", registerUser);
    loginForm?.addEventListener("submit", loginUser);
    sellerForm?.addEventListener("submit", addSellerProduct);
    checkoutForm?.addEventListener("submit", checkout);
    sellerLoginForm?.addEventListener("submit", sellerLogin);
    sellerRegisterForm?.addEventListener("submit", sellerRegister);
    adminLoginForm?.addEventListener("submit", adminLogin);
}

function initializePage() {
    renderBuyerNav();
    updateCartCount();
    setupForms();
    setupLogoutButtons();
    setupProductSearch();

    const path = window.location.pathname.toLowerCase();

    if (path.endsWith("/products.html") || path.endsWith("/products")) {
        loadProducts();
    }

    if (path.endsWith("/cart.html") || path.endsWith("/cart")) {
        renderCart();
    }

    if (path.endsWith("/checkout.html") || path.endsWith("/checkout")) {
        initCheckout();
    }

    if (path.endsWith("/product-details.html") || path.endsWith("/product-details")) {
        loadProductDetails();
    }

    if (path.endsWith("/orders.html") || path.endsWith("/order-history.html") || path.endsWith("/orders")) {
        loadOrders();
    }

    if (path.endsWith("/seller.html") || path.endsWith("/seller-products.html") || path.endsWith("/seller-dashboard.html")) {
        loadSellerProducts();
    }

    if (path.endsWith("/seller-login.html")) {
        initSellerLogin();
    }

    if (path.endsWith("/seller-register.html")) {
        initSellerRegister();
    }

    if (path.endsWith("/adminlogin.html")) {
        initAdminLogin();
    }

    if (path.endsWith("/tracking.html")) {
        loadTrackingPage();
    }

    if (path.endsWith("/admin.html") || path.endsWith("/admin")) {
        loadAdminProducts();
    }

    if (path.endsWith("/likes.html") || path.endsWith("/wishlist.html")) {
        renderLikedProducts();
    }

    // Automatically inject AI Assistant script on all pages if not already loaded
    if (!document.querySelector('script[src*="ai-bot.js"]')) {
        const botScript = document.createElement("script");
        botScript.src = "../js/ai-bot.js";
        document.body.appendChild(botScript);
    }
}

/* ==========================================
   GLOBAL COMPATIBILITY HELPERS
========================================= */

function openProduct(id) {
    if (id) {
        window.location.href = `product-details.html?id=${encodeURIComponent(id)}`;
    }
}

function adminLogout() {
    logoutUser();
}

function sellerLogout() {
    logoutUser();
}

function initLogin() {}
function initRegister() {}
function initAdmin() { loadAdminProducts(); }
function initAdminLogin() {
    const form = getElement("#adminLoginForm");
    form?.addEventListener("submit", adminLogin);
}
function initSellerLogin() {
    const form = getElement("#sellerLoginForm");
    form?.addEventListener("submit", sellerLogin);
}
function initSellerProducts() { loadSellerProducts(); }
function initSellerRegister() {
    const form = getElement("#sellerRegisterForm");
    form?.addEventListener("submit", sellerRegister);
}
function initOrders() { loadOrders(); }
function initProducts() { loadProducts(); }
function initProductDetails() { loadProductDetails(); }

// Expose on window for inline handlers & AI chatbot
window.buyNow = buyNow;
window.addToCart = addToCart;
window.openProduct = openProduct;
window.initCheckout = initCheckout;
window.checkout = checkout;
window.renderBuyerNav = renderBuyerNav;
window.sellerLogin = sellerLogin;
window.sellerRegister = sellerRegister;
window.adminLogin = adminLogin;
window.updateAdminOrderStatus = updateAdminOrderStatus;
window.fillSampleProduct = fillSampleProduct;
window.approveProductWithPrice = approveProductWithPrice;
window.rejectProduct = rejectProduct;
window.loadTrackingPage = loadTrackingPage;
window.searchTracking = searchTracking;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
} else {
    initializePage();
}


