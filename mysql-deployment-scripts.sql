-- =====================================================
-- CostWatch MySQL Database Schema Creation Script
-- For Production Deployment
-- Updated: July 1, 2025 with sis_costs_ prefix and mnemonic columns
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS costwatch 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE costwatch;

-- =====================================================
-- User Management Tables (Optional - Authentication Removed)
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
-- Service Management Tables with sis_costs_ prefix
-- =====================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS sis_costs_usage_consumption;
DROP TABLE IF EXISTS sis_costs_usage_topup;
DROP TABLE IF EXISTS sis_costs_license_plan;
DROP TABLE IF EXISTS sis_costs_infra_invoice;
DROP TABLE IF EXISTS sis_costs_service;
DROP TABLE IF EXISTS sis_costs_provider;
DROP TABLE IF EXISTS sis_costs_service_category;

-- Service categories table (scsc prefix)
CREATE TABLE sis_costs_service_category (
    scsc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scsc_name VARCHAR(64) NOT NULL UNIQUE,
    scsc_description TEXT,
    scsc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scsc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scsc_name (scsc_name)
) ENGINE=InnoDB;

-- Service providers table (scp prefix) 
CREATE TABLE sis_costs_provider (
    scp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scp_name VARCHAR(128) NOT NULL UNIQUE,
    scp_website VARCHAR(255),
    scp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scp_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scp_name (scp_name)
) ENGINE=InnoDB;

-- Services table (scs prefix)
CREATE TABLE sis_costs_service (
    scs_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scs_provider_id BIGINT NOT NULL,
    scs_category_id BIGINT NOT NULL,
    scs_name VARCHAR(128) NOT NULL,
    scs_description TEXT,
    scs_active BOOLEAN DEFAULT TRUE,
    scs_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scs_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scs_provider_id) REFERENCES sis_costs_provider(scp_id) ON DELETE CASCADE,
    FOREIGN KEY (scs_category_id) REFERENCES sis_costs_service_category(scsc_id) ON DELETE CASCADE,
    INDEX idx_scs_provider (scs_provider_id),
    INDEX idx_scs_category (scs_category_id),
    INDEX idx_scs_name (scs_name),
    INDEX idx_scs_active (scs_active)
) ENGINE=InnoDB;

-- =====================================================
-- Cost Tracking Tables
-- =====================================================

-- Infrastructure invoices table (scii prefix)
CREATE TABLE sis_costs_infra_invoice (
    scii_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scii_service_id BIGINT NOT NULL,
    scii_invoice_month DATE NOT NULL,
    scii_amount DECIMAL(12,2) NOT NULL,
    scii_currency CHAR(3) DEFAULT 'USD',
    scii_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scii_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scii_service_id) REFERENCES sis_costs_service(scs_id) ON DELETE CASCADE,
    INDEX idx_scii_service (scii_service_id),
    INDEX idx_scii_month (scii_invoice_month),
    INDEX idx_scii_service_month (scii_service_id, scii_invoice_month)
) ENGINE=InnoDB;

-- License plans table (sclp prefix)
CREATE TABLE sis_costs_license_plan (
    sclp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sclp_service_id BIGINT NOT NULL,
    sclp_monthly_unit_cost DECIMAL(12,2) NOT NULL,
    sclp_qty INT NOT NULL DEFAULT 1,
    sclp_start_month DATE NOT NULL,
    sclp_end_month DATE,
    sclp_annual_commitment_end DATE,
    sclp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sclp_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sclp_service_id) REFERENCES sis_costs_service(scs_id) ON DELETE CASCADE,
    INDEX idx_sclp_service (sclp_service_id),
    INDEX idx_sclp_dates (sclp_start_month, sclp_end_month),
    INDEX idx_sclp_commitment (sclp_annual_commitment_end)
) ENGINE=InnoDB;

