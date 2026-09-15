package com.reenamart.app.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.reenamart.app.model.Product;
import com.reenamart.app.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    public Product addProduct(Product product) {
        return repository.save(product);
    }
}