// Rejestracja loadera m07a-hooks.mjs dla node --experimental-transform-types --import.
import { register } from 'node:module';
register('./m07a-hooks.mjs', import.meta.url);
