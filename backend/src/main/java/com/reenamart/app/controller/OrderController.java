package com.reenamart.app.controller;

import java.util.List;

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

import com.reenamart.app.model.Order;
import com.reenamart.app.repository.OrderRepository;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {

        Order order = orderRepository.findById(id).orElse(null);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(order);
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {

        if (order.getStatus() == null || order.getStatus().isEmpty()) {
            order.setStatus("PLACED");
        }

        return orderRepository.save(order);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(
            @PathVariable Long id,
            @RequestBody Order order) {

        Order existingOrder =
                orderRepository.findById(id).orElse(null);

        if (existingOrder == null) {
            return ResponseEntity.notFound().build();
        }

        existingOrder.setCustomerName(order.getCustomerName());
        existingOrder.setMobile(order.getMobile());
        existingOrder.setAddress(order.getAddress());
        existingOrder.setCity(order.getCity());
        existingOrder.setPin(order.getPin());
        existingOrder.setPaymentMethod(order.getPaymentMethod());
        existingOrder.setStatus(order.getStatus());
        existingOrder.setProductTotal(order.getProductTotal());
        existingOrder.setDeliveryCharge(order.getDeliveryCharge());
        existingOrder.setTotal(order.getTotal());

        return ResponseEntity.ok(
                orderRepository.save(existingOrder)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {

        if (!orderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        orderRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<Order> getOrdersByStatus(
            @PathVariable String status) {

        return orderRepository.findByStatusIgnoreCase(status);
    }
}