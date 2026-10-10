package com.reenamart.app.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reenamart.app.model.User;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findFirstByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);
}