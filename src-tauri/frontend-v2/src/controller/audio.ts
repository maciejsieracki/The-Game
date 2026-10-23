/**
 * controller/audio.ts — muzyka nakładek (P5.6, `R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1`).
 *
 * Zastępuje w portowanych panelach import `gra/src/audio/muzyka-antyczna.ts` (katalog `audio/**` = EXT bramy P5.1:
 * odtwarzacz ze stanem playlist). Panele wołają te same nazwy co na pinie (`startPreBattleMusic`,
 * `stopPreBattleMusic` — `preBattle.ts:258,277`; `startDiplomacyMusic(civId)`, `stopDiplomacyMusic` —
 * `diplomacyAudience.ts:2422,2433`), a wywołanie trafia do zainstalowanej usługi powłoki.
 *
 * ZAŁOŻENIE P5.6-Z4: gdzie gra muzyka (webview czy Rust) nie jest rozstrzygnięte w P5 — usługa jest wstrzykiwana
 * (`installAudioService`), domyślnie brak (cisza). Brak usługi = brak efektu (muzyka nie jest regułą gry i nie zmienia
 * DOM paneli; na pinie te funkcje też nie dotykają DOM paneli).
 */
export interface AudioService {
  startPreBattleMusic(): void;
  stopPreBattleMusic(): void;
  startDiplomacyMusic(civId?: string): void;
  stopDiplomacyMusic(): void;
}

let current: AudioService | null = null;

export function installAudioService(service: AudioService | null): void {
  current = service;
}

export function startPreBattleMusic(): void {
  current?.startPreBattleMusic();
}

export function stopPreBattleMusic(): void {
  current?.stopPreBattleMusic();
}

export function startDiplomacyMusic(civId?: string): void {
  current?.startDiplomacyMusic(civId);
}

export function stopDiplomacyMusic(): void {
  current?.stopDiplomacyMusic();
}

/** Atrapa MOCK: zapisuje wywołania (podgląd/test), niczego nie odtwarza. */
export function createMockAudioService(log: string[] = []): AudioService & { log: string[] } {
  return {
    log,
    startPreBattleMusic: () => { log.push('startPreBattleMusic'); },
    stopPreBattleMusic: () => { log.push('stopPreBattleMusic'); },
    startDiplomacyMusic: (civId?: string) => { log.push(`startDiplomacyMusic(${civId ?? ''})`); },
    stopDiplomacyMusic: () => { log.push('stopDiplomacyMusic'); },
  };
}
