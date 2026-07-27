# C-WIAR-N4-AI — Czy AI odmawia pomocy sojusznikowi?

**Status:** 🟢 **WDROŻONA** — FALA 36 `a74c3797` (commit `2632156`)  
**Grupa:** D (dyplomacja / AI)  
**Powiązane:** C-WIAR-N4=B (−15 pkt Wiarygodności), N4 w `WIARYGODNOSC-SPECYFIKACJA.md`

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — temat obsługujemy tutaj; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `alliance-war-obligation.ts` · test 14/14 |
| **Deploy `gra-robocza`** | ✅ **FALA 36** `a74c3797` (commit `2632156`) |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Odpowiedź Macieja

> **B** (2026-07-27) — Sztuczna inteligencja **odmawia rzadko**, gdy sama jest **osłabiona** (wojna / słaba moc / niskie Zaufanie) — wtedy **−15 pkt Wiarygodności** jak gracz.  
> Cytat w czacie: `C-WIAR-N4-AI b` (bez deploy/commitu w tej samej sesji — równoległy agent).

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
- **Deploy:** FALA 36 `a74c3797` (commit `2632156`)

## Odrzucone warianty

- **A** — AI zawsze honoruje (status quo; N4 martwe dla AI)
- **C** — odmowa według cechy charakteru cywilizacji (tagi w danych)
