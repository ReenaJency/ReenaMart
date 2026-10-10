package com.reenamart.app.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reenamart.app.model.Order;
import com.reenamart.app.model.OrderItem;
import com.reenamart.app.model.Product;
import com.reenamart.app.repository.OrderRepository;
import com.reenamart.app.repository.ProductRepository;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Order createOrder(Order order) {

        if (order == null) {
            throw new IllegalArgumentException(
                    "Order information is required."
            );
        }

        if (order.getCustomerName() == null
                || order.getCustomerName().isBlank()) {
            throw new IllegalArgumentException(
                    "Customer name is required."
            );
        }

        if (order.getEmail() == null
                || !order.getEmail().matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException(
                    "A valid email is required."
            );
        }

        if (order.getMobile() == null
                || order.getMobile().isBlank()) {
            throw new IllegalArgumentException(
                    "Mobile number is required."
            );
        }

        if (order.getAddress() == null
                || order.getAddress().isBlank()) {
            throw new IllegalArgumentException(
                    "Delivery address is required."
            );
        }

        if (order.getProducts() == null
                || order.getProducts().isEmpty()) {
            throw new IllegalArgumentException(
                    "Order must contain at least one product."
            );
        }

        List<OrderItem> requestedItems =
                new ArrayList<>(order.getProducts());

        List<OrderItem> verifiedItems = new ArrayList<>();

        double subtotal = 0;

        // Validate every product using database information.
        for (OrderItem requested : requestedItems) {

            if (requested == null
                    || requested.getProductId() == null) {
                throw new IllegalArgumentException(
                        "A valid product ID is required."
                );
            }

            int quantity = requested.getQuantity();

            if (quantity <= 0) {
                throw new IllegalArgumentException(
                        "Product quantity must be greater than zero."
                );
            }

            Product product = productRepository
                    .findById(requested.getProductId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Product not found: "
                                            + requested.getProductId()
                            )
                    );

            if (!"APPROVED".equalsIgnoreCase(
                    product.getApprovalStatus())) {
                throw new IllegalArgumentException(
                        product.getName()
                                + " is not approved for sale."
                );
            }

            if (product.getStock() < quantity) {
                throw new IllegalArgumentException(
                        "Insufficient stock for "
                                + product.getName()
                );
            }

            String selectedSize = requested.getSize();

            boolean fashionProduct =
                    product.getCategory() != null
                    && product.getCategory()
                            .toLowerCase()
                            .contains("fashion");

            // Validate size for Fashion products.
            if (fashionProduct) {

                if (selectedSize == null
                        || selectedSize.isBlank()) {
                    throw new IllegalArgumentException(
                            "Please select a size for "
                                    + product.getName()
                    );
                }

                // Final local variable fixes the lambda error.
                final String sizeToCheck = selectedSize.trim();

                String availableSizes = product.getSizes();

                if (availableSizes != null
                        && !availableSizes.isBlank()) {

                    boolean sizeAvailable =
                            java.util.Arrays.stream(
                                    availableSizes.split(","))
                                    .map(String::trim)
                                    .anyMatch(size ->
                                            size.equalsIgnoreCase(
                                                    sizeToCheck
                                            ));

                    if (!sizeAvailable) {
                        throw new IllegalArgumentException(
                                "Selected size is not available for "
                                        + product.getName()
                        );
                    }
                }

                selectedSize = sizeToCheck;

            } else {
                selectedSize = null;
            }

            // Get the final product price from the database.
            double price = product.getFinalPrice();

            if (price <= 0) {
                price = product.getSellingPrice();
            }

            if (price <= 0) {
                throw new IllegalArgumentException(
                        "Product price is invalid for "
                                + product.getName()
                );
            }

            price = round(price);

            OrderItem verified = new OrderItem();

            verified.setProductId(product.getId());
            verified.setProductName(product.getName());
            verified.setSize(selectedSize);
            verified.setPrice(price);
            verified.setQuantity(quantity);
            verified.setOrder(order);

            verifiedItems.add(verified);

            subtotal += price * quantity;
        }

        subtotal = round(subtotal);

        // Calculate the order total on the backend.
        order.setSubtotal(subtotal);
        order.setDiscount(0);
        order.setTotal(subtotal);

        order.setProducts(verifiedItems);

        order.setOrderId(
                "RM-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        order.setStatus("PLACED");
        order.setOrderDate(LocalDateTime.now());

        // Reduce stock after all requested items are validated.
        for (OrderItem item : verifiedItems) {

            Product product = productRepository
                    .findById(item.getProductId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Product no longer exists."
                            )
                    );

            product.setStock(
                    product.getStock() - item.getQuantity()
            );

            product.setUpdatedAt(
                    LocalDateTime.now().toString()
            );

            productRepository.save(product);
        }

        return orderRepository.save(order);
    }

    public Order updateOrder(
            Long id,
            Order updated) {

        Order order = orderRepository.findById(id)
                .orElse(null);

        if (order == null) {
            return null;
        }

        if (updated.getStatus() != null
                && !updated.getStatus().isBlank()) {

            order.setStatus(
                    updated.getStatus()
                            .trim()
                            .toUpperCase()
            );
        }

        if (updated.getPaymentMethod() != null) {
            order.setPaymentMethod(
                    updated.getPaymentMethod()
            );
        }

        if (updated.getAddress() != null) {
            order.setAddress(updated.getAddress());
        }

        if (updated.getCity() != null) {
            order.setCity(updated.getCity());
        }

        if (updated.getState() != null) {
            order.setState(updated.getState());
        }

        if (updated.getPincode() != null) {
            order.setPincode(updated.getPincode());
        }

        if (updated.getMobile() != null) {
            order.setMobile(updated.getMobile());
        }

        return orderRepository.save(order);
    }

    public boolean deleteOrder(Long id) {

        if (!orderRepository.existsById(id)) {
            return false;
        }

        orderRepository.deleteById(id);

        return true;
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatusIgnoreCase(status);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}