#!/bin/bash

# Database seeding script for CostWatch
# This script seeds the database with production service data

echo "🌱 Seeding CostWatch database with production data..."
echo "---------------------------------------------------"

# Run the seeding script using npx tsx
NODE_ENV=development npx tsx server/seed-production-data.ts

echo ""
echo "✅ Database seeding completed!"
echo "You can now use the application with your production service data."