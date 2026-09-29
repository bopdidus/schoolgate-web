/**
 * OpenAPI Generator still emits `export * from './api.module'` even when the
 * NgModule file is ignored (`providedInRoot`). Strip that line so `ng serve`
 * does not break after every `npm run swagger:generate`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'src', 'app', 'api', 'index.ts');
const before = readFileSync(indexPath, 'utf8');
const after = before
  .split(/\r?\n/)
  .filter((line) => !line.includes("from './api.module'") && !line.includes('from "./api.module"'))
  .join('\n');

if (after !== before) {
  writeFileSync(indexPath, after.endsWith('\n') ? after : `${after}\n`, 'utf8');
  console.log('[fix-openapi-index] Removed broken ./api.module export from src/app/api/index.ts');
} else {
  console.log('[fix-openapi-index] No ./api.module export found — nothing to fix');
}
