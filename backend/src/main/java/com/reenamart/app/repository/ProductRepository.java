package com.reenamart.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reenamart.app.model.Product;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    List<Product> findByApprovalStatusIgnoreCase(
        String status
    );

    List<Product> findBySellerEmailIgnoreCase(
        String email
    );

    List<Product> findByCategoryIgnoreCase(
        String category
    );
}