package com.reenamart.app.service;

import com.reenamart.app.model.Order;
import com.reenamart.app.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Get all orders
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // Get order by ID
    public Order getOrderById(Long id) {

        Optional<Order> order =
                orderRepository.findById(id);

        return order.orElse(null);
    }

    // Create new order
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    // Update order
    public Order updateOrder(Long id, Order orderDetails) {

        Optional<Order> existingOrder =
                orderRepository.findById(id);

        if (existingOrder.isEmpty()) {
            return null;
        }

        Order order = existingOrder.get();

        order.setStatus(orderDetails.getStatus());

        return orderRepository.save(order);
    }

    // Delete order
    public boolean deleteOrder(Long id) {

        if (!orderRepository.existsById(id)) {
            return false;
        }

        orderRepository.deleteById(id);

        return true;
    }

    // Get orders by status
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatusIgnoreCase(status);
    }
}