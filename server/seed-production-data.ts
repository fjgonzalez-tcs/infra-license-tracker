// Direct database connection for seeding (bypassing env.ts to avoid .env.development override)
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { serviceCategory, provider, service } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Use the actual DATABASE_URL environment variable (not from .env.development)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const db = drizzle({ client: pool, schema });

// Production data structure based on your requirements
const productionData = {
  categories: [
    { name: 'Infrastructure', description: 'Cloud infrastructure and hosting services' },
    { name: 'User License', description: 'User-based license subscriptions' },
    { name: 'AI Services', description: 'AI and machine learning services' }
  ],
  providers: [
    { name: 'AWS', website: 'https://aws.amazon.com' },
    { name: 'Google', website: 'https://cloud.google.com' },
    { name: 'CDMon', website: 'https://www.cdmon.com' },
    { name: 'DNSmadeEasy', website: 'https://www.dnsmadeeasy.com' },
    { name: 'Microsoft', website: 'https://www.microsoft.com' },
    { name: 'Atlassian', website: 'https://www.atlassian.com' },
    { name: 'Beanstalk', website: 'https://beanstalkapp.com' },
    { name: 'Adobe', website: 'https://www.adobe.com' },
    { name: 'Jetbrains', website: 'https://www.jetbrains.com' },
    { name: 'OpenAI', website: 'https://openai.com' },
    { name: 'x.ai', website: 'https://x.ai' },
    { name: 'Firecrawl', website: 'https://firecrawl.dev' },
    { name: 'Tavily', website: 'https://tavily.com' },
    { name: 'Mureka', website: 'https://mureka.ai' },
    { name: 'Black Forest', website: 'https://blackforestlabs.ai' },
    { name: 'Replit', website: 'https://replit.com' },
    { name: 'Vercel', website: 'https://vercel.com' },
    { name: 'SerpAPI', website: 'https://serpapi.com' },
    { name: 'Figma', website: 'https://figma.com' }
  ],
  services: [
    // Infrastructure Services
    { name: 'AWS - Infra Cloud', providerName: 'AWS', categoryName: 'Infrastructure', description: "Telecoming's entire infrastructure" },
    { name: 'GCP - Infra Cloud', providerName: 'Google', categoryName: 'Infrastructure', description: 'Additional services (APIs and AI services)' },
    { name: 'Compra Dominios', providerName: 'CDMon', categoryName: 'Infrastructure', description: 'Domain name reservations' },
    { name: 'Proveedor DNS', providerName: 'DNSmadeEasy', categoryName: 'Infrastructure', description: 'DNS provider' },
    
    // User License Services
    { name: 'Google Workspace Enterprise Edition', providerName: 'Google', categoryName: 'User License', description: 'Google Workspace user licenses' },
    { name: 'Office', providerName: 'Microsoft', categoryName: 'User License', description: 'Microsoft Office & Teams licenses' },
    { name: 'Jira y Confluence', providerName: 'Atlassian', categoryName: 'User License', description: 'User license based' },
    { name: 'SVN & GIT', providerName: 'Beanstalk', categoryName: 'User License', description: 'Repositories threshold license' },
    { name: 'Adobe tools', providerName: 'Adobe', categoryName: 'User License', description: 'Adobe Pro, Photoshop & Creative Cloud licenses' },
    { name: 'PHPstorm', providerName: 'Jetbrains', categoryName: 'User License', description: 'PHP Storm user licenses' },
    
    // AI Services
    { name: 'ChatGPT Staff Use', providerName: 'OpenAI', categoryName: 'AI Services', description: 'OpenAI suite by web' },
    { name: 'ChatGPT Contents', providerName: 'OpenAI', categoryName: 'AI Services', description: 'OpenAI suite by web' },
    { name: 'OpenAI API tools', providerName: 'OpenAI', categoryName: 'AI Services', description: 'Programatic access to OpenAI services' },
    { name: 'Grok chat', providerName: 'x.ai', categoryName: 'AI Services', description: 'Grok chat by web' },
    { name: 'Firecrawl - LLM web search', providerName: 'Firecrawl', categoryName: 'AI Services', description: 'Web search capability for LLMs' },
    { name: 'Tavily - LLM web search', providerName: 'Tavily', categoryName: 'AI Services', description: 'Web search capability for LLMs' },
    { name: 'Mureka AI - Audio creation (rouge)', providerName: 'Mureka', categoryName: 'AI Services', description: 'Audio generation model' },
    { name: 'Flux AI', providerName: 'Black Forest', categoryName: 'AI Services', description: 'Image generation model' },
    { name: 'Replit AI Vibe Coding', providerName: 'Replit', categoryName: 'AI Services', description: 'Vibe Coding Tool' },
    { name: 'Vercel UX/UI AI Vibe Design', providerName: 'Vercel', categoryName: 'AI Services', description: 'Vibe Design Tool' },
    { name: 'SerpAPI web search', providerName: 'SerpAPI', categoryName: 'AI Services', description: 'Web search capability for LLMs' },
    { name: 'Figma design', providerName: 'Figma', categoryName: 'AI Services', description: 'Vibe Design Tool' }
  ]
};

