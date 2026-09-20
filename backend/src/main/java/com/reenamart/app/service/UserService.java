package com.reenamart.app.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.reenamart.app.model.User;
import com.reenamart.app.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Register new user
    public User register(User user) {

        // Default role = BUYER
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("BUYER");
        }

        // Convert role to uppercase
        user.setRole(user.getRole().toUpperCase());

        return userRepository.save(user);
    }

    // Login using email, password and role
    public User login(String email, String password, String role) {

        User user = userRepository.findByEmail(email);

        if (user == null) {
            return null;
        }

        if (!user.getPassword().equals(password)) {
            return null;
        }

        if (user.getRole() == null) {
            return null;
        }

        if (!user.getRole().equalsIgnoreCase(role)) {
            return null;
        }

        return user;
    }

    // Update user
    public User updateUser(Long id, User user) {

        User existingUser =
                userRepository.findById(id).orElse(null);

        if (existingUser == null) {
            return null;
        }

        existingUser.setUsername(user.getUsername());

        if (user.getEmail() != null &&
                !user.getEmail().isBlank()) {

            existingUser.setEmail(user.getEmail());
        }

        if (user.getPassword() != null &&
                !user.getPassword().isBlank()) {

            existingUser.setPassword(user.getPassword());
        }

        // Update role if provided
        if (user.getRole() != null &&
                !user.getRole().isBlank()) {

            existingUser.setRole(
                    user.getRole().toUpperCase()
            );
        }

        return userRepository.save(existingUser);
    }

    // Delete user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}