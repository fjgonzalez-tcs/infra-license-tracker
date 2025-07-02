# CostWatch - Production Deployment Guide

## Overview

This guide covers deploying CostWatch to your own server with MySQL database. The application is built with Node.js, React, and requires a MySQL 8.0+ database.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+ and npm
- MySQL 8.0+
- Nginx (recommended for reverse proxy)
- SSL certificate (Let's Encrypt recommended)
- Git

## 1. Server Preparation

### Install Node.js 20
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Install and Configure MySQL 8.0
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Log into MySQL as root
sudo mysql -u root -p
```

### Create Database and User
```sql
-- Create database
CREATE DATABASE costwatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'costwatch'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON costwatch.* TO 'costwatch'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## 2. Application Deployment

### Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /var/www/costwatch
sudo chown $USER:$USER /var/www/costwatch
cd /var/www/costwatch

# Clone repository (replace with your repo URL)
git clone <your-repository-url> .

# Install dependencies
npm install

# Install production dependencies only
npm ci --only=production
```

### Configure Environment Variables
```bash
# Create production environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

**Environment Configuration (.env.production):**
```bash
# Database Configuration
DATABASE_URL="mysql://costwatch:your_password@localhost:3306/costwatch"

# Application Configuration
NODE_ENV=production
PORT=3000

# Optional: Application Settings
APP_NAME="CostWatch"
APP_URL="https://your-domain.com"

# Security (generate secure random strings)
SESSION_SECRET="your-secure-session-secret-min-32-chars"
```

### Initialize Database Schema
```bash
# Run the MySQL deployment script
mysql -u costwatch -p costwatch < mysql-deployment-scripts.sql

# Verify tables were created
mysql -u costwatch -p -e "USE costwatch; SHOW TABLES;"
```

### Build Application for Production
```bash
# Build the frontend
npm run build

# Verify build completed
ls -la dist/  # Should contain built frontend files
```

## 3. Database Schema Setup

The `mysql-deployment-scripts.sql` file contains the complete schema. Key features:

- **Enterprise naming convention**: All tables use `sis_costs_` prefix
- **Optimized indexes**: For performance with large datasets
- **Constraints**: Data validation and referential integrity
- **Views**: Pre-built reporting views for common queries
- **Sample data**: Optional test data (remove in production)

### Verify Schema Installation
```bash
# Check table structure
mysql -u costwatch -p costwatch -e "
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'costwatch';"

# Test views
mysql -u costwatch -p costwatch -e "
SELECT * FROM v_monthly_summary LIMIT 5;
SELECT * FROM v_active_licenses LIMIT 5;"
```

## 4. Process Management with PM2

### Create PM2 Ecosystem File
```bash
# Create PM2 configuration
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'costwatch',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/costwatch/error.log',
    out_file: '/var/log/costwatch/access.log',
    log_file: '/var/log/costwatch/combined.log',
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

### Setup Logging Directory
```bash
# Create log directory
sudo mkdir -p /var/log/costwatch
sudo chown $USER:$USER /var/log/costwatch
```

### Start Application with PM2
```bash
# Start application in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Check application status
pm2 status
pm2 logs costwatch
```

## 5. Nginx Reverse Proxy Setup

### Install Nginx
```bash
sudo apt install nginx
```

### Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/costwatch
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration (update paths to your certificates)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static file serving with caching
    location /assets/ {
        root /var/www/costwatch/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Enable Nginx Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/costwatch /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 6. SSL Certificate with Let's Encrypt

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain SSL Certificate
```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 7. Firewall Configuration

### Configure UFW Firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

## 8. Database Maintenance

### Regular Backup Script
```bash
# Create backup script
sudo nano /usr/local/bin/backup-costwatch.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/costwatch"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="costwatch"
DB_USER="costwatch"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/costwatch_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/costwatch_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: costwatch_$DATE.sql.gz"
```

### Make Script Executable and Schedule
```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-costwatch.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add this line:
# 0 2 * * * /usr/local/bin/backup-costwatch.sh
```

## 9. Monitoring and Maintenance

### Log Monitoring
```bash
# Monitor application logs
pm2 logs costwatch --lines 100

# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
htop
df -h
```

### Application Updates
```bash
# Update application
cd /var/www/costwatch
git pull origin main
npm ci --only=production
npm run build
pm2 restart costwatch
```

### Performance Optimization
```bash
# MySQL optimization (add to /etc/mysql/mysql.conf.d/mysqld.cnf)
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_type = 1
query_cache_size = 64M
max_connections = 200
```

## 10. Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check MySQL service
sudo systemctl status mysql
sudo systemctl restart mysql

# Test database connection
mysql -u costwatch -p costwatch -e "SELECT 1;"
```

**Application Not Starting:**
```bash
# Check PM2 status
pm2 status
pm2 logs costwatch

# Check Node.js version
node --version

# Restart application
pm2 restart costwatch
```

**Nginx Issues:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Performance Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# Database performance
mysql -u costwatch -p costwatch -e "SHOW PROCESSLIST;"
mysql -u costwatch -p costwatch -e "SHOW STATUS LIKE 'Connections';"
```

## 11. Security Considerations

- **Regular Updates**: Keep Node.js, MySQL, and system packages updated
- **Database Security**: Use strong passwords, limit connections
- **File Permissions**: Ensure proper file ownership and permissions
- **Backup Security**: Encrypt backups and store securely
- **Monitor Logs**: Regularly check logs for suspicious activity
- **SSL/TLS**: Keep certificates updated and use strong ciphers

## 12. Post-Deployment Checklist

- [ ] Database schema created successfully
- [ ] Application starts without errors
- [ ] Nginx reverse proxy working
- [ ] SSL certificate installed and valid
- [ ] Firewall configured properly
- [ ] Backup system configured
- [ ] Monitoring tools set up
- [ ] DNS records pointing to server
- [ ] Application accessible via domain
- [ ] All functionality tested

## Support

For issues during deployment, check:
1. Application logs: `pm2 logs costwatch`
2. Nginx logs: `/var/log/nginx/error.log`
3. MySQL logs: `/var/log/mysql/error.log`
4. System logs: `journalctl -u costwatch`

Remember to update the `replit.md` file with your production deployment details for future reference.