export async function seedProductionData() {
  console.log('🌱 Starting database seeding with production data...');
  
  try {
    // 1. Seed categories
    console.log('📂 Seeding service categories...');
    const categoryMap = new Map<string, number>();
    
    for (const cat of productionData.categories) {
      try {
        // Check if category already exists
        const existing = await db.select().from(serviceCategory).where(eq(serviceCategory.name, cat.name)).limit(1);
        
        if (existing.length === 0) {
          const [newCategory] = await db.insert(serviceCategory)
            .values({ name: cat.name, description: cat.description })
            .returning();
          categoryMap.set(cat.name, newCategory.id);
          console.log(`  ✅ Created category: ${cat.name}`);
        } else {
          categoryMap.set(cat.name, existing[0].id);
          console.log(`  ⏭️  Category already exists: ${cat.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating category ${cat.name}:`, error);
      }
    }

    // 2. Seed providers
    console.log('🏢 Seeding providers...');
    const providerMap = new Map<string, number>();
    
    for (const prov of productionData.providers) {
      try {
        // Check if provider already exists
        const existing = await db.select().from(provider).where(eq(provider.name, prov.name)).limit(1);
        
        if (existing.length === 0) {
          const [newProvider] = await db.insert(provider)
            .values({ name: prov.name, website: prov.website })
            .returning();
          providerMap.set(prov.name, newProvider.id);
          console.log(`  ✅ Created provider: ${prov.name}`);
        } else {
          providerMap.set(prov.name, existing[0].id);
          console.log(`  ⏭️  Provider already exists: ${prov.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating provider ${prov.name}:`, error);
      }
    }

    // 3. Seed services
    console.log('⚙️  Seeding services...');
    
    for (const svc of productionData.services) {
      try {
        const providerId = providerMap.get(svc.providerName);
        const categoryId = categoryMap.get(svc.categoryName);
        
        if (!providerId || !categoryId) {
          console.error(`  ❌ Missing provider or category for service: ${svc.name}`);
          continue;
        }

        // Check if service already exists
        const existing = await db.select().from(service).where(eq(service.name, svc.name)).limit(1);
        
        if (existing.length === 0) {
          await db.insert(service).values({
            name: svc.name,
            description: svc.description,
            providerId,
            categoryId,
            active: true
          });
          console.log(`  ✅ Created service: ${svc.name}`);
        } else {
          console.log(`  ⏭️  Service already exists: ${svc.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating service ${svc.name}:`, error);
      }
    }

    console.log('🎉 Production data seeding completed successfully!');
    
    // Display summary
    const categoryCount = await db.select().from(serviceCategory);
    const providerCount = await db.select().from(provider);
    const serviceCount = await db.select().from(service);
    
    console.log('\n📊 Database Summary:');
    console.log(`  📂 Service Categories: ${categoryCount.length}`);
    console.log(`  🏢 Providers: ${providerCount.length}`);
    console.log(`  ⚙️  Services: ${serviceCount.length}`);
    
  } catch (error) {
    console.error('💥 Error during seeding:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductionData()
    .then(() => {
      console.log('✨ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error);
      process.exit(1);
    });
}