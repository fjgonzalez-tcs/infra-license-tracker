# CostWatch - Cost Management Dashboard

## Overview

CostWatch is a unified dashboard application for tracking infrastructure, license, and usage-based service costs. It provides comprehensive visibility into technology spending across different service categories including cloud infrastructure, software licenses, and usage-based services.

**Latest Updates:**
- Dashboard now includes widget visibility controls - users can show/hide different sections
- Authentication system removed for intranet deployment
- MySQL deployment scripts created for production environments

## System Architecture

The application follows a modern full-stack architecture with the following components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS with Radix UI components (shadcn/ui)
- **State Management**: TanStack React Query for server state management
- **Charts**: Chart.js 4 via react-chartjs-2 for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit OIDC integration with session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Architecture
- **Primary Database**: PostgreSQL (via Neon)
- **Schema Management**: Drizzle migrations
- **Key Tables**: 
  - Users and sessions (auth)
  - Service categories, providers, and services
  - Infrastructure invoices
  - License plans and commitments
  - Usage topups and consumption tracking

## Key Components

### Authentication System (REMOVED)
- **Note**: Authentication has been removed for intranet deployment
- **Previous**: Replit OIDC integration with session management
- **Current**: Direct access to all routes without authentication

### Data Models
- **Service Categories**: Infrastructure, User License, Usage-based
- **Providers**: Service providers (AWS, Microsoft, etc.)
- **Services**: Individual services within providers
- **Financial Tracking**: Invoices, license costs, usage consumption

### User Interface
- **Dashboard**: KPI cards, monthly spend charts, category breakdowns
- **Service Management**: CRUD operations for services and providers
- **License Tracking**: License plan management with renewal alerts
- **Usage Monitoring**: Balance tracking and consumption history

### Charts and Visualization
- **Monthly Trends**: Bar charts showing spending over time
- **Category Distribution**: Doughnut charts for spend breakdown
- **KPI Metrics**: Real-time cost summaries and alerts

## Data Flow

1. **Authentication Flow**: User authenticates via Replit OIDC → Session created → Access granted to protected routes
2. **Data Fetching**: React Query manages API calls → Express routes handle requests → Drizzle ORM queries PostgreSQL
3. **Real-time Updates**: Mutations trigger cache invalidation → UI automatically updates with fresh data
4. **Dashboard Rendering**: Aggregated data flows to Chart.js components → Visual representations update reactively

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **drizzle-orm**: Type-safe database interactions
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **chart.js**: Data visualization
- **express**: Web server framework
- **wouter**: Client-side routing

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS
- **zod**: Runtime type validation

### Authentication Dependencies
- **openid-client**: OIDC authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Automatic reloading for both frontend and backend changes
- **Error Handling**: Runtime error overlay in development
- **Database**: PostgreSQL via Neon serverless for testing

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Express server for production
- **Deployment**: Single node process serving both API and static files

### Production Database Migration
- **Development**: PostgreSQL (current setup)
- **Production**: MySQL deployment support available
- **Migration Script**: `mysql-deployment-scripts.sql` contains complete schema
- **Features**: Full table structure, indexes, views, and sample data
- **Compatibility**: Designed for MySQL 8.0+ with UTF8MB4 support

### Environment Configuration
- **Database**: DATABASE_URL for PostgreSQL (dev) or MySQL (prod)
- **Authentication**: Removed for intranet deployment
- **Access**: Direct access to all application features

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

- July 1, 2025: Database Schema Overhaul
  - Implemented new naming convention with "sis_costs_" prefix for all table names
  - Added mnemonic prefixes for all column names (e.g., "scsc_" for sis_costs_service_category)
  - Tables renamed: service_category → sis_costs_service_category, provider → sis_costs_provider, etc.
  - Column naming: id → scsc_id, name → scsc_name, etc. for consistent enterprise database standards
  - Monthly Detail widget added as primary dashboard feature
  - Successfully migrated database schema without data loss

- January 1, 2025: Major Updates
  - Added dashboard widget visibility controls (show/hide KPI cards, charts, activities)
  - Removed authentication system for intranet deployment
  - Created comprehensive MySQL deployment scripts with schema, indexes, and views
  - Updated all pages to work without authentication requirements
  - Documented production database migration strategy

- July 01, 2025: Initial setup
  - Complete full-stack application with PostgreSQL
  - Dashboard with KPI cards and charts
  - Service, license, and usage management modules
  - Replit Auth integration (now removed)