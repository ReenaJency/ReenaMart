package com.reenamart.app;

import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.reenamart.app.model.Product;
import com.reenamart.app.model.User;
import com.reenamart.app.repository.ProductRepository;
import com.reenamart.app.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    @SuppressWarnings("unused")
    CommandLineRunner seed(
            UserRepository users,
            ProductRepository products) {

        return args -> {

            // Create a demo admin only if no admin exists.
            boolean adminExists = users.findAll()
                    .stream()
                    .anyMatch(user ->
                            "ADMIN".equalsIgnoreCase(
                                    user.getRole()
                            )
                    );

            if (!adminExists) {

                User admin = new User();

                admin.setUsername("admin1");

                admin.setEmail(
                        System.getenv().getOrDefault(
                                "REENAMART_ADMIN_EMAIL",
                                "admin@reenamart.com"
                        )
                );

                admin.setPassword(
                        System.getenv().getOrDefault(
                                "REENAMART_ADMIN_PASSWORD",
                                "admin123"
                        )
                );

                admin.setRole("ADMIN");

                users.save(admin);
            }

            // Read existing product names to prevent duplicates.
            Set<String> existingNames = new HashSet<>();

            products.findAll().forEach(product -> {

                if (product.getName() != null) {
                    existingNames.add(
                            product.getName()
                                    .trim()
                                    .toLowerCase()
                    );
                }
            });

            // Default ReenaMart products.
            Object[][] data = {

                    {
                            "Girls Dress", "Fashion",
                            500.0, 699.0, 10.0,
                            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1",
                            "S,M,L,XL", 40
                    },

                    {
                            "Boys Dress", "Fashion",
                            450.0, 649.0, 10.0,
                            "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea",
                            "S,M,L,XL", 35
                    },

                    {
                            "Open Top", "Fashion",
                            350.0, 549.0, 10.0,
                            "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3",
                            "S,M,L,XL", 30
                    },

                    {
                            "Denim Jacket", "Fashion",
                            650.0, 999.0, 15.0,
                            "https://images.unsplash.com/photo-1551028719-00167b16eac5",
                            "S,M,L,XL", 25
                    },

                    {
                            "Cotton Saree", "Fashion",
                            700.0, 1099.0, 10.0,
                            "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
                            "Free Size", 20
                    },

                    {
                            "Kurti", "Fashion",
                            450.0, 699.0, 12.0,
                            "https://images.unsplash.com/photo-1583391733956-6c78276477e2",
                            "S,M,L,XL,XXL", 35
                    },

                    {
                            "Men Shirt", "Fashion",
                            550.0, 799.0, 10.0,
                            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
                            "M,L,XL,XXL", 40
                    },

                    {
                            "Women Handbag", "Fashion",
                            600.0, 899.0, 15.0,
                            "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
                            "Free Size", 28
                    },

                    {
                            "Gold Finish Necklace", "Jewellery",
                            300.0, 499.0, 10.0,
                            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f",
                            "Free Size", 50
                    },

                    {
                            "Stud Earrings", "Jewellery",
                            150.0, 299.0, 10.0,
                            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908",
                            "Free Size", 60
                    },

                    {
                            "Bangle Set", "Jewellery",
                            250.0, 449.0, 15.0,
                            "https://images.unsplash.com/photo-1611652022419-a9419f74343d",
                            "2.4,2.6,2.8", 45
                    },

                    {
                            "Pendant Set", "Jewellery",
                            220.0, 399.0, 10.0,
                            "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
                            "Free Size", 40
                    },

                    {
                            "Smart Watch", "Electronics",
                            1200.0, 1999.0, 20.0,
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                            "Free Size", 25
                    },

                    {
                            "Wireless Earbuds", "Electronics",
                            900.0, 1499.0, 15.0,
                            "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1",
                            "Free Size", 30
                    },

                    {
                            "Bluetooth Speaker", "Electronics",
                            700.0, 1199.0, 10.0,
                            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
                            "Free Size", 20
                    },

                    {
                            "Power Bank", "Electronics",
                            600.0, 999.0, 10.0,
                            "https://images.unsplash.com/photo-1609592424841-0f5e3b2d0e3b",
                            "Free Size", 35
                    },

                    {
                            "USB Keyboard", "Electronics",
                            400.0, 699.0, 10.0,
                            "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
                            "Standard", 30
                    },

                    {
                            "Wireless Mouse", "Electronics",
                            300.0, 549.0, 10.0,
                            "https://images.unsplash.com/photo-1527814050087-3793815479db",
                            "Standard", 40
                    },

                    {
                            "Face Wash", "Beauty",
                            180.0, 299.0, 10.0,
                            "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8",
                            "100ml", 50
                    },

                    {
                            "Lipstick", "Beauty",
                            220.0, 399.0, 15.0,
                            "https://images.unsplash.com/photo-1586495777744-4413f21062fa",
                            "Standard", 45
                    },

                    {
                            "Makeup Kit", "Beauty",
                            700.0, 1199.0, 20.0,
                            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
                            "Standard", 25
                    },

                    {
                            "Hair Serum", "Beauty",
                            250.0, 449.0, 10.0,
                            "https://images.unsplash.com/photo-1522338242992-e1a54906a8da",
                            "100ml", 35
                    },

                    {
                            "Sunscreen", "Beauty",
                            300.0, 499.0, 10.0,
                            "https://images.unsplash.com/photo-1556228720-195a672e8a03",
                            "50ml", 40
                    },

                    {
                            "Moisturizer", "Beauty",
                            280.0, 449.0, 10.0,
                            "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
                            "100ml", 40
                    }
            };

            // Insert only products that do not already exist.
            for (Object[] row : data) {

                String name = (String) row[0];

                String normalizedName =
                        name.trim().toLowerCase();

                if (existingNames.contains(normalizedName)) {
                    continue;
                }

                Product product = new Product();

                product.setName(name);
                product.setCategory((String) row[1]);

                product.setSellerPrice((double) row[2]);
                product.setSellingPrice((double) row[3]);
                product.setDiscount((double) row[4]);

                product.setImageUrl((String) row[5]);
                product.setSizes((String) row[6]);
                product.setStock((int) row[7]);

                double sellingPrice =
                        product.getSellingPrice();

                double discount =
                        product.getDiscount();

                double discountAmount =
                        Math.round(
                                sellingPrice * discount
                        ) / 100.0;

                product.setDiscountAmount(discountAmount);

                double finalPrice =
                        Math.round(
                                (sellingPrice - discountAmount)
                                        * 100
                        ) / 100.0;

                product.setFinalPrice(finalPrice);

                product.setDescription(
                        name + " from ReenaMart"
                );

                product.setSellerEmail(
                        "default@reenamart.com"
                );

                product.setSellerName("ReenaMart");

                product.setShopName(
                        "ReenaMart Official"
                );

                product.setApprovalStatus("APPROVED");

                String now =
                        java.time.LocalDateTime.now().toString();

                product.setCreatedAt(now);
                product.setUpdatedAt(now);

                products.save(product);

                existingNames.add(normalizedName);
            }
        };
    }
}