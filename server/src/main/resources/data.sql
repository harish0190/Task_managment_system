-- Migrate legacy roles if they exist
UPDATE users SET role = 'ROLE_EMPLOYEE' WHERE role = 'ROLE_MEMBER';

-- Default Users
-- Passwords are BCrypt hashes of 'password123'
INSERT IGNORE INTO users (username, password, role) VALUES ('manager', '$2a$10$8.UnVuG9shgD3W9tfJUXLuE4FahpFYMxngbcNoY8BIsCfayO4w8vO', 'ROLE_MANAGER');
INSERT IGNORE INTO users (username, password, role) VALUES ('employee', '$2a$10$8.UnVuG9shgD3W9tfJUXLuE4FahpFYMxngbcNoY8BIsCfayO4w8vO', 'ROLE_EMPLOYEE');
