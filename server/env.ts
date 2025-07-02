import { config } from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV before any other imports
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

// Load the environment file
config({ path: envPath });

// Log which environment file was loaded (for debugging)
if (process.env.NODE_ENV !== 'test') {
  console.log(`Loading environment from: ${envFile}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Port: ${process.env.PORT || 'default'}`);
}

export {}; // Make this a module