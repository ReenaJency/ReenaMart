/**
 * ReenaMart AI Shopping Assistant
 * Intelligent client-side assistant for product discovery, Tanglish/English queries, and direct ordering.
 */

(function () {
    "use strict";

    // Audio chime using Web Audio API (no external asset needed)
    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            // AudioContext might be blocked until user gesture
        }
    }

    // Product cache
    let cachedProducts = [];
    async function fetchStoreProducts() {
        if (cachedProducts.length > 0) return cachedProducts;
        try {
            const res = await fetch("http://localhost:8080/api/products");
            if (res.ok) {
                const data = await res.json();
                cachedProducts = Array.isArray(data) ? data : data?.content || [];
            }
        } catch (e) {
            console.warn("AI Bot: Unable to load remote products", e);
        }
        return cachedProducts;
    }

    // Tanglish & English Smart Intent Parser
    async function processUserMessage(rawText) {
        const text = rawText.trim().toLowerCase();
        const products = await fetchStoreProducts();

        // 1. Order Status / Tracking / Delivery
        if (
            text.includes("track") ||
            text.includes("status") ||
            text.includes("delivery") ||
            text.includes("order details") ||
            text.includes("enga iruku") ||
            text.includes("eppo varum") ||
            text.includes("vanthurucha")
        ) {
            const lastOrder = JSON.parse(localStorage.getItem("lastOrder") || "null");
            let orderInfo = "";
            if (lastOrder && (lastOrder.orderId || lastOrder.id)) {
                orderInfo = `
                    <div class="ai-highlight-box">
                        <strong>📦 Your Recent Order: #${lastOrder.orderId || lastOrder.id}</strong><br>
                        Status: <span class="ai-status-badge">${lastOrder.status || "PLACED"}</span><br>
                        Total: <strong>₹${Number(lastOrder.total || lastOrder.totalAmount || 0).toFixed(2)}</strong><br>
                        Delivery to: ${lastOrder.city || "Tamil Nadu"}
                    </div>
                `;
            }

            return {
                reply: `
                    Orders are delivered within <strong>2 to 4 business days</strong> with Free Delivery across India! 🚚<br><br>
                    ${orderInfo}
                    You can view all your orders on the <a href="order-history.html" class="ai-inline-link">My Orders Page</a>.
                `
            };
        }

        // 2. How to Order / How to Buy / Payment / COD
        if (
            text.includes("how to buy") ||
            text.includes("how to order") ||
            text.includes("order pandrathu") ||
            text.includes("buy pandrathu") ||
            text.includes("epdi buy") ||
            text.includes("payment") ||
            text.includes("cod") ||
            text.includes("cash on delivery") ||
            text.includes("eppadi order")
        ) {
            return {
                reply: `
                    <strong>🛒 How to place an order on ReenaMart:</strong><br><br>
                    1. <strong>Select a Product</strong>: Click on any product or click <strong>⚡ Buy Now</strong>.<br>
                    2. <strong>Enter Delivery Info</strong>: Fill your Name, Mobile, and Address on the Checkout page.<br>
                    3. <strong>Payment Method</strong>: Choose <strong>Cash on Delivery (COD)</strong>, UPI, or Card.<br>
                    4. Click <strong>Place Order</strong> — Done! Instant confirmation. 🎉<br><br>
                    <em>Tip: You can also click "⚡ Buy Now" directly on any product card below!</em>
                `
            };
        }

        // 3. Discount / Offers / Deals
        if (
            text.includes("offer") ||
            text.includes("discount") ||
            text.includes("deal") ||
            text.includes("sale") ||
            text.includes("thallubadi")
        ) {
            const discountItems = [...products]
                .filter(p => Number(p.discount || 0) > 0)
                .sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0))
                .slice(0, 4);

            if (discountItems.length > 0) {
                return {
                    reply: `Here are our <strong>Top Discounted Deals</strong> with up to ${discountItems[0].discount}% OFF today! 🔥`,
                    products: discountItems
                };
            }
        }

        // 4. Budget / Price Filtering (e.g. "under 500", "under 1000", "cheap")
        const priceMatch = text.match(/(?:under|below|kulla|within|less than|\<)\s*₹?\s*(\d+)/i);
        let maxBudget = null;
        if (priceMatch && priceMatch[1]) {
            maxBudget = Number(priceMatch[1]);
        } else if (text.includes("cheap") || text.includes("budget") || text.includes("low price")) {
            maxBudget = 500;
        }

        // 5. Category Keyword Detection
        let matchedCategory = null;
        if (text.includes("fashion") || text.includes("dress") || text.includes("cloth") || text.includes("saree") || text.includes("top") || text.includes("jacket") || text.includes("aadaigal")) {
            matchedCategory = "Fashion";
        } else if (text.includes("jewel") || text.includes("necklace") || text.includes("ring") || text.includes("bangle") || text.includes("pendant") || text.includes("nagai")) {
            matchedCategory = "Jewellery";
        } else if (text.includes("electr") || text.includes("watch") || text.includes("earbud") || text.includes("speaker") || text.includes("keyboard") || text.includes("mouse") || text.includes("power bank")) {
            matchedCategory = "Electronics";
        } else if (text.includes("beauty") || text.includes("makeup") || text.includes("lipstick") || text.includes("face wash") || text.includes("cream") || text.includes("sunscreen") || text.includes("serum") || text.includes("alagu")) {
            matchedCategory = "Beauty";
        }

        // Filter products based on search terms
        let filtered = products;

        if (matchedCategory) {
            filtered = filtered.filter(p =>
                String(p.category || "").toLowerCase().includes(matchedCategory.toLowerCase())
            );
        }

        if (maxBudget) {
            filtered = filtered.filter(p => {
                const finalP = Number(p.finalPrice || p.sellingPrice || p.sellerPrice || 0);
                return finalP <= maxBudget;
            });
        }

        // Specific item name search if not filtered by category
        if (!matchedCategory && !maxBudget) {
            const cleanQuery = text
                .replace(/iruka|irukka|venum|theva|kaatu|kaami|kodu|show|find|search|give|me|please|i want/g, "")
                .trim();

            if (cleanQuery.length >= 3) {
                const searchResults = products.filter(p => {
                    const name = String(p.name || "").toLowerCase();
                    const desc = String(p.description || "").toLowerCase();
                    const cat = String(p.category || "").toLowerCase();
                    return name.includes(cleanQuery) || desc.includes(cleanQuery) || cat.includes(cleanQuery);
                });

                if (searchResults.length > 0) {
                    filtered = searchResults;
                }
            }
        }

        // If specific items found:
        if (filtered.length > 0 && (matchedCategory || maxBudget || filtered.length < products.length)) {
            const displayList = filtered.slice(0, 4);
            let replyText = `I found <strong>${filtered.length} products</strong> matching your search`;
            if (matchedCategory) replyText += ` in <em>${matchedCategory}</em>`;
            if (maxBudget) replyText += ` under <em>₹${maxBudget}</em>`;
            replyText += "! Check these out: 👇";

            return {
                reply: replyText,
                products: displayList
            };
        }

        // 6. Greetings & Tamil / Tanglish Welcomes
        if (
            text.includes("hi") ||
            text.includes("hello") ||
            text.includes("vanakkam") ||
            text.includes("hey") ||
            text.includes("help")
        ) {
            return {
                reply: `
                    Vanakkam! 🙏 Welcome to <strong>ReenaMart AI</strong>!<br><br>
                    I can help you find products, check prices & discounts, or place an order.<br>
                    Try asking:<br>
                    • <em>"Show dresses under 600"</em><br>
                    • <em>"Watch iruka?"</em><br>
                    • <em>"Best discounts"</em><br>
                    • <em>"How to order?"</em>
                `
            };
        }

        // 7. General fallback with recommended featured products
        const sampleProducts = products.slice(0, 3);
        return {
            reply: `I can help you find anything in <strong>Fashion, Jewellery, Electronics, and Beauty</strong>! Here are some popular picks right now: ✨`,
            products: sampleProducts
        };
    }

    // Build Chat UI Widget
    function createChatWidget() {
        if (document.getElementById("reenamartAiContainer")) return;

        const widgetWrap = document.createElement("div");
        widgetWrap.id = "reenamartAiContainer";
        widgetWrap.innerHTML = `
            <!-- Launcher Button -->
            <button id="reenamartAiLauncher" class="ai-launcher-btn" aria-label="Open ReenaMart AI Assistant" title="ReenaMart AI Assistant">
                <span class="ai-launcher-icon">🤖</span>
                <span class="ai-launcher-label">Ask AI</span>
                <span class="ai-pulse-dot"></span>
            </button>

            <!-- Chat Modal / Popup -->
            <div id="reenamartAiModal" class="ai-chat-modal" style="display: none;">
                <div class="ai-chat-header">
                    <div class="ai-header-info">
                        <div class="ai-avatar-badge">🤖</div>
                        <div>
                            <h3 class="ai-header-title">ReenaMart AI</h3>
                            <span class="ai-header-status"><span class="ai-status-circle"></span> Online • Shopping Assistant</span>
                        </div>
                    </div>
                    <div class="ai-header-actions">
                        <button type="button" id="aiClearBtn" class="ai-icon-btn" title="Clear conversation">🗑️</button>
                        <button type="button" id="aiCloseBtn" class="ai-icon-btn" title="Close chat">✕</button>
                    </div>
                </div>

                <!-- Suggestion Chips Bar -->
                <div class="ai-chips-bar">
                    <button type="button" class="ai-chip" data-query="Show fashion dresses">👗 Dresses</button>
                    <button type="button" class="ai-chip" data-query="Show jewellery">💍 Jewellery</button>
                    <button type="button" class="ai-chip" data-query="Smart watch iruka?">⌚ Smart Watch</button>
                    <button type="button" class="ai-chip" data-query="Items under 500">💰 Under ₹500</button>
                    <button type="button" class="ai-chip" data-query="Best discounts">🔥 Offers</button>
                    <button type="button" class="ai-chip" data-query="How to order?">🛒 How to Buy</button>
                </div>

                <!-- Messages Container -->
                <div id="aiMessagesContainer" class="ai-messages-container"></div>

                <!-- Input Area -->
                <form id="aiChatForm" class="ai-chat-input-form">
                    <input
                        type="text"
                        id="aiChatInput"
                        class="ai-chat-input"
                        placeholder="Ask AI... (e.g. watch iruka, dress under 600)"
                        autocomplete="off"
                        required
                    />
                    <button type="submit" id="aiSendBtn" class="ai-send-btn" title="Send">
                        ➤
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(widgetWrap);

        // Bind events
        const launcher = document.getElementById("reenamartAiLauncher");
        const modal = document.getElementById("reenamartAiModal");
        const closeBtn = document.getElementById("aiCloseBtn");
        const clearBtn = document.getElementById("aiClearBtn");
        const form = document.getElementById("aiChatForm");
        const input = document.getElementById("aiChatInput");
        const messagesBox = document.getElementById("aiMessagesContainer");

        // Toggle Open / Close
        launcher.addEventListener("click", () => {
            const isOpen = modal.style.display === "flex";
            if (isOpen) {
                modal.style.display = "none";
            } else {
                modal.style.display = "flex";
                launcher.classList.add("active");
                input.focus();
                // If first time open, add welcome message
                if (messagesBox.children.length === 0) {
                    addBotMessage(`
                        <strong>Vanakkam! Welcome to ReenaMart AI! 🙏</strong><br>
                        I can help you browse our collections, find deals, and place orders directly.<br><br>
                        <em>How can I assist you today?</em>
                    `);
                }
            }
        });

        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
            launcher.classList.remove("active");
        });

        clearBtn.addEventListener("click", () => {
            messagesBox.innerHTML = "";
            sessionStorage.removeItem("reenamart_ai_history");
            addBotMessage("Chat cleared! How can I help you?");
        });

        // Quick Suggestion Chips
        document.querySelectorAll(".ai-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const query = chip.getAttribute("data-query");
                if (query) {
                    handleUserQuery(query);
                }
            });
        });

        // Form Submit
        form.addEventListener("click", (e) => e.stopPropagation());
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            input.value = "";
            handleUserQuery(text);
        });

        // Restore chat history if exists in sessionStorage
        restoreChatHistory();
    }

    // Add User Bubble
    function addUserMessage(text) {
        const container = document.getElementById("aiMessagesContainer");
        const bubble = document.createElement("div");
        bubble.className = "ai-msg-row ai-msg-user";
        bubble.innerHTML = `
            <div class="ai-bubble ai-bubble-user">
                ${escapeHTML(text)}
            </div>
        `;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
        saveChatHistory();
    }

    // Add Bot Bubble (with optional product cards)
    function addBotMessage(htmlReply, products = []) {
        const container = document.getElementById("aiMessagesContainer");
        const bubble = document.createElement("div");
        bubble.className = "ai-msg-row ai-msg-bot";

        let productsHtml = "";
        if (products && products.length > 0) {
            productsHtml = `
                <div class="ai-product-grid">
                    ${products.map(p => {
                        const pid = p.id || p.productId;
                        const pname = escapeHTML(p.name || "Product");
                        const pimg = escapeHTML(p.imageUrl || p.image || "https://placehold.co/150x150?text=Product");
                        const pprice = Number(p.finalPrice || p.sellingPrice || p.sellerPrice || 0);
                        const pdiscount = Number(p.discount || 0);

                        return `
                            <div class="ai-product-card">
                                <img
                                    src="${pimg}"
                                    alt="${pname}"
                                    class="ai-product-img"
                                    onclick="window.location.href='product-details.html?id=${pid}'"
                                    onerror="this.onerror=null;this.src='https://placehold.co/150x150?text=Product';"
                                />
                                <div class="ai-product-details">
                                    <div class="ai-product-name" onclick="window.location.href='product-details.html?id=${pid}'" title="${pname}">
                                        ${pname}
                                    </div>
                                    <div class="ai-product-price-row">
                                        <span class="ai-product-price">₹${pprice.toFixed(2)}</span>
                                        ${pdiscount > 0 ? `<span class="ai-product-discount">${pdiscount}% OFF</span>` : ""}
                                    </div>
                                    <div class="ai-product-actions">
                                        <button
                                            type="button"
                                            class="ai-action-btn ai-btn-buy"
                                            onclick="window.buyNow('${pid}')">
                                            ⚡ Buy Now
                                        </button>
                                        <button
                                            type="button"
                                            class="ai-action-btn ai-btn-cart"
                                            onclick="window.addToCart('${pid}')">
                                            🛒 Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `;
        }

        bubble.innerHTML = `
            <div class="ai-bot-avatar">🤖</div>
            <div class="ai-bubble ai-bubble-bot">
                <div class="ai-bubble-text">${htmlReply}</div>
                ${productsHtml}
            </div>
        `;

        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
        playChime();
        saveChatHistory();
    }

    // Add Typing Indicator
    function showTypingIndicator() {
        const container = document.getElementById("aiMessagesContainer");
        const typing = document.createElement("div");
        typing.id = "aiTypingIndicator";
        typing.className = "ai-msg-row ai-msg-bot";
        typing.innerHTML = `
            <div class="ai-bot-avatar">🤖</div>
            <div class="ai-bubble ai-bubble-bot ai-typing-bubble">
                <span class="ai-dot"></span>
                <span class="ai-dot"></span>
                <span class="ai-dot"></span>
            </div>
        `;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    function removeTypingIndicator() {
        const typing = document.getElementById("aiTypingIndicator");
        if (typing) typing.remove();
    }

    // Handle user query
    async function handleUserQuery(text) {
        addUserMessage(text);
        showTypingIndicator();

        // Simulate thoughtful AI reasoning delay
        setTimeout(async () => {
            removeTypingIndicator();
            const response = await processUserMessage(text);
            addBotMessage(response.reply, response.products || []);
        }, 500);
    }

    // Save and Restore Chat History
    function saveChatHistory() {
        const container = document.getElementById("aiMessagesContainer");
        if (container) {
            sessionStorage.setItem("reenamart_ai_history", container.innerHTML);
        }
    }

    function restoreChatHistory() {
        const saved = sessionStorage.getItem("reenamart_ai_history");
        const container = document.getElementById("aiMessagesContainer");
        if (saved && container) {
            container.innerHTML = saved;
            container.scrollTop = container.scrollHeight;
        }
    }

    function escapeHTML(str) {
        return String(str || "").replace(/[&<>'"]/g, tag => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        })[tag] || tag);
    }

    // Auto-initialize when DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createChatWidget);
    } else {
        createChatWidget();
    }

    // Expose global open helper for navbar or other links
    window.openReenaMartAi = function (query = null) {
        const modal = document.getElementById("reenamartAiModal");
        if (modal) {
            modal.style.display = "flex";
            if (query) {
                handleUserQuery(query);
            }
        }
    };

})();
