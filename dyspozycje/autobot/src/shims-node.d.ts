/** Minimal Node typings for scaffold typecheck (bez osobnego @types/node w tym katalogu). */
declare module 'fs' {
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, encoding: string): void;
  export function appendFileSync(path: string, data: string, encoding: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, opts?: { recursive?: boolean }): void;
}
declare module 'path' {
  export function resolve(...parts: string[]): string;
  export function join(...parts: string[]): string;
}
declare module 'crypto' {
  export function randomUUID(): string;
}
declare const __dirname: string;
