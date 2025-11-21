import makeMigrator from './migrator.js';

async function run() {
  try {
    const migrator = makeMigrator();
    await migrator.up();
    console.log('Migrations applied');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
