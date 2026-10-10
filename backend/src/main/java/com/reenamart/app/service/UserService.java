package com.reenamart.app.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.reenamart.app.model.User;
import com.reenamart.app.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public List<User> getAllUsers() {
        return repository.findAll();
    }

    public User getUserById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public User registerBuyer(User user) {
        return register(user, "BUYER");
    }

    public User registerSeller(User user) {
        return register(user, "SELLER");
    }

    public User register(User user) {
        String role = user == null || user.getRole() == null
                || user.getRole().isBlank()
                ? "BUYER"
                : user.getRole().trim().toUpperCase(Locale.ROOT);

        if (!role.equals("BUYER") && !role.equals("SELLER")) {
            throw new IllegalArgumentException(
                    "Only Buyer or Seller registration is allowed."
            );
        }

        return register(user, role);
    }

    private User register(User user, String role) {
        validate(user);

        String email = normalizeEmail(user.getEmail());

        if (repository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "Email already registered."
            );
        }

        user.setUsername(user.getUsername().trim());
        user.setEmail(email);
        user.setRole(role);

        return repository.save(user);
    }

    public User loginBuyer(String email, String password) {
        return loginWithRole(email, password, "BUYER");
    }

    public User loginSeller(String email, String password) {
        return loginWithRole(email, password, "SELLER");
    }

    public User loginAdmin(String email, String password) {
        return loginWithRole(email, password, "ADMIN");
    }

    public User login(String email, String password, String role) {
        String selectedRole = role == null
                ? "BUYER"
                : role.trim().toUpperCase(Locale.ROOT);

        return switch (selectedRole) {
            case "BUYER" -> loginBuyer(email, password);
            case "SELLER" -> loginSeller(email, password);
            case "ADMIN" -> loginAdmin(email, password);
            default -> throw new IllegalArgumentException(
                    "Invalid user role."
            );
        };
    }

    private User loginWithRole(
            String email,
            String password,
            String expectedRole) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }

        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }

        User user = repository.findFirstByEmailIgnoreCase(
                normalizeEmail(email)
        ).orElse(null);

        if (user == null || !password.equals(user.getPassword())) {
            throw new IllegalArgumentException(
                    "Invalid email or password."
            );
        }

        if (user.getRole() == null
                || !expectedRole.equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException(
                    "This account is not registered as "
                            + expectedRole + "."
            );
        }

        return user;
    }

    public User updateUser(Long id, User updated) {
        User user = repository.findById(id).orElse(null);

        if (user == null) {
            return null;
        }

        if (updated.getUsername() != null
                && !updated.getUsername().isBlank()) {
            user.setUsername(updated.getUsername().trim());
        }

        if (updated.getEmail() != null
                && !updated.getEmail().isBlank()) {

            String email = normalizeEmail(updated.getEmail());

            User existing = repository.findFirstByEmailIgnoreCase(email)
                    .orElse(null);

            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException(
                        "Email already registered."
                );
            }

            user.setEmail(email);
        }

        if (updated.getPassword() != null
                && !updated.getPassword().isBlank()) {

            if (updated.getPassword().length() < 6) {
                throw new IllegalArgumentException(
                        "Password must contain at least 6 characters."
                );
            }

            user.setPassword(updated.getPassword());
        }

        return repository.save(user);
    }

    public void deleteUser(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("User not found.");
        }

        repository.deleteById(id);
    }

    private void validate(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User data is required.");
        }

        if (user.getUsername() == null
                || user.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }

        if (user.getEmail() == null
                || !user.getEmail().matches(
                        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException(
                    "Please enter a valid email."
            );
        }

        if (user.getPassword() == null
                || user.getPassword().length() < 6) {
            throw new IllegalArgumentException(
                    "Password must contain at least 6 characters."
            );
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}