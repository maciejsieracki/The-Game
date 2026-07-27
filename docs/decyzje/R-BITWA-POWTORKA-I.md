# R-BITWA-POWTORKA-I — Powtórka bitwy a ręczne grupowanie jednostek

**Status:** 🔵 **KOD GOTOWY** — ⏸ deploy czeka **FALA 37**  
**Grupa:** C (walka / bitwa ręczna)  
**Ekran:** [EKRAN: Bitwa ręczna 3D — faza rozstawiania]  
**Alias rejestru:** **I** · `R-BITWA-POWTORKA` w `REJESTR-PROSB-I-ZADAN.md`

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — implementacja opcji **B** zakończona w `gra/src` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `_autoGroupDeployByKind()` bez snapshotu |
| **Deploy `gra-robocza`** | ⏸ **czeka FALA 37** — FALA 36 `a74c3797` ma jeszcze stary snapshot |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Po zakończeniu bitwy ręcznej gracz może wybrać **„Rozegraj ponownie"**. Pytanie: jaki podział grup obowiązuje po powrocie do fazy rozstawiania?

**Pierwsze wejście** w fazę rozstawiania: auto-grupa po typie (Konnica / Piechota / Łucznicy) — bez zmian.

## Cel pytania

Ustalić zachowanie grup po **„Rozegraj ponownie"**.

## Opcja A — Odtwórz dokładnie grupowanie sprzed pierwszej walki

Snapshot z „Start walki" — ręczny podział przetwarza powtórkę.

## Opcja B — Po powtórce znowu auto-grupa po typie ✅

**Opis:** „Rozegraj ponownie" = świeży układ jak przy pierwszym wejściu: gra tworzy grupy po typie jednostki.

## Opcja C — Po powtórce wszyscy rozgrupowani

Czysta kartka bez auto-grupy.

## Rekomendacja

A (odtworzenie snapshotu) — Maciej wybrał **B**.

## Odpowiedź Macieja

> **B** (2026-07-27) — po powtórce znowu auto-grupa po typie (Konnica / Piechota / Łucznicy).  
> *Zapis w pliku przed wdrożeniem kodu — standard od 2026-07-27 (`ABC-ZAPIS-PLIKOWY.md`).*

## Wdrożenie

- `gra/src/battle/battleScene.ts` — `_initDeployUI()` zawsze woła `_autoGroupDeployByKind()` (usunięty `_deployGroupSnapshot` / restore)
- Warstwa: 🟡
- **Deploy:** ⏸ **czeka FALA 37** (FALA 36 `a74c3797` = stary snapshot)
