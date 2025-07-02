-- MySQL Production Database Setup and Seeding Script for CostWatch
-- This script creates the database schema and populates it with production service data

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS costwatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE costwatch;

-- Drop existing tables (if they exist) in correct order to handle foreign keys
DROP TABLE IF EXISTS sis_costs_budget;
DROP TABLE IF EXISTS sis_costs_usage_consumption;
DROP TABLE IF EXISTS sis_costs_usage_topup;
DROP TABLE IF EXISTS sis_costs_license_plan;
DROP TABLE IF EXISTS sis_costs_infra_invoice;
DROP TABLE IF EXISTS sis_costs_service;
DROP TABLE IF EXISTS sis_costs_provider;
DROP TABLE IF EXISTS sis_costs_service_category;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Create sessions table for session management
CREATE TABLE sessions (
    sid VARCHAR(128) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL,
    INDEX IDX_session_expire (expire)
);

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create service category table - scsc (sis_costs_service_category)
CREATE TABLE sis_costs_service_category (
    scsc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scsc_name VARCHAR(64) UNIQUE NOT NULL,
    scsc_description TEXT,
    scsc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scsc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create provider table - scp (sis_costs_provider)
CREATE TABLE sis_costs_provider (
    scp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scp_name VARCHAR(128) UNIQUE NOT NULL,
    scp_website VARCHAR(255),
    scp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scp_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create service table - scs (sis_costs_service)
CREATE TABLE sis_costs_service (
    scs_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scs_provider_id BIGINT NOT NULL,
    scs_category_id BIGINT NOT NULL,
    scs_name VARCHAR(128) NOT NULL,
    scs_description TEXT,
    scs_active BOOLEAN DEFAULT TRUE,
    scs_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scs_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scs_provider_id) REFERENCES sis_costs_provider(scp_id),
    FOREIGN KEY (scs_category_id) REFERENCES sis_costs_service_category(scsc_id)
);

-- Create infrastructure invoice table - scii (sis_costs_infra_invoice)
CREATE TABLE sis_costs_infra_invoice (
    scii_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scii_service_id BIGINT NOT NULL,
    scii_invoice_month DATE NOT NULL,
    scii_amount DECIMAL(12, 2) NOT NULL,
    scii_currency CHAR(3) DEFAULT 'USD',
    scii_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scii_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scii_service_id) REFERENCES sis_costs_service(scs_id)
);

-- Create license plan table - sclp (sis_costs_license_plan)
CREATE TABLE sis_costs_license_plan (
    sclp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sclp_service_id BIGINT NOT NULL,
    sclp_monthly_unit_cost DECIMAL(12, 2) NOT NULL,
    sclp_qty INT NOT NULL DEFAULT 1,
    sclp_start_month DATE NOT NULL,
    sclp_end_month DATE,
    sclp_annual_commitment_end DATE,
    sclp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sclp_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sclp_service_id) REFERENCES sis_costs_service(scs_id)
);

-- Create usage top-up table - scut (sis_costs_usage_topup)
CREATE TABLE sis_costs_usage_topup (
    scut_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scut_service_id BIGINT NOT NULL,
    scut_topup_date DATE NOT NULL,
    scut_amount_purchased DECIMAL(12, 2) NOT NULL,
    scut_currency CHAR(3) DEFAULT 'USD',
    scut_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scut_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scut_service_id) REFERENCES sis_costs_service(scs_id)
);

-- Create usage consumption table - scuc (sis_costs_usage_consumption)
CREATE TABLE sis_costs_usage_consumption (
    scuc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scuc_service_id BIGINT NOT NULL,
    scuc_consumption_date DATE NOT NULL,
    scuc_amount_consumed DECIMAL(12, 2) NOT NULL,
    scuc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scuc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scuc_service_id) REFERENCES sis_costs_service(scs_id)
);

-- Create budget table - scb (sis_costs_budget)
CREATE TABLE sis_costs_budget (
    scb_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scb_name VARCHAR(128) NOT NULL,
    scb_category_id BIGINT,
    scb_service_id BIGINT,
    scb_budget_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
    scb_budget_amount DECIMAL(12, 2) NOT NULL,
    scb_budget_period VARCHAR(7) NOT NULL,
    scb_alert_threshold INT DEFAULT 80,
    scb_is_active BOOLEAN DEFAULT TRUE,
    scb_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scb_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scb_category_id) REFERENCES sis_costs_service_category(scsc_id),
    FOREIGN KEY (scb_service_id) REFERENCES sis_costs_service(scs_id)
);

-- ====================================================================
-- DATA INSERTION
-- ====================================================================

-- Insert service categories
INSERT INTO sis_costs_service_category (scsc_name, scsc_description) VALUES
('Infrastructure', 'Cloud infrastructure and hosting services'),
('User License', 'User-based license subscriptions'),
('AI Services', 'AI and machine learning services');

