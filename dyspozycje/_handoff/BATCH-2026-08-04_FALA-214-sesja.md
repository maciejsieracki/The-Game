# BATCH FALA 214 — sesja 2026-08-04

- **Deploy:** ROBOCZA `adefb5b8` · commit `9ac4a28` · WERSJE FALA 214
- **Wejście:** `gra-robocza/START.html` · po git pull + Ctrl+F5 + Nowa gra

---

## A. Decyzje ABC (zamknięte w tej sesji)

| ID | Pytania | Odpowiedź | Jedno zdanie |
|----|---------|-----------|--------------|
| R-SCOUT-BLACK-MAX | Q1, Q2 | A, A | Każdy krok zwiedzania max nowych czarnych heksów; chatka tylko w widoku lub zasięgu MP tej tury. |
| R-MP-HARD-WAVE | Q1, Q2, Q3 | A, A, A | Hard PM: więcej wojska, fala ataku ≥3, sync DOW klastra siostrzanych PM. |
| R-PW-ACCEPT-OVERPAY | Q1 | A | Przyjmij ofertę AI gdy net PW ≥ 0 (overpay OK); blokada przy ujemnej korzyści partnera. |

---

## B. Błędy / regresje naprawione

| ID | Objaw | Przyczyna | Rozwiązanie | PR | Status |
|----|-------|-----------|-------------|-----|--------|
| R-MP-ULEPSZENIA (#73) | MP nie stawiają farm/kopalni | Regres FALA 204: `pracaSurplusThreshold: 30` po koszcie ulepszenia | AI picker: `pracaSurplusThreshold: 0` | #73 | ZDEPLOYOWANE FALA 214 |
| R-PW-ACCEPT-OVERPAY (#79) | Przyjmij zablokowane przy overpay | `previewNegotiationEntry` używał `pnDealAcceptedByAi` (fair-min AI) | `previewIncomingPlayerAccept` — net PW ≥ 0 | #79 | ZDEPLOYOWANE FALA 214 |
| R-PW-BILANS-ACCEPT (#70) | AI akceptuje niedopłaconą ofertę gracza | Brak bramki bilansu gdy gracz proponuje | `playerTreatyBalanceReject` — myDisplay ≥ theirDisplay | #70 | ZDEPLOYOWANE FALA 214 |
| R-CHATKA-VET-TOAST (#71) | Toast chatki → tip weteranów | Drugi `refreshFog()` bez `skipVeteranEducation` | Flaga skip po marszu/anim/scout EOT | #71 | ZDEPLOYOWANE FALA 214 |
| R-ICON-ZROWNOWAZONE (#72) | Ikona zrównoważone ≠ Prawo | Ten sam glyph `cp-order` | `field-balanced` (↕ + belka); Prawo zostaje `cp-order` | #72 | ZDEPLOYOWANE FALA 214 |
| R-LISTA-NAZWANA (#74) | Szablony A/B/C zamiast nazw | Stary model R-AUTO-V2-Q8 | Biblioteka nazwanych list + Zamknij listę | #74 | ZDEPLOYOWANE FALA 214 |
| R-SCOUT-EXIT-AUTO (#75) | Ręczny marsz przy włączonym Zwiedzaj | Brak auto-wyłączenia | `clearScoutAutoExplore` przy klik/marsz | #75 | ZDEPLOYOWANE FALA 214 |
| R-OKOLICA-ZYWNOSC-SCORE (#76) | Auto-okolica żywność → las | Wagi praca/handel + brak potencjału farmy | Wagi 10/0/0 + `foodPotentialForHex` | #76 | ZDEPLOYOWANE FALA 214 |
| R-UNIT-MODE-TOGGLE-UI (#77) | Tryby WŁ/WYŁ jak disabled | Brak klasy `uc-act-btn--on` | 3 stany: off / on (złoty) / disabled | #77 | ZDEPLOYOWANE FALA 214 |
| R-SCOUT-BLACK-MAX (#81) | Zwiedzaj preferuje FoW zamiast czerni | Scoring mgły bez priorytetu nowych heksów | `scoreMarginalReveal` + max newBlack | #81 | ZDEPLOYOWANE FALA 214 |
| R-MP-HARD-WAVE (#80) | Hard PM słabe, solo-raids | Brak tier Hard w AI produkcji/fali/DOW | Q1–Q3 w `ai.ts` + `city-state-difficulty.ts` | #80 | ZDEPLOYOWANE FALA 214 |
| R-PROC-NO-REGRESS (#78) | Merge batcha cofał cudze fixy | Brak bramki diff przed commit | Procedura §4a + checklist overlap PR | #78 | WDROŻONE (docs) |

---

## C. Odłożone (bez kodu)

| ID | Uwagi |
|----|-------|
| R-NADMIAR-POOLS | Maciej myśli; nadmiar Pracy / Skarbca / Spichlerza w HUD. Powiązane: R-STAWKI-STROJENIE, R-BILANS-100T. |

---

## D. Reguła procesu

**R-PROC-NO-REGRESS** — przed commit/deploy: przegląd `git diff` (zmiany **i** usunięcia), sprawdzenie overlap otwartych PR (zwł. `main.ts`), testy obszaru + smoke powiązanych tematów. Kanon: `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §4a.

---

## E. Pliki decyzji

| Plik | Akcja |
|------|-------|
| `docs/decyzje/R-SCOUT-BLACK-MAX.md` | zaktualizowany (deploy) |
| `docs/decyzje/R-MP-HARD-WAVE.md` | zaktualizowany (deploy) |
| `docs/decyzje/R-PW-ACCEPT-OVERPAY.md` | **nowy** |
| `docs/decyzje/R-MP-ULEPSZENIA.md` | **nowy** |
| `docs/decyzje/R-UNIT-MODE-TOGGLE-UI.md` | **nowy** |
| `docs/decyzje/R-PW-BILANS-ACCEPT.md` | **nowy** |
| `docs/decyzje/R-CHATKA-VET-TOAST.md` | **nowy** |
| `docs/decyzje/R-ICON-ZROWNOWAZONE.md` | **nowy** |
| `docs/decyzje/R-SCOUT-EXIT-AUTO.md` | **nowy** (+ link `P-SCOUT-EXPLORE.md`) |
| `docs/decyzje/R-LISTA-NAZWANA.md` | deploy line |
| `docs/decyzje/R-OKOLICA-ZYWNOSC-SCORE.md` | deploy line |

---

*Bramki deployu: tsc 0 · VERIFY OK · stempel ROBOCZA 2026-08-04 16:03.*
