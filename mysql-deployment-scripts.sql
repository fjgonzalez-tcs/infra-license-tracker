-- =====================================================
-- CostWatch MySQL Database Schema Creation Script
-- For Production Deployment
-- Generated: January 1, 2025
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS costwatch 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE costwatch;

-- =====================================================
-- User Management Tables
-- =====================================================

-- Sessions table for session management (if using session-based auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR(128) NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL,
    INDEX IDX_session_expire (expire)
) ENGINE=InnoDB;

-- Users table for user data (optional - remove if not using authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Service Management Tables
-- =====================================================

-- Service categories (Infrastructure, User License, Usage-based)
CREATE TABLE IF NOT EXISTS service_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Service providers (AWS, Microsoft, Adobe, etc.)
CREATE TABLE IF NOT EXISTS provider (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    website_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Individual services
CREATE TABLE IF NOT EXISTS service (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider_id INT NOT NULL,
    category_id INT NOT NULL,
    monthly_cost DECIMAL(10,2),
    billing_cycle ENUM('monthly', 'quarterly', 'annually') DEFAULT 'monthly',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES provider(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_category(id) ON DELETE CASCADE,
    INDEX idx_provider (provider_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- Infrastructure Cost Tracking
-- =====================================================

-- Infrastructure invoices and billing data
CREATE TABLE IF NOT EXISTS infra_invoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    billing_period_start DATE,
    billing_period_end DATE,
    invoice_number VARCHAR(255),
    status ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE,
    INDEX idx_service (service_id),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- License Management
-- =====================================================

-- License plans and subscriptions
CREATE TABLE IF NOT EXISTS license_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    license_count INT NOT NULL DEFAULT 1,
    cost_per_license DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    billing_cycle ENUM('monthly', 'quarterly', 'annually') DEFAULT 'monthly',
    commitment_start_date DATE NOT NULL,
    commitment_end_date DATE NOT NULL,
    auto_renewal BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE,
    INDEX idx_service (service_id),
    INDEX idx_commitment_end (commitment_end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- Usage-Based Service Tracking
-- =====================================================

-- Usage credit top-ups/purchases
CREATE TABLE IF NOT EXISTS usage_topup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    credits_purchased DECIMAL(12,2) NOT NULL,
    cost_per_credit DECIMAL(10,4) NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM('active', 'expired', 'used') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE,
    INDEX idx_service (service_id),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Usage credit consumption tracking
CREATE TABLE IF NOT EXISTS usage_consumption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    credits_consumed DECIMAL(12,2) NOT NULL,
    consumption_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE,
    INDEX idx_service (service_id),
    INDEX idx_consumption_date (consumption_date)
) ENGINE=InnoDB;

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Default service categories
INSERT INTO service_category (name, description) VALUES 
('Infrastructure', 'Cloud infrastructure services like compute, storage, networking'),
('User License', 'Per-user software licenses and subscriptions'),
('Usage-based', 'Pay-per-use services like API calls, storage usage, etc.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Sample providers (uncomment if needed)
/*
INSERT INTO provider (name, description, website_url) VALUES 
('Amazon Web Services', 'Cloud computing services', 'https://aws.amazon.com'),
('Microsoft', 'Software and cloud services', 'https://microsoft.com'),
('Adobe', 'Creative software and services', 'https://adobe.com'),
('Google', 'Cloud and productivity services', 'https://google.com'),
('OpenAI', 'AI and machine learning APIs', 'https://openai.com')
ON DUPLICATE KEY UPDATE description = VALUES(description);
*/

-- =====================================================
-- Useful Views for Reporting
-- =====================================================

-- Monthly spending summary view
CREATE OR REPLACE VIEW monthly_spending_summary AS
SELECT 
    YEAR(ii.invoice_date) as year,
    MONTH(ii.invoice_date) as month,
    sc.name as category_name,
    p.name as provider_name,
    SUM(ii.amount) as total_amount,
    COUNT(*) as invoice_count
FROM infra_invoice ii
JOIN service s ON ii.service_id = s.id
JOIN service_category sc ON s.category_id = sc.id
JOIN provider p ON s.provider_id = p.id
WHERE ii.status = 'paid'
GROUP BY YEAR(ii.invoice_date), MONTH(ii.invoice_date), sc.name, p.name
ORDER BY year DESC, month DESC, total_amount DESC;

-- License expiration alerts view
CREATE OR REPLACE VIEW license_expiration_alerts AS
SELECT 
    lp.id,
    s.name as service_name,
    p.name as provider_name,
    lp.plan_name,
    lp.commitment_end_date,
    DATEDIFF(lp.commitment_end_date, CURDATE()) as days_until_expiry,
    lp.total_cost,
    lp.auto_renewal
FROM license_plan lp
JOIN service s ON lp.service_id = s.id
JOIN provider p ON s.provider_id = p.id
WHERE lp.status = 'active' 
    AND lp.commitment_end_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
ORDER BY lp.commitment_end_date ASC;

-- Usage balance summary view
CREATE OR REPLACE VIEW usage_balance_summary AS
SELECT 
    s.id as service_id,
    s.name as service_name,
    p.name as provider_name,
    COALESCE(SUM(ut.credits_purchased), 0) as total_credits_purchased,
    COALESCE(SUM(uc.credits_consumed), 0) as total_credits_consumed,
    COALESCE(SUM(ut.credits_purchased), 0) - COALESCE(SUM(uc.credits_consumed), 0) as current_balance,
    COALESCE(SUM(ut.amount), 0) as total_amount_spent
FROM service s
JOIN provider p ON s.provider_id = p.id
LEFT JOIN usage_topup ut ON s.id = ut.service_id AND ut.status = 'active'
LEFT JOIN usage_consumption uc ON s.id = uc.service_id
WHERE s.category_id = (SELECT id FROM service_category WHERE name = 'Usage-based')
GROUP BY s.id, s.name, p.name
HAVING total_credits_purchased > 0 OR total_credits_consumed > 0
ORDER BY current_balance ASC;

-- =====================================================
-- Performance Indexes for Common Queries
-- =====================================================

-- Composite indexes for common dashboard queries
CREATE INDEX idx_invoice_date_service ON infra_invoice(invoice_date, service_id);
CREATE INDEX idx_service_provider_category ON service(provider_id, category_id);
CREATE INDEX idx_license_dates_status ON license_plan(commitment_start_date, commitment_end_date, status);
CREATE INDEX idx_usage_service_date ON usage_consumption(service_id, consumption_date);

-- =====================================================
-- Database Setup Complete
-- =====================================================

SHOW TABLES;
SELECT 'CostWatch MySQL database schema created successfully!' AS status;