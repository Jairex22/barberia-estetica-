import { buildApp } from '../src/app.js';
import { runJob, JOB_NAMES, type JobName } from '../src/jobs/scheduler.js';
const name = process.argv[2] as JobName | undefined;
if (!name || !JOB_NAMES.includes(name)) { console.error(`Uso: pnpm jobs:run <${JOB_NAMES.join('|')}>`); process.exit(1); }
const app = await buildApp({ logger: false, jobs: false });
console.log(await runJob(app, name));
await app.close();