-- Usage topup table (scut prefix)
CREATE TABLE sis_costs_usage_topup (
    scut_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scut_service_id BIGINT NOT NULL,
    scut_topup_date DATE NOT NULL,
    scut_amount_purchased DECIMAL(12,2) NOT NULL,
    scut_currency CHAR(3) DEFAULT 'USD',
    scut_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scut_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scut_service_id) REFERENCES sis_costs_service(scs_id) ON DELETE CASCADE,
    INDEX idx_scut_service (scut_service_id),
    INDEX idx_scut_date (scut_topup_date)
) ENGINE=InnoDB;

-- Usage consumption table (scuc prefix)
CREATE TABLE sis_costs_usage_consumption (
    scuc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scuc_service_id BIGINT NOT NULL,
    scuc_consumption_date DATE NOT NULL,
    scuc_amount_consumed DECIMAL(12,2) NOT NULL,
    scuc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scuc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scuc_service_id) REFERENCES sis_costs_service(scs_id) ON DELETE CASCADE,
    INDEX idx_scuc_service (scuc_service_id),
    INDEX idx_scuc_date (scuc_consumption_date),
    INDEX idx_scuc_service_date (scuc_service_id, scuc_consumption_date)
) ENGINE=InnoDB;

-- =====================================================
-- Useful Views for Reporting
-- =====================================================

-- Monthly infrastructure costs by category
CREATE OR REPLACE VIEW v_monthly_infra_costs AS
SELECT 
    YEAR(scii.scii_invoice_month) as cost_year,
    MONTH(scii.scii_invoice_month) as cost_month,
    scsc.scsc_name as category_name,
    scp.scp_name as provider_name,
    scs.scs_name as service_name,
    SUM(scii.scii_amount) as total_amount,
    scii.scii_currency
FROM sis_costs_infra_invoice scii
JOIN sis_costs_service scs ON scii.scii_service_id = scs.scs_id
JOIN sis_costs_provider scp ON scs.scs_provider_id = scp.scp_id
JOIN sis_costs_service_category scsc ON scs.scs_category_id = scsc.scsc_id
WHERE scs.scs_active = TRUE
GROUP BY cost_year, cost_month, scsc.scsc_name, scp.scp_name, scs.scs_name, scii.scii_currency
ORDER BY cost_year DESC, cost_month DESC, total_amount DESC;

-- Current active licenses with costs
CREATE OR REPLACE VIEW v_active_licenses AS
SELECT 
    scs.scs_name as service_name,
    scp.scp_name as provider_name,
    scsc.scsc_name as category_name,
    sclp.sclp_monthly_unit_cost,
    sclp.sclp_qty,
    (sclp.sclp_monthly_unit_cost * sclp.sclp_qty) as monthly_total,
    sclp.sclp_start_month,
    sclp.sclp_end_month,
    sclp.sclp_annual_commitment_end,
    CASE 
        WHEN sclp.sclp_end_month IS NULL THEN 'Ongoing'
        WHEN sclp.sclp_end_month > CURDATE() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM sis_costs_license_plan sclp
JOIN sis_costs_service scs ON sclp.sclp_service_id = scs.scs_id
JOIN sis_costs_provider scp ON scs.scs_provider_id = scp.scp_id
JOIN sis_costs_service_category scsc ON scs.scs_category_id = scsc.scsc_id
WHERE scs.scs_active = TRUE
ORDER BY monthly_total DESC;

-- Usage balance summary
CREATE OR REPLACE VIEW v_usage_balance AS
SELECT 
    scs.scs_name as service_name,
    scp.scp_name as provider_name,
    COALESCE(SUM(scut.scut_amount_purchased), 0) as total_purchased,
    COALESCE(SUM(scuc.scuc_amount_consumed), 0) as total_consumed,
    (COALESCE(SUM(scut.scut_amount_purchased), 0) - COALESCE(SUM(scuc.scuc_amount_consumed), 0)) as balance
FROM sis_costs_service scs
JOIN sis_costs_provider scp ON scs.scs_provider_id = scp.scp_id
LEFT JOIN sis_costs_usage_topup scut ON scs.scs_id = scut.scut_service_id
LEFT JOIN sis_costs_usage_consumption scuc ON scs.scs_id = scuc.scuc_service_id
WHERE scs.scs_active = TRUE
GROUP BY scs.scs_id, scs.scs_name, scp.scp_name
HAVING total_purchased > 0 OR total_consumed > 0
ORDER BY balance ASC;

