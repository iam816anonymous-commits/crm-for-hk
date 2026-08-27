import dotenv from 'dotenv';
import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

// Run database migrations on startup
runMigrations();

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Rental Property CRM Backend server running on port ${PORT}`);
});
