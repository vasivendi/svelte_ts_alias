# svelte_ts_alias
Original template: [sveltejs/template](https://github.com/sveltejs/template)
# Description
Duct-tape template for svelte + typescript with aliases copied to rollup from the path aliases in `tsconfig.json`
# Aliasing
For convenience the `@svelte` alias is already configured in the tsconfig like so:
```json
...
"@svelte": [
  "node_modules/svelte",
  "node_modules/svelte/index"
],
"@svelte/*": [
  "node_modules/svelte/*",
  "node_modules/svelte/*/index"
]
...
```
## How to
The first alias adds the package itself

The second alias adds the subpackages
- First path in the alias adds the package (for Rollup)
- Second path in the alias adds the index module (for TS language server)

If you wish to alias your own *folders* then you only need the second alias, for example:
```json
...
"@lorem-ipsum/*": [
  "src/lorem/ipsum/*"
]
...
```
Then you'll be able to use that during imports like:
```js
import { sit, amet } from "@lorem-ipsum/dolor"
```
# Take note
Only the first string in the array of each path in the tsconfig-alias will be transformed into a rollup-alias, the rest are for the TS server to stop complaining
