import { migrateToPostgres } from './migrate-to-postgres';

// Run the migration
migrateToPostgres()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
