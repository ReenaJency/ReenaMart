package com.reenamart.app.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.reenamart.app.model.Product;
import com.reenamart.app.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    // Get all products
    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    // Get product by ID
    public Product getProductById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // Add product
    public Product addProduct(Product product) {
        return repository.save(product);
    }

    // Update product
    public Product updateProduct(Long id, Product product) {

        Product existingProduct =
                repository.findById(id).orElse(null);

        if (existingProduct == null) {
            return null;
        }

        existingProduct.setName(product.getName());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setCategory(product.getCategory());
        existingProduct.setDescription(product.getDescription());

        return repository.save(existingProduct);
    }

    // Delete product
    public boolean deleteProduct(Long id) {

        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);
        return true;
    }

    // Search products
    public List<Product> searchProducts(String keyword) {

        String searchKeyword = keyword.toLowerCase();

        return repository.findAll()
                .stream()
                .filter(product ->
                        (product.getName() != null &&
                         product.getName()
                                .toLowerCase()
                                .contains(searchKeyword))
                        ||
                        (product.getCategory() != null &&
                         product.getCategory()
                                .toLowerCase()
                                .contains(searchKeyword))
                )
                .collect(Collectors.toList());
    }

    // Get products by category
    public List<Product> getProductsByCategory(String category) {

        String searchCategory = category.toLowerCase();

        return repository.findAll()
                .stream()
                .filter(product ->
                        product.getCategory() != null &&
                        product.getCategory()
                                .toLowerCase()
                                .equals(searchCategory)
                )
                .collect(Collectors.toList());
    }
}