# MASTER → Grupa D — C-WIAR-N4-AI (heurystyka odmowy AI)

**Status:** 🔵 GOTOWE DO KODU (czeka na wolny `gra/` + sygnał Macieja `działaj`)  
**Decyzja:** **B** — AI odmawia **rzadko**, gdy sama jest **osłabiona**  
**Data ECHO:** 2026-07-27  
**Źródło:** `docs/decyzje/C-WIAR-N4-AI.md`

## Blokada (2026-07-27)

Maciej: **nie ruszać `gra/` ani deploy** dopóki równoległy agent pracuje na plikach gry. Ten handoff = kontrakt; implementacja po zwolnieniu locka.

## Co wdrożyć

Funkcja `aiHonorsAllianceWarObligation` w `gra/src/game/ai.ts` — dziś zawsze `return true`.

Po wdrożeniu **B**: czasem `return false` → AI **nie** dołącza do wojny sojuszniczej → pętla N4 w `main.ts` (~10571) nalicza **−15 pkt Wiarygodności** tylko odmawiającemu i zrywa traktat (już działa).

## Heurystyka (kanon Macieja — wariant B)

**Domyślnie: honoruj** (lojalny sojusznik).

**Odmów** (`false`), gdy **którykolwiek** warunek osłabienia (propozycja progów startowych — strojenie w `ai-params.json`):

| # | Warunek | Propozycja progu | Uzasadnienie B |
|---|---------|------------------|----------------|
| 1 | AI **już prowadzi wojnę** z państwem innym niż `mustDeclareWarOn` | dowolna aktywna wojna `status === 'wojna'` | przeciążenie militarnie |
| 2 | **Siła wojskowa** AI względem `mustDeclareWarOn` poniżej progu | ratio &lt; **0,6** (suma HP lub liczba jednostek w zasięgu mapy) | osłabione wojsko |
| 3 | **Zaufanie** AI → proszący sojusznik (strona, która wymusza obowiązek) poniżej progu | &lt; **20** pkt | brak lojalności do tego konkretnego sojusznika |

**Nie** używać tagów charakteru cywilizacji (to był wariant C — odrzucony).

## Sygnatura (propozycja)

Obecna sygnatura nie ma dostępu do stanu gry. Rozszerzyć o kontekst (czysty obiekt, testowalny):

```ts
export interface AllianceObligationContext {
  allyId: number;
  mustDeclareWarOn: number;
  attackerId: number;
  victimId: number;
  /** Kto wymusił obowiązek (proszący sojusznik z perspektywy allyId). */
  requestingAllyId: number;
  /** Czy allyId ma już wojnę z kimś innym niż mustDeclareWarOn. */
  allyAtWarWithOther: boolean;
  /** Zaufanie allyId → requestingAllyId (pkt). */
  trustToRequester: number;
  /** Siła militarna allyId / mustDeclareWarOn (0…∞, 1 = równe). */
  militaryRatioVsTarget: number;
}
```

`main.ts` w `applyAllianceObligationsOnWar` buduje kontekst i woła `aiHonorsAllianceWarObligation(ctx)`.

## Pliki

| Plik | Zmiana |
|------|--------|
| `gra/src/game/ai.ts` | heurystyka B + nowa sygnatura |
| `gra/src/main.ts` | przekazanie kontekstu (🟡 cross — Integrator) |
| `gra/data/ai-params.json` | opcjonalnie: `ai_sojusz_odmowa_ratio_min` (0,6), `ai_sojusz_odmowa_zaufanie_min` (20) |
| `gra/tools/wiarygodnosc-test.cjs` lub nowy `alliance-obligation-test.cjs` | scenariusz: odmowa → N4 −15 |

## DoD

1. AI osłabione (wojna + słaba armia) **czasem** odmawia; silne AI **honoruje**.
2. Kara N4 **−15** pada na odmawiającego AI (nie na gracza-ofiarę).
3. Gracz (`allyId === 0`) — **bez zmian** w tej paczce (osobny temat UI).
4. Test node ≥ 3 scenariusze (honor / odmowa wojna / odmowa ratio).
5. `tsc --noEmit` 0.

## Warstwa

🟡 cross (`ai.ts` + `main.ts`) — wyłącznie Integrator po `działaj` + wolny lock.

## Nie w scope

- Modal gracza przy odmowie (C-WIAR-N1-UX)
- Dźwignia 3/4, UI badge Wiarygodności
