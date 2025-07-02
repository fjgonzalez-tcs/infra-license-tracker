#!/bin/bash

# CostWatch Production Setup Script
echo "=== CostWatch Production Setup ==="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run this script as root"
    exit 1
fi

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32
}

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "MySQL is not installed. Please install MySQL 8.0+ first."
    echo "Run: sudo apt install mysql-server"
    exit 1
fi

# Prompt for database configuration
echo ""
echo "=== Database Configuration ==="
read -p "Enter MySQL database name [costwatch]: " DB_NAME
DB_NAME=${DB_NAME:-costwatch}

read -p "Enter MySQL username [costwatch]: " DB_USER
DB_USER=${DB_USER:-costwatch}

read -s -p "Enter MySQL password: " DB_PASSWORD
echo ""

read -p "Enter MySQL host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter MySQL port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

# Prompt for application configuration
echo ""
echo "=== Application Configuration ==="
read -p "Enter application port [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

read -p "Enter your domain name (optional): " DOMAIN_NAME

# Generate session secret
SESSION_SECRET=$(generate_secret)

# Create production environment file
echo ""
echo "Creating .env.production file..."
cat > .env.production << EOF
# CostWatch Production Environment Configuration

# Database Configuration
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Application Configuration
NODE_ENV=production
PORT=${APP_PORT}

# Security Configuration
SESSION_SECRET="${SESSION_SECRET}"

# Optional: Application Settings
APP_NAME="CostWatch"
EOF

if [ ! -z "$DOMAIN_NAME" ]; then
    echo "APP_URL=\"https://${DOMAIN_NAME}\"" >> .env.production
fi

echo "" >> .env.production
echo "# Logging Configuration" >> .env.production
echo "LOG_LEVEL=info" >> .env.production

echo "✅ Environment configuration created!"

# Test database connection
echo ""
echo "=== Testing Database Connection ==="
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    
    # Check if database exists
    DB_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" | grep "$DB_NAME")
    if [ -z "$DB_EXISTS" ]; then
        echo "⚠️  Database '$DB_NAME' does not exist."
        read -p "Create database now? (y/n): " CREATE_DB
        if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
            mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            echo "✅ Database '$DB_NAME' created!"
        fi
    else
        echo "✅ Database '$DB_NAME' exists!"
    fi
    
    # Offer to run schema setup
    if [ -f "mysql-deployment-scripts.sql" ]; then
        read -p "Run database schema setup? (y/n): " RUN_SCHEMA
        if [ "$RUN_SCHEMA" = "y" ] || [ "$RUN_SCHEMA" = "Y" ]; then
            mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < mysql-deployment-scripts.sql
            echo "✅ Database schema installed!"
        fi
    fi
else
    echo "❌ Database connection failed! Please check your credentials."
    exit 1
fi

# Install dependencies
echo ""
echo "=== Installing Dependencies ==="
npm ci --only=production

# Build application
echo ""
echo "=== Building Application ==="
npm run build

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Start the application: NODE_ENV=production npm start"
echo "2. Or use PM2: pm2 start ecosystem.config.js --env production"
echo "3. Configure Nginx reverse proxy (see DEPLOYMENT.md)"
echo "4. Setup SSL certificate with Let's Encrypt"
echo ""
echo "Application will be available at: http://localhost:${APP_PORT}"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "Domain: https://${DOMAIN_NAME}"
fi