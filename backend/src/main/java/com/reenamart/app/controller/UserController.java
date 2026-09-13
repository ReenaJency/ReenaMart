package com.reenamart.app.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reenamart.app.model.User;
import com.reenamart.app.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String test() {
        return "User API is working!";
    }

    @PostMapping("/login")
    public User login(@RequestBody User user) {
        return userService.login(
            user.getUsername(),
            user.getPassword()
        );
    }
}