# HANDOFF SESJI — FALA 221–224 + cleanup (2026-08-04 / 05)

**Dla kolejnego agenta:** przeczytaj ten plik + `STAN-PRACY-HANDOFF.md` §1 + `dyspozycje/WERSJE.md` (AKTUALNA) + `KANAL-PRACA.md` (góra).

**Rola sesji:** Cloud Integrator (Grok 4.5) · Maciej playtest + hasła `działaj` / `deploy` / kolejka.

---

## 1. AKTUALNA ROBOCZA

| Pole | Wartość |
|------|---------|
| **FALA** | **224** |
| **md5 pliku** | `38df6ad74d2613e776a51b332eb2696c` (short **`38df6ad7`**) |
| **Stempel w menu** | `ROBOCZA · eef4e87e · 2026-08-04 22:25` |
| **Commit main** | `c44a190` (cleanup po deploy `f316c6f`) |
| **Wejście** | `gra-robocza/START.html` — git pull + Ctrl+F5 + **Nowa gra** |

Maciej potwierdził **OK** na FALA 223 i FALA 224.

---

## 2. ŁAŃCUCH DEPLOY (ta sesja / wieczór)

| FALA | md5 short | Batch |
|------|-----------|--------|
| **222** | `132401ef` | R-BATTLE-TEMPO-UI Q1=A Q2=B · R-BUDYNKI-NIEAKTYWNE Q1=A Q2=A+C Q3=A · R-BUDOWA-ZROWNOWAZONE-TRYB Q1=A · R-CITY-PILL-SHIELD-EMBLEM |
| **223** | `ee0e7e04` | R-PILL-TARCZA-BEZ-MURU-Q1=A · R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A |
| **224** | `38df6ad7` | R-REKRUT-LUDNOSC-UI (teksty UI) + docs zamknięcie zrównoważonego |

Źródło prawdy md5: **`dyspozycje/WERSJE.md`**.

---

## 3. ABC / DECYZJE (ECHO → wdrożenie)

| ID | Decyzja | Status | Docs |
|----|---------|--------|------|
| **R-PILL-TARCZA-BEZ-MURU-Q1** | **A** — tarcza pigułki wyłącznie z `wallKind` (= model 3D); bez `maMur` | ZDEPLOYOWANE FALA 223 | `docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md` |
| **R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1** | **A** — WŁ Zwiedzaj: zostań zaznaczony + złota ramka od razu (bez deselect/cycle) | ZDEPLOYOWANE FALA 223 | `docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md` |
| **R-BUDOWA-ZROWNOWAZONE-TRYB-Q1** | **A** — zrównoważony = osobny tryb auto (nie 6. chip priorytetu) | ZDEPLOYOWANE FALA 222→223 · **playtest OK** | `docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md` |
| **R-REKRUT-LUDNOSC-UI** | Audyt + fix UI (bez nowego ABC) — kanon `jednostka_koszt_ludnosci=0` od 2026-07-21 | ZDEPLOYOWANE FALA 224 | `docs/decyzje/R-REKRUT-LUDNOSC-UI.md` |

### R-REKRUT-LUDNOSC-UI — werdykt (ważne dla agentów)

- **Rekrutacja NIE odejmuje** `city.population` (tylko Manpower).
- Realny −1 ludności: **głód** (brak dopłaty centrali) / założenie miasta / bunt.
- Spichlerz nie zabiera obywateli bezpośrednio.
- UI w `cityPanel.ts` kłamało „−1 obywatela” → poprawione w FALA 224.

---

## 4. PLAYTESTY MACIEJA (ta sesja)

| Temat | Wynik |
|-------|--------|
| FALA 223 (tarcza + Zwiedzaj) | **OK** |
| R-BUDOWA-ZROWNOWAZONE-TRYB | **OK** |
| FALA 224 (teksty rekrutacji) | **OK** |
| R-BUDYNKI-NIEAKTYWNE | checklista podana — **jeszcze bez OK/BUG** |

---

## 5. CLEANUP REJESTRU (docs, `c44a190`)

Stare etykiety „bez deploy” / „czeka deploy” poprawione m.in.:

- R-GRACZ-WCHLONIECIE → **ZDEPLOYOWANE FALA 206** (już było w ROBOCZA od dawna)
- C-ARMY-HUNGER-Q1 → **ZDEPLOYOWANE FALA 36**
- P-AI-017 → **ZDEPLOYOWANE** (PR #22, łańcuch do 224)
- Usunięte śmieci „czeka deploy” przy już ZDEPLOYOWANE (221/222)

PR #104 · na `main`.

---

## 6. KOLEJKA DLA NASTĘPNEGO AGENTA

### Realnie otwarte (nie „fałszywy bez deploy”)

1. **R-BUDYNKI-NIEAKTYWNE** — playtest (czerwona nazwa + `Brak: …`) — w ROBOCZA od FALA 222
2. **R-WIARYGODNOSC** — CZEKA-NA-DECYZJĘ (strojenie §9, później)
3. **R-DESIGN-PANEL-MIASTA** — prototyp w ROBOCZA; hover/v2 czeka Design
4. **R-PANEL-SPLIT** / **R-SUROWCE-UI-ZERO** — stary backlog NOWE
5. **P-AI-MOC-GAP** — częściowo FALA 220, bez zamknięcia playtestem
6. **R-DOTYK-MVP** — ODŁOŻONE

### ZAKAZY

- Deploy tylko na hasło Macieja **`deploy`**
- Nie `npm run build` / `npm run dev` w `gra/`
- Nie otwierać nowych wątków ABC bez zgody — pytania cicho do `PYTANIA-OTWARTE.md`

---

## 7. PLIKI KLUCZOWE

| Plik | Rola |
|------|------|
| `dyspozycje/WERSJE.md` | md5 / FALA AKTUALNA |
| `dyspozycje/_handoff/KANAL-PRACA.md` | meldunki między sesjami |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | status próśb |
| `dyspozycje/PYTANIA-OTWARTE.md` | otwarte pytania/bugi |
| `docs/MACIEJ-GOTOWE.md` | co Maciej może brać |
| `docs/decyzje/R-*.md` | decyzje ABC tej fali |
| `STAN-PRACY-HANDOFF.md` | punkt wejścia sesji |

---

*Zapisane 2026-08-05 ~00:40 PL · Cloud Integrator.*
