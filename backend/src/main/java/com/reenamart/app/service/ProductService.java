package com.reenamart.app.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reenamart.app.model.Product;
import com.reenamart.app.repository.ProductRepository;

@Service
@Transactional
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Product not found.")
                );
    }

    public Product addProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException(
                    "Product information is required."
            );
        }

        if (product.getName() == null
                || product.getName().isBlank()) {
            throw new IllegalArgumentException(
                    "Product name is required."
            );
        }

        if (product.getSellerPrice() <= 0) {
            throw new IllegalArgumentException(
                    "Seller price must be greater than zero."
            );
        }

        if (product.getStock() <= 0) {
            throw new IllegalArgumentException(
                    "Stock must be greater than zero."
            );
        }

        product.setName(product.getName().trim());
        product.setSellerPrice(round(product.getSellerPrice()));

        product.setSellingPrice(0);
        product.setDiscount(0);
        product.setDiscountAmount(0);
        product.setFinalPrice(0);
        product.setApprovalStatus("PENDING");

        if (product.getSizes() == null
                || product.getSizes().isBlank()) {
            product.setSizes("S,M,L,XL,XXL");
        }

        String now = LocalDateTime.now().toString();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);

        return repository.save(product);
    }

    public Product updateProduct(Long id, Product updatedProduct) {
        if (updatedProduct == null) {
            throw new IllegalArgumentException(
                    "Updated product information is required."
            );
        }

        Product product = getProductById(id);

        if (updatedProduct.getName() != null
                && !updatedProduct.getName().isBlank()) {
            product.setName(updatedProduct.getName().trim());
        }

        product.setDescription(updatedProduct.getDescription());
        product.setCategory(updatedProduct.getCategory());
        product.setImageUrl(updatedProduct.getImageUrl());
        product.setSizes(updatedProduct.getSizes());

        if (updatedProduct.getSellerPrice() > 0) {
            product.setSellerPrice(
                    round(updatedProduct.getSellerPrice())
            );
        }

        if (updatedProduct.getStock() >= 0) {
            product.setStock(updatedProduct.getStock());
        }

        product.setUpdatedAt(LocalDateTime.now().toString());

        return repository.save(product);
    }

    public Product updateAdminPrice(
            Long id,
            double sellingPrice,
            double discount) {

        Product product = getProductById(id);

        if (sellingPrice <= 0) {
            throw new IllegalArgumentException(
                    "Selling price must be greater than zero."
            );
        }

        if (discount < 0 || discount > 100) {
            throw new IllegalArgumentException(
                    "Discount must be between 0 and 100."
            );
        }

        sellingPrice = round(sellingPrice);
        discount = round(discount);

        double discountAmount = round(
                sellingPrice * discount / 100
        );

        product.setSellingPrice(sellingPrice);
        product.setDiscount(discount);
        product.setDiscountAmount(discountAmount);
        product.setFinalPrice(round(sellingPrice - discountAmount));
        product.setUpdatedAt(LocalDateTime.now().toString());

        return repository.save(product);
    }

    public Product approveProduct(Long id) {
        Product product = getProductById(id);

        if (product.getSellingPrice() <= 0) {
            double defaultSellingPrice = round(product.getSellerPrice() > 0 ? product.getSellerPrice() * 1.25 : 499.0);
            double defaultDiscount = 10.0;
            double discountAmount = round(defaultSellingPrice * (defaultDiscount / 100));

            product.setSellingPrice(defaultSellingPrice);
            product.setDiscount(defaultDiscount);
            product.setDiscountAmount(discountAmount);
            product.setFinalPrice(round(defaultSellingPrice - discountAmount));
        }

        product.setApprovalStatus("APPROVED");
        product.setUpdatedAt(LocalDateTime.now().toString());

        return repository.save(product);
    }

    public Product rejectProduct(Long id) {
        Product product = getProductById(id);

        product.setApprovalStatus("REJECTED");
        product.setUpdatedAt(LocalDateTime.now().toString());

        return repository.save(product);
    }

    public void deleteProduct(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Product not found.");
        }

        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(String keyword) {
        String search = keyword == null
                ? ""
                : keyword.trim().toLowerCase(Locale.ROOT);

        return repository.findAll().stream()
                .filter(product ->
                        contains(product.getName(), search)
                        || contains(product.getCategory(), search)
                        || contains(product.getDescription(), search))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(String category) {
        return repository.findByCategoryIgnoreCase(category);
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsBySeller(String sellerEmail) {
        return repository.findBySellerEmailIgnoreCase(sellerEmail);
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsByApprovalStatus(String status) {
        return repository.findByApprovalStatusIgnoreCase(status);
    }

    private boolean contains(String value, String search) {
        return value != null
                && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}