console.log("ReenaMart website loaded successfully!");


// ==============================
// CART
// ==============================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(product) {

    const existingProduct = cart.find(
        item => item.id === product.id
    );

    if (existingProduct) {

        existingProduct.quantity =
            (existingProduct.quantity || 1) + 1;

    } else {

        cart.push({
            ...product,
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


function removeFromCart(id) {

    cart = cart.filter(
        item => item.id !== id
    );

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}


function clearCart() {

    cart = [];

    localStorage.removeItem("cart");

    updateCartCount();
}


function updateCartCount() {

    const count = cart.reduce(
        (total, item) =>
            total + (item.quantity || 1),
        0
    );

    const cartCount =
        document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = count;
    }
}


// ==============================
// LOGIN
// ==============================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const role =
                document
                    .getElementById("role")
                    .value;


            // Check role

            if (!role) {

                alert("Please select your role.");

                return;
            }


            try {

                // ==============================
                // LOGIN API
                // ==============================

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

                    const message =
                        await response.text();

                    alert(
                        message ||
                        "Invalid email, password or role."
                    );

                    return;
                }


                // ==============================
                // LOGIN SUCCESS
                // ==============================

                const user =
                    await response.json();


                // Save complete user information

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(user)
                );


                // Save role separately

                localStorage.setItem(
                    "userRole",
                    user.role
                );


                // ==============================
                // ROLE BASED REDIRECTION
                // ==============================

                if (user.role === "BUYER") {

                    window.location.href =
                        "products.html";

                }

                else if (user.role === "SELLER") {

                    window.location.href =
                        "seller.html";

                }

                else if (user.role === "ADMIN") {

                    window.location.href =
                        "admin.html";

                }

                else {

                    alert(
                        "Invalid user role."
                    );
                }

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Unable to connect to server. Please make sure Spring Boot backend is running."
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