-- =====================================================
-- Sample Data (Optional - Remove in Production)
-- =====================================================

-- Insert sample service categories
INSERT IGNORE INTO sis_costs_service_category (scsc_name, scsc_description) VALUES
('Infrastructure', 'Cloud infrastructure and hosting services'),
('User License', 'Per-user software licenses and subscriptions'),
('Usage-based', 'Pay-per-use services and consumption-based billing');

-- Insert sample providers
INSERT IGNORE INTO sis_costs_provider (scp_name, scp_website) VALUES
('Amazon Web Services', 'https://aws.amazon.com'),
('Microsoft Azure', 'https://azure.microsoft.com'),
('Adobe', 'https://adobe.com'),
('Slack', 'https://slack.com'),
('GitHub', 'https://github.com');

-- Insert sample services
INSERT IGNORE INTO sis_costs_service (scs_provider_id, scs_category_id, scs_name, scs_description) VALUES
(1, 1, 'EC2 Compute', 'Virtual servers and compute instances'),
(1, 3, 'S3 Storage', 'Object storage service'),
(2, 1, 'Virtual Machines', 'Azure virtual machine instances'),
(3, 2, 'Creative Cloud', 'Adobe Creative Cloud licenses'),
(4, 2, 'Slack Pro', 'Slack professional workspace'),
(5, 2, 'GitHub Enterprise', 'GitHub enterprise licenses');

-- =====================================================
-- Performance Optimization
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_scii_month_service ON sis_costs_infra_invoice(scii_invoice_month, scii_service_id);
CREATE INDEX idx_sclp_active_dates ON sis_costs_license_plan(sclp_start_month, sclp_end_month, sclp_service_id);
CREATE INDEX idx_scuc_month_service ON sis_costs_usage_consumption(scuc_consumption_date, scuc_service_id);

-- =====================================================
-- Database Constraints and Triggers
-- =====================================================

-- Ensure positive amounts
ALTER TABLE sis_costs_infra_invoice ADD CONSTRAINT chk_scii_positive_amount CHECK (scii_amount > 0);
ALTER TABLE sis_costs_license_plan ADD CONSTRAINT chk_sclp_positive_cost CHECK (sclp_monthly_unit_cost > 0);
ALTER TABLE sis_costs_license_plan ADD CONSTRAINT chk_sclp_positive_qty CHECK (sclp_qty > 0);
ALTER TABLE sis_costs_usage_topup ADD CONSTRAINT chk_scut_positive_amount CHECK (scut_amount_purchased > 0);
ALTER TABLE sis_costs_usage_consumption ADD CONSTRAINT chk_scuc_positive_amount CHECK (scuc_amount_consumed > 0);

-- Ensure valid date ranges for licenses
ALTER TABLE sis_costs_license_plan ADD CONSTRAINT chk_sclp_valid_dates 
CHECK (sclp_end_month IS NULL OR sclp_end_month >= sclp_start_month);

-- =====================================================
-- Comments for Documentation
-- =====================================================

ALTER TABLE sis_costs_service_category COMMENT = 'Service categories: Infrastructure, User License, Usage-based';
ALTER TABLE sis_costs_provider COMMENT = 'Service providers like AWS, Microsoft, Adobe, etc.';
ALTER TABLE sis_costs_service COMMENT = 'Individual services within providers';
ALTER TABLE sis_costs_infra_invoice COMMENT = 'Monthly infrastructure invoices and bills';
ALTER TABLE sis_costs_license_plan COMMENT = 'License plans with monthly costs and quantities';
ALTER TABLE sis_costs_usage_topup COMMENT = 'Usage-based service credit purchases';
ALTER TABLE sis_costs_usage_consumption COMMENT = 'Usage-based service consumption records';

-- End of script