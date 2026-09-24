console.log("ReenaMart website loaded successfully!");

// ==============================
// CART
// ==============================

let cart = JSON.parse(localStorage.getItem("cart")) || [];


// Get product stock
function getStock(product) {
    return Number(
        product.stock ??
        product.quantity ??
        0
    );
}


// Get selling price
function getSellingPrice(product) {
    return Number(
        product.sellingPrice ??
        product.price ??
        0
    );
}


// Get admin discount percentage
function getDiscount(product) {
    return Math.max(
        0,
        Number(product.discount ?? 0)
    );
}


// Get final price
function getFinalPrice(product) {

    if (
        product.finalPrice !== undefined &&
        product.finalPrice !== null &&
        product.finalPrice !== ""
    ) {
        return Number(product.finalPrice);
    }

    const sellingPrice = getSellingPrice(product);
    const discount = getDiscount(product);

    return sellingPrice -
        (sellingPrice * discount / 100);
}


// ==============================
// ADD TO CART
// ==============================

function addToCart(product) {

    const stock = getStock(product);

    if (stock <= 0) {
        alert("This product is out of stock.");
        return;
    }

    const existingProduct = cart.find(
        item => String(item.id) === String(product.id)
    );

    if (existingProduct) {

        const currentQuantity =
            Number(existingProduct.quantity || 1);

        if (currentQuantity >= stock) {
            alert(
                "Only " +
                stock +
                " item(s) available in stock."
            );
            return;
        }

        existingProduct.quantity =
            currentQuantity + 1;

    } else {

        cart.push({
            ...product,
            sellingPrice: getSellingPrice(product),
            discount: getDiscount(product),
            finalPrice: getFinalPrice(product),
            stock: stock,
            quantity: 1
        });
    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    alert(product.name + " added to cart!");

    updateCartCount();
}


// ==============================
// REMOVE FROM CART
// ==============================

function removeFromCart(id) {

    cart = cart.filter(
        item => String(item.id) !== String(id)
    );

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}


// ==============================
// CLEAR CART
// ==============================

function clearCart() {

    cart = [];

    localStorage.removeItem("cart");

    localStorage.removeItem("cartSubtotal");
    localStorage.removeItem("cartDiscount");
    localStorage.removeItem("cartTotal");

    updateCartCount();
}


// ==============================
// UPDATE CART COUNT
// ==============================

function updateCartCount() {

    const count = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 1),
        0
    );

    const cartCount =
        document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = count;
    }
}


// ==============================
// BUYER LOGIN
// ==============================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const emailElement =
                document.getElementById("email");

            const passwordElement =
                document.getElementById("password");

            if (!emailElement || !passwordElement) {
                alert("Login fields are missing.");
                return;
            }

            const email =
                emailElement.value.trim();

            const password =
                passwordElement.value;

            if (!email || !password) {
                alert(
                    "Please enter email and password."
                );
                return;
            }


            // Buyer role
            const role = "BUYER";


            try {

                const response = await fetch(
                    "http://localhost:8080/api/users/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password,
                            role: role
                        })
                    }
                );


                // ==============================
                // LOGIN FAILED
                // ==============================

                if (!response.ok) {

                    let message =
                        "Invalid email, password or role.";

                    try {
                        const serverMessage =
                            await response.text();

                        if (serverMessage.trim()) {
                            message = serverMessage;
                        }
                    } catch (error) {
                        console.error(error);
                    }

                    alert(message);
                    return;
                }


                // ==============================
                // LOGIN SUCCESS
                // ==============================

                const user =
                    await response.json();


                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(user)
                );


                localStorage.setItem(
                    "userRole",
                    "BUYER"
                );


                alert("Login successful!");


                // Go to buyer products
                window.location.href =
                    "products.html";
            }


            catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Unable to connect to server. Please make sure the backend is running."
                );
            }
        }
    );
}


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

    }
);