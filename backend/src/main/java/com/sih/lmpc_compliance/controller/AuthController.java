package com.sih.lmpc_compliance.controller;

import com.sih.lmpc_compliance.dto.AuthRequest;
import com.sih.lmpc_compliance.dto.AuthResponse;
import com.sih.lmpc_compliance.dto.RegisterRequest;
import com.sih.lmpc_compliance.entity.User;
import com.sih.lmpc_compliance.repository.UserRepository;
import com.sih.lmpc_compliance.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(com.sih.lmpc_compliance.entity.User.UserRole.viewer)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        return ResponseEntity.ok(new AuthResponse(token, savedUser.getId(), savedUser.getEmail(), savedUser.getName(), savedUser.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        
        boolean matches = false;
        if (user != null) {
            matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        } else {
            // Mitigate timing attack
            passwordEncoder.matches(request.getPassword(), "$2a$10$wE0HqV8mK0N1jQvXgR6z0O6eX2zN9t1XhG0pB5vK2mD9kF0oI8x3e");
        }

        if (!matches || user == null) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        
        if (user.isSuspended()) {
            return ResponseEntity.status(403).body("Account is suspended");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole().name()));
    }
}
