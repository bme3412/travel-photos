// Entry point for `node --import ./scripts/test/register.mjs --test …` —
// installs the alias/ESM/JSON hooks before any test file is loaded.

import { register } from 'node:module';

register(new URL('./alias-hooks.mjs', import.meta.url));
