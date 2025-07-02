#!/bin/bash

# Database seeding script for CostWatch
# This script seeds the database with production service data

echo "🌱 Seeding CostWatch database with production data..."
echo "---------------------------------------------------"

# Run the seeding script
NODE_ENV=development tsx server/seed-production-data.ts

echo ""
echo "✅ Database seeding completed!"
echo "You can now use the application with your production service data."