-- Insert providers
INSERT INTO sis_costs_provider (scp_name, scp_website) VALUES
('AWS', 'https://aws.amazon.com'),
('Google', 'https://cloud.google.com'),
('CDMon', 'https://www.cdmon.com'),
('DNSmadeEasy', 'https://www.dnsmadeeasy.com'),
('Microsoft', 'https://www.microsoft.com'),
('Atlassian', 'https://www.atlassian.com'),
('Beanstalk', 'https://beanstalkapp.com'),
('Adobe', 'https://www.adobe.com'),
('Jetbrains', 'https://www.jetbrains.com'),
('OpenAI', 'https://openai.com'),
('x.ai', 'https://x.ai'),
('Firecrawl', 'https://firecrawl.dev'),
('Tavily', 'https://tavily.com'),
('Mureka', 'https://mureka.ai'),
('Black Forest', 'https://blackforestlabs.ai'),
('Replit', 'https://replit.com'),
('Vercel', 'https://vercel.com'),
('SerpAPI', 'https://serpapi.com'),
('Figma', 'https://figma.com');

-- Insert services with proper category and provider relationships
INSERT INTO sis_costs_service (scs_name, scs_provider_id, scs_category_id, scs_description, scs_active) VALUES
-- Infrastructure Services (category_id = 1)
('AWS - Infra Cloud', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'AWS'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'Infrastructure'), 
 'Telecoming''s entire infrastructure', TRUE),

('GCP - Infra Cloud', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Google'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'Infrastructure'), 
 'Additional services (APIs and AI services)', TRUE),

('Compra Dominios', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'CDMon'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'Infrastructure'), 
 'Domain name reservations', TRUE),

('Proveedor DNS', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'DNSmadeEasy'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'Infrastructure'), 
 'DNS provider', TRUE),

-- User License Services (category_id = 2)
('Google Workspace Enterprise Edition', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Google'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'Google Workspace user licenses', TRUE),

('Office', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Microsoft'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'Microsoft Office & Teams licenses', TRUE),

('Jira y Confluence', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Atlassian'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'User license based', TRUE),

('SVN & GIT', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Beanstalk'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'Repositories threshold license', TRUE),

('Adobe tools', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Adobe'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'Adobe Pro, Photoshop & Creative Cloud licenses', TRUE),

('PHPstorm', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Jetbrains'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'User License'), 
 'PHP Storm user licenses', TRUE),

-- AI Services (category_id = 3)
('ChatGPT Staff Use', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'OpenAI'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'OpenAI suite by web', TRUE),

('ChatGPT Contents', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'OpenAI'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'OpenAI suite by web', TRUE),

('OpenAI API tools', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'OpenAI'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Programatic access to OpenAI services', TRUE),

('Grok chat', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'x.ai'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Grok chat by web', TRUE),

('Firecrawl - LLM web search', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Firecrawl'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Web search capability for LLMs', TRUE),

('Tavily - LLM web search', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Tavily'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Web search capability for LLMs', TRUE),

('Mureka AI - Audio creation (rouge)', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Mureka'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Audio generation model', TRUE),

('Flux AI', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Black Forest'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Image generation model', TRUE),

('Replit AI Vibe Coding', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Replit'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Vibe Coding Tool', TRUE),

('Vercel UX/UI AI Vibe Design', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Vercel'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Vibe Design Tool', TRUE),

('SerpAPI web search', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'SerpAPI'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Web search capability for LLMs', TRUE),

('Figma design', 
 (SELECT scp_id FROM sis_costs_provider WHERE scp_name = 'Figma'), 
 (SELECT scsc_id FROM sis_costs_service_category WHERE scsc_name = 'AI Services'), 
 'Vibe Design Tool', TRUE);

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Display summary of created data
SELECT 'Service Categories' as table_name, COUNT(*) as record_count FROM sis_costs_service_category
UNION ALL
SELECT 'Providers' as table_name, COUNT(*) as record_count FROM sis_costs_provider
UNION ALL
SELECT 'Services' as table_name, COUNT(*) as record_count FROM sis_costs_service;

-- Display services by category
SELECT 
    scc.scsc_name as category,
    COUNT(s.scs_id) as service_count
FROM sis_costs_service_category scc
LEFT JOIN sis_costs_service s ON scc.scsc_id = s.scs_category_id
GROUP BY scc.scsc_id, scc.scsc_name
ORDER BY scc.scsc_name;

-- Display all services with their providers and categories
SELECT 
    s.scs_name as service_name,
    p.scp_name as provider,
    c.scsc_name as category,
    s.scs_description as description
FROM sis_costs_service s
JOIN sis_costs_provider p ON s.scs_provider_id = p.scp_id
JOIN sis_costs_service_category c ON s.scs_category_id = c.scsc_id
ORDER BY c.scsc_name, p.scp_name, s.scs_name;

COMMIT;