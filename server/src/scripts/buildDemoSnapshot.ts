import { promises as fs } from 'fs';
import path from 'path';

process.env.DATABASE_PATH = 'memory://';
delete process.env.DATABASE_SNAPSHOT_PATH;
delete process.env.VERCEL;

const buildDemoSnapshot = async () => {
  const [{ seed }, { default: database, dumpDatabase }] = await Promise.all([
    import('./seedData'),
    import('../config/database'),
  ]);

  try {
    await seed();
    const snapshot = await dumpDatabase('gzip');
    const bytes = new Uint8Array(await snapshot.arrayBuffer());
    const outputPath = path.resolve(process.cwd(), '../database/demo-seed.tgz');
    await fs.writeFile(outputPath, bytes);
    console.log(`Demo snapshot written to ${outputPath} (${bytes.byteLength} bytes)`);
  } finally {
    await database.end();
  }
};

void buildDemoSnapshot().catch((error) => {
  console.error('Failed to build the demo snapshot:', error);
  process.exitCode = 1;
});
