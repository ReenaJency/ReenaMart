package com.reenamart.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reenamart.app.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}