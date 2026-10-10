package com.reenamart.app.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reenamart.app.model.Seller;
import com.reenamart.app.repository.SellerRepository;

@Service
@Transactional
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerService(SellerRepository sellerRepository) {
        this.sellerRepository = sellerRepository;
    }

    @Transactional(readOnly = true)
    public List<Seller> getAllSellers() {
        return sellerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Seller getSellerById(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Seller not found.")
                );
    }

    @Transactional(readOnly = true)
    public Seller getSellerByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Seller email is required.");
        }

        return sellerRepository.findFirstByEmailIgnoreCase(
                normalizeEmail(email)
        ).orElseThrow(() ->
                new IllegalArgumentException("Seller not found.")
        );
    }

    public Seller registerSeller(Seller seller) {
        if (seller == null) {
            throw new IllegalArgumentException(
                    "Seller information is required."
            );
        }

        if (seller.getUsername() == null
                || seller.getUsername().isBlank()) {
            throw new IllegalArgumentException("Seller name is required.");
        }

        if (seller.getEmail() == null
                || seller.getEmail().isBlank()) {
            throw new IllegalArgumentException("Seller email is required.");
        }

        if (seller.getPhone() == null
                || seller.getPhone().isBlank()) {
            throw new IllegalArgumentException("Phone number is required.");
        }

        if (seller.getBusinessName() == null
                || seller.getBusinessName().isBlank()) {
            throw new IllegalArgumentException("Shop name is required.");
        }

        if (seller.getCategory() == null
                || seller.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category is required.");
        }

        String email = normalizeEmail(seller.getEmail());

        if (sellerRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "Seller already exists with this email."
            );
        }

        seller.setUsername(seller.getUsername().trim());
        seller.setEmail(email);
        seller.setBusinessName(seller.getBusinessName().trim());

        // Seller can log in; products require separate admin approval.
        seller.setApprovalStatus("APPROVED");

        return sellerRepository.save(seller);
    }

    public Seller updateSeller(Long id, Seller updatedSeller) {
        if (updatedSeller == null) {
            throw new IllegalArgumentException(
                    "Seller information is required."
            );
        }

        Seller seller = getSellerById(id);

        if (updatedSeller.getUsername() != null
                && !updatedSeller.getUsername().isBlank()) {
            seller.setUsername(updatedSeller.getUsername().trim());
        }

        if (updatedSeller.getEmail() != null
                && !updatedSeller.getEmail().isBlank()) {

            String email = normalizeEmail(updatedSeller.getEmail());

            Seller existing = sellerRepository.findFirstByEmailIgnoreCase(email)
                    .orElse(null);

            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException(
                        "Email already used by another seller."
                );
            }

            seller.setEmail(email);
        }

        if (updatedSeller.getPhone() != null) {
            seller.setPhone(updatedSeller.getPhone());
        }

        if (updatedSeller.getBusinessName() != null) {
            seller.setBusinessName(updatedSeller.getBusinessName());
        }

        if (updatedSeller.getCategory() != null) {
            seller.setCategory(updatedSeller.getCategory());
        }

        return sellerRepository.save(seller);
    }

    public void deleteSeller(Long id) {
        if (!sellerRepository.existsById(id)) {
            throw new IllegalArgumentException("Seller not found.");
        }

        sellerRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Seller> getSellersByApprovalStatus(String status) {
        return sellerRepository.findByApprovalStatusIgnoreCase(status);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}