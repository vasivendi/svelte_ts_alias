import { spawn } from 'child_process';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import json5 from "json5";

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

/**
 * Automatically generates aliasing from tsconfig
 * 
 * ! Beware it only considers the first element of the aliased paths array !
 * @param {string} config_path
 * @returns {{ [alias: string]: string } | undefined}
 */
function read_tsconfig_paths(config_path, project_root, resolver) {
	const file_content = readFileSync(config_path);
	const parsed = json5.parse(file_content);
	if (parsed.compilerOptions == undefined || parsed.compilerOptions.paths == undefined) {
		return [];
	}
	const paths = parsed.compilerOptions.paths;
	const computed = [];
	for (const key in paths) {
		if (Object.hasOwnProperty.call(paths, key)) {
			const entry = paths[key][0];
			// strip trailing '/*'
			const stripped_key = key.endsWith('/*') ? key.substring(0, key.length - 2) : key;
			const stripped_path = entry.endsWith('/*') ? entry.substring(0, entry.length - 2) : entry;
			// if already in array, skip
			if (computed.some(x => x.find == stripped_key)) {
				continue;
			}
			// otherwise push
			computed.push({
				find: stripped_key,
				replacement: resolve(project_root, stripped_path),
				customResolver: resolver
			});
		}
	}
	return computed;
}

const custom_resolver = nodeResolve({
	extensions: [".ts", ".js", ".svelte"]
});
const tsconfig_computed = read_tsconfig_paths("tsconfig.json", resolve("."), custom_resolver);

export default {
	input: 'src/main.ts',
	output:
	{
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js',
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				dev: !production
			}
		}),
		css({ output: 'bundle.css' }),
		commonjs(),
		typescript({
			sourceMap: true,
			inlineSources: !production,
			include: ["src/**/*", "src/global.d.ts"],
			tsconfig: "./tsconfig.json",
		}),
		alias({
			customResolver: custom_resolver,
			entries: tsconfig_computed,
		}),
		nodeResolve({
			browser: true,
			dedupe: ['svelte'],
			exportConditions: ['svelte']
		}),
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
