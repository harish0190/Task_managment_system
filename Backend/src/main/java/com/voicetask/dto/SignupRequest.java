package com.voicetask.dto;

import jakarta.validation.constraints.NotBlank;

public class SignupRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    private String role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
