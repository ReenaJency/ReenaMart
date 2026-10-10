package com.reenamart.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reenamart.app.model.Seller;

public interface SellerRepository
        extends JpaRepository<Seller, Long> {

    Optional<Seller> findByEmailIgnoreCase(String email);

    Optional<Seller> findFirstByEmailIgnoreCase(String email);

    List<Seller> findByApprovalStatusIgnoreCase(
        String status
    );

    boolean existsByEmailIgnoreCase(String email);
}