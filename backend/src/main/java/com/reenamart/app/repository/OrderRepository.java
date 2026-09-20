package com.reenamart.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reenamart.app.model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatusIgnoreCase(String status);
}