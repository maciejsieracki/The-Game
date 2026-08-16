/**
 * battleSceneOpen.ts
 * Rejestr AKTYWNYCH nakładek sceny bitwy (P-BITWA-MAPA-BLACKOUT-PO-WYGRANEJ).
 *
 * PO CO OSOBNY MODUŁ: `battleScene.ts` ciągnie za sobą three.js, audio i assety
 * (`?raw` SVG, `.mp3`), więc nie da się go zaimportować w teście node bez pełnego
 * bundla. Sam fakt „czy scena bitwy jest na wierzchu" jest potrzebny mapie świata
 * (`main.ts`) do zablokowania własnej kamery — i musi być testowalny osobno.
 * / EN: standalone registry so the world map can ask "is a battle overlay up?"
 * without importing the heavy battle module (three.js + audio + raw assets).
 *
 * DLACZEGO Set, a nie licznik: `BattleScene.dispose()` bywa wołane DWA RAZY na
 * ścieżce wygranej (raz z `onFinish` ekranu końca, raz z `afterSummary`
 * podsumowania w `main.ts`) — licznik zszedłby wtedy poniżej zera i mapa świata
 * zostałaby zablokowana na stałe. `Set.delete` jest idempotentne.
 * / EN: a Set (not a counter) because dispose() legitimately runs twice on the
 * victory path; Set.delete is idempotent, a counter would go negative.
 */

const OPEN_BATTLE_SCENES = new Set<object>();

/** Nakładka sceny bitwy weszła na ekran. / EN: battle overlay mounted. */
export function markBattleSceneOpen(scene: object): void {
  OPEN_BATTLE_SCENES.add(scene);
}

/** Nakładka sceny bitwy zeszła z ekranu (idempotentne). / EN: unmounted (idempotent). */
export function markBattleSceneClosed(scene: object): void {
  OPEN_BATTLE_SCENES.delete(scene);
}

/** Czy jakakolwiek scena bitwy przykrywa mapę świata. / EN: is any battle overlay up. */
export function isBattleSceneOpen(): boolean {
  return OPEN_BATTLE_SCENES.size > 0;
}
