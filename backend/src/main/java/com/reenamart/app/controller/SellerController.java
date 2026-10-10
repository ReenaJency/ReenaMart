package com.reenamart.app.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reenamart.app.model.Seller;
import com.reenamart.app.service.SellerService;

@RestController
@RequestMapping("/api/sellers")
@CrossOrigin(origins = "*")
public class SellerController {

    private final SellerService service;

    public SellerController(SellerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Seller> getAllSellers() {
        return service.getAllSellers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSeller(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getSellerById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getSellerByEmail(
            @PathVariable String email) {
        try {
            return ResponseEntity.ok(service.getSellerByEmail(email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/status/{status}")
    public List<Seller> getByStatus(@PathVariable String status) {
        return service.getSellersByApprovalStatus(status);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Seller seller) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(service.registerSeller(seller));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Seller seller) {
        try {
            return ResponseEntity.ok(
                    service.updateSeller(id, seller)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteSeller(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}