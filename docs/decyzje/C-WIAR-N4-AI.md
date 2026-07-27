# C-WIAR-N4-AI — Czy AI odmawia pomocy sojusznikowi?

**Status:** 🔵 **W TRAKCIE** (kod w `gra/src`, test 14/14; czeka deploy ROBOCZA)  
**Grupa:** D (dyplomacja / AI)  
**Powiązane:** C-WIAR-N4=B (−15 pkt Wiarygodności), N4 w `WIARYGODNOSC-SPECYFIKACJA.md`

## Odpowiedź Macieja

> **B** — Sztuczna inteligencja **odmawia rzadko**, gdy sama jest **osłabiona** (np. mało wojska, jest w wojnie z kimś innym lub ma niskie Zaufanie do proszącego) — wtedy płaci **−15 pkt Wiarygodności** jak gracz.

Cytaty:
- 2026-07-27 (wcześniej): `C-WIAR-N4-AI b` — bez deploy/commitu (równoległa sesja).
- 2026-07-27 (potwierdzenie): `C-WIAR-N4-AI b`

## Co to znaczy w grze

| Element | Zasada |
|---|---|
| **Dotychczas** | `aiHonorsAllianceWarObligation()` zawsze `true` → AI zawsze dołącza; kara N4 nigdy nie pada na AI |
| **Po wdrożeniu B** | AI czasem zwraca `false` → **nie** wchodzi do wojny; sojusz zerwany; **−15 W** tylko dla odmawiającego AI |
| **Częstotliwość** | **Rzadko** — tylko przy realnym osłabieniu, nie losowo i nie według tagu charakteru nacji |
| **Parytet kary** | C-WIAR-N4=B: **−15** Wiarygodności, wyłącznie odmawiający |
| **Gracz** | Osobna ścieżka UI (poza tym ABC) — ten ticket dotyczy **AI** |

## Heurystyka (zaimplementowana w `gra/src`)

**Honoruj** domyślnie.

**Odmów**, gdy spełniony **którykolwiek** warunek:

1. AI jest **już w wojnie** (`activeWarCount ≥ 1`, parametr `ai_sojusz_obowiazek_max_wojny`).
2. **Stosunek mocy** AI vs `mustDeclareWarOn` **&lt; 0,55** (pokojowy **&lt; 0,75**).
3. **Zaufanie** AI do proszącego sojusznika **&lt; 20 pkt** (`ai_sojusz_obowiazek_min_zaufanie`).

Progi w `ai-params.json` — strojenie po deployu.

**Nie** stosować wariantu C (odmowa według tagu „Zdradziecki" w `civ-ai.json`).

## Wdrożenie

- `gra/src/game/alliance-war-obligation.ts` · `ai.ts` · `main.ts` · `ai-params.json`
- Test: `alliance-war-obligation-test.cjs` **14/14**
- **Czeka:** deploy do `gra-robocza/` (na polecenie Macieja)

## Odrzucone warianty

- **A** — AI zawsze honoruje (status quo; N4 martwe dla AI)
- **C** — odmowa według cechy charakteru cywilizacji (tagi w danych)
