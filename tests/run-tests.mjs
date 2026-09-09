// Bundles every tests/*.test.ts file with esbuild and runs them with Node's built-in test runner.
import esbuild from 'esbuild';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const sTestsDir = 'tests';
const sBuildDir = `${sTestsDir}/.build`;
const aTestFiles = readdirSync(sTestsDir)
	.filter((sName) => sName.endsWith('.test.ts'))
	.map((sName) => `${sTestsDir}/${sName}`);

rmSync(sBuildDir, { recursive: true, force: true });
mkdirSync(sBuildDir, { recursive: true });

await esbuild.build({
	entryPoints: aTestFiles,
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	packages: 'external',
	outdir: sBuildDir,
	logLevel: 'error',
});

const oResult = spawnSync(process.execPath, ['--test', `${sBuildDir}/`], { stdio: 'inherit' });
process.exit(oResult.status ?? 1);
