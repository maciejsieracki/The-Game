# Grupa F (Silnik) — KOLEJKA P0 (Master → F)

> **Czytaj TEN plik pierwszy** przy `master` / starcie czatu F.  
> **Nie** zamykaj kolejki dopóki wszystkie wiersze ≠ ZROBIONE + `→ MASTER: GOTOWE-ROBOCZA`.

**Ustalenie Master (2026-06-27):** wcześniejszy Master zamykał kolejkę F jako „PUSTA” i sam patchował `main.ts` — Maciej nie dostawał poprawek na czas. **Od teraz: F = owner bramki + publish + raport.**

**Dodatkowo (Grupa E ABC 12=A):** kreator mockupów `Makieta-flow-nowa-gra.html` → **`Gra-podglad-ROBOCZA.html?from=kreator`** (prawdziwy silnik, nie statyczny canvas D1B).

---

## P0 — Grupa B lane→F: **PUSTA** (domknięte 2026-06-29)

Wszystkie batche B1 wpięte. Meldunek lane: `_handoff/GRUPA-B-do-SILNIK_rozpoznanie-2026-06-29.md`

| ID | Status |
|----|--------|
| F-B-PILNE | ✅ |
| F-B-WYRAB-TARTAK | ✅ |
| F-B-TARTAK-DREWNO | ✅ |

**Lane dalej (nie F):** EKO-P2-01 → `EKONOMIA.md` · B1 tech → czeka ABC Macieja

---

## P0 — ZROBIONE (archiwum Grupa B)

| ID | Zadanie | Status |
|----|---------|--------|
| **F-B-WYRAB-TARTAK** | Wyrąb FREE + Tartak + tech gate | **ZROBIONE** 2026-06-28 md5 `e87a5ca2…` |
| **F-B-PILNE** | Luki panel miasta + ekonomia | **ZROBIONE** 2026-06-28 md5 `be6f0ff4…` |

**Moduły lane (już gotowe — NIE edytuj):**
- `gra/src/game/resource-access.ts`
- `gra/src/game/society-inputs.ts`
- `gra/src/game/army-starvation.ts`
- `gra/src/ui/cityPanel.ts` (Społeczeństwo %, nagłówek Porządek)

**UNITS (ten sam batch):** `dyspozycje/_handoff/UNITS-do-SILNIK_army-starvation-hp.md` (§4 handoffu PILNE)

**Indeks zadań Grupa B:** `dyspozycje/GRUPA-B-ZADANIA-PILNE.md`

**Flaga od B:** `→ SILNIK: GOTOWE — PILNE` w `docs/czaty/DO-MASTERA.md` (wpis F-B-PILNE) · **Następny:** **F-B-WYRAB-TARTAK** (flaga GOTOWE w DO-MASTERA § F)

**Backup:** `main.ts.bak-SILNIK-20260627-pilne-luki`

**Testy przed meldunkiem:** `node tools/grupa-b-lane-test.cjs` · `node tools/society-breakdown-test.cjs` · smoke

---

## P0 — ZROBIONE (archiwum)

| ID | Zadanie | Pliki | DoD | Status |
|----|---------|-------|-----|--------|
| **F-P0-01** | **Bramka + publish** | `gra/tools/bramka-test-publish.ps1` | PASS → `Gra-podglad-ROBOCZA.html` + `Gra-podglad-PLAYTEST-WALKA.html` + md5 w raporcie | **ZROBIONE** 2026-06-27 |
| **F-P0-02** | **A-START batch** (playtest Maciej) | `main.ts`, `setup.ts`, `scene.ts`, `minimap.ts`, `minimapHud.ts`, `buildModeHud.ts`, `victory.ts`, `diplomacy.ts` | Nowa gra: **0 jednostek**, auto 🔨 **Załóż miasto**, kamera blisko, rzeki w mgle, minimap=fog, brak przegranej tury 1–2, brak crash dyplomacji | **ZROBIONE** (+ fix TDZ `playerStartHex`, `diplomacy` guard) |
| **F-P0-03** | **Playtest walki mapa** | `playtestWalkaMapy.ts`, `main.ts`, publish PLAYTEST | Dwuklik PLAYTEST-WALKA → armia + miasto AI + atak → preBattle → bitwa 3D | **ZROBIONE** (battle-smoke OK) |
| **F-P0-04** | **Raport do Mastera** | `SILNIK-DO-MASTERA.md`, `DO-MASTERA.md` § F | `→ MASTER: GOTOWE-ROBOCZA` + md5 + lista PASS testów | **ZROBIONE** |

---

## P1 — po P0

| ID | Zadanie | Owner współpracy | Status |
|----|---------|------------------|--------|
| **F-P1-B2** | society-pct + grace B2-Q12 | EKONOMIA+UI handoff | **ZROBIONE** 2026-06-27 |
| **F-P1-E1** | grantTechEpokWczesniejszych | Grupa E ABC 2=B* | **ZROBIONE** 2026-06-27 |
| **F-P1-PROD** | spawn jednostki z produkcji | Master P1 | **ZROBIONE** 2026-06-27 |
| F-P1-01 | Wpięcie C3 atak miasta z mapy | czeka **Grupa A** → potem F | CZEKA |
| F-P1-02 | `deploy:false` po spec A (pozycje z mapy) | handoff A | CZEKA |
| F-P1-03 | Excel `Status-projektu-The-Game.xlsx` → arkusz Grupa-F | sync po każdym batchu | TODO |

---

## Handoffy szczegółowe

- `dyspozycje/_handoff/MASTER-do-F_playtest-walka-mapa.md`
- `dyspozycje/_handoff/MASTER-do-A_astart-p0-maciej.md` (A = polish; F = bramka + main.ts owner)

---

## Raport (szablon — wklej do DO-MASTERA § F)

```
### [DATA] → MASTER: GOTOWE-ROBOCZA

Od: Grupa F
Plik: Gra-podglad-ROBOCZA.html (md5: …)
PLAYTEST: Gra-podglad-PLAYTEST-WALKA.html (md5: …)
Testy: wire … · logic … · smoke … · battle-smoke …
Batch: F-P0-01…04
→ MASTER: playtest Maciej (checklista w czacie Master)
```

---

## ZAKAZ

- Pisać **„kolejka pusta”** gdy Maciej ma otwarte bugi playtestu.
- Prosić **Macieja** o bramkę / Node — raportuj `BLOK BRAMKA` do Mastera.
- Promować `Gra-podglad.html` (tylko Master po Opus).
