import { execFileSync } from 'node:child_process';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const capture = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// Message from args after `--`, otherwise a timestamped default.
const message = process.argv.slice(2).join(' ').trim() || `Update site ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

run('node', ['tools/build.mjs']);
run('git', ['add', '-A']);

if (!capture('git', ['status', '--porcelain'])) {
  console.log('Nothing to publish; working tree is clean.');
  process.exit(0);
}

run('git', ['commit', '-m', message]);
run('git', ['push']);
console.log('Published. Cloudflare will deploy the pushed commit.');
