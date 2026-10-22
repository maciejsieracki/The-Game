/**
 * controller/transport.ts — interfejs mostka `invoke`/zdarzenia oraz adapter Tauri.
 *
 * Adapter Tauri korzysta z `window.__TAURI__` (konfiguracja `app.withGlobalTauri: true`,
 * `src-tauri/tauri.conf.json`), bez zależności npm `@tauri-apps/api` — tak samo jak
 * obecny `src-tauri/frontend/main.js:5,722,756`. W tej rundzie NIE jest używany domyślnie
 * (kontroler startuje z atrapą MOCK, `main.ts`); przełączenie = osobny temat.
 */

export type Unlisten = () => void;

export interface Transport {
  /** Etykieta źródła danych pokazywana w UI. */
  readonly source: 'MOCK' | 'TAURI';
  invoke<T>(command: string, args: Readonly<Record<string, unknown>>): Promise<T>;
  listen<T>(event: string, handler: (payload: T) => void): Promise<Unlisten>;
}

interface TauriGlobal {
  core?: { invoke?: (cmd: string, args?: unknown) => Promise<unknown> };
  event?: { listen?: (event: string, cb: (e: { payload: unknown }) => void) => Promise<() => void> };
}

function tauriGlobal(): TauriGlobal | undefined {
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
}

export function isTauriAvailable(): boolean {
  return typeof tauriGlobal()?.core?.invoke === 'function';
}

export function createTauriTransport(): Transport {
  return {
    source: 'TAURI',
    async invoke<T>(command: string, args: Readonly<Record<string, unknown>>): Promise<T> {
      const invoke = tauriGlobal()?.core?.invoke;
      if (!invoke) throw new Error('Tauri runtime unavailable (window.__TAURI__.core.invoke).');
      return (await invoke(command, args)) as T;
    },
    async listen<T>(event: string, handler: (payload: T) => void): Promise<Unlisten> {
      const listen = tauriGlobal()?.event?.listen;
      if (!listen) throw new Error('Tauri runtime unavailable (window.__TAURI__.event.listen).');
      return listen(event, (e) => handler(e.payload as T));
    },
  };
}
