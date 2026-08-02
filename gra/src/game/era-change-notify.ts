/**
 * era-change-notify.ts — komunikat graczowi przy awansie epoki (ownerId 0).
 *
 * Teksty w jednym miejscu — Maciej może tu doprecyzować copy.
 * Feature: Maciej 2026-08-02 — „brakuje informacji, że przeszło się do innej epoki”.
 */

/** Stałe copy UI — edytuj tutaj. */
export const ERA_CHANGE_NOTIFY = {
  title: 'Nowa epoka',
  /** %s = dopełniacz nazwy epoki, np. „Brązu”. */
  bodyTemplate: 'Wkraczasz w epokę %s.',
  toastDurationMs: 5500,
} as const;

/** Dopełniacz dla „epokę …” (1 = Kamienia, 2 = Brązu, 3 = Żelaza). */
export const ERA_GENITIVE_LABELS: Readonly<Record<number, string>> = {
  1: 'Kamienia',
  2: 'Brązu',
  3: 'Żelaza',
};

export function eraGenitiveLabel(eraIndex: number): string {
  const era = Math.max(1, Math.round(eraIndex));
  return ERA_GENITIVE_LABELS[era] ?? `nr ${era}`;
}

/** True gdy epoka wzrosła — jednorazowy toast, nie co turę. */
export function shouldNotifyPlayerEraChange(prevEra: number, nextEra: number): boolean {
  return nextEra > prevEra;
}

export function eraChangeNotifyBody(eraIndex: number): string {
  return ERA_CHANGE_NOTIFY.bodyTemplate.replace('%s', eraGenitiveLabel(eraIndex));
}

/** HTML do showHintMessage (toast na mapie). */
export function eraChangeNotifyToastHtml(eraIndex: number): string {
  return `<b>${ERA_CHANGE_NOTIFY.title}</b> — ${eraChangeNotifyBody(eraIndex)}`;
}

/** Tytuł wpisu w panelu WYDARZENIA. */
export function eraChangeJournalTitle(eraIndex: number): string {
  return `${ERA_CHANGE_NOTIFY.title}: ${eraGenitiveLabel(eraIndex)}`;
}

export function eraChangeJournalSubtitle(eraIndex: number): string {
  return eraChangeNotifyBody(eraIndex);
}
