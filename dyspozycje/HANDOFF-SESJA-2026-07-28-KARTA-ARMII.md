# HANDOFF — sesja 2026-07-28 (karta armii + HUD FALA 50–56)

**Dla:** nowego agenta / nowej sesji (Maciej zaczyna od nowa)  
**Data zapisu:** 2026-07-28 ~12:10  
**Powód:** poprzednia sesja wykrzaczała się przy deployu (przerwany build ~1h); dokumentacja rozjechana z manifestem — **zsynchronizowano 12:05** (`fed92ad1`).

---

## 1. CO POWIEDZIEĆ NOWEMU AGENTOWI (wklejka 1:1)

```
Kontynuuj Civ z pliku: dyspozycje/HANDOFF-SESJA-2026-07-28-KARTA-ARMII.md

Priorytet P0:
1) Zweryfikuj ROBOCZA: manifest gra-robocza/ROBOCZA-MANIFEST.json vs dyspozycje/WERSJE.md — powinno być **`fed92ad1`** (FALA 56, 12:05).
2) Potwierdź w grze (Ctrl+F5, Nowa gra):
   - Po połączeniu jednostek: karta = „Armia · (q,r)" + mini-karty składu + 2 paski (HP zielony, ruch niebieski) na żetonach (FALA 54–55).
   - HUD mapa: lewy jeden rząd Skarbiec·Praca·Spichlerz·Nauka·Handel (bez 🍞); prawy klaster przy zoom UI; zoom ± i ⛶ pod minimapą (FALA 56).
   - HUD miasto: lewo Praca·Żywność·Skarbiec; prawo Nauka·Kultura·Religia (FALA 56).
3) Jeśli stary bundle — redeploy FALA 50–56 (patrz §7).

Priorytet P1 (kolejka Macieja, NIE wdrożone):
- Handel AI: puste propozycje umów, brak walidacji magazynów (planowana FALA 54+ handel — patrz §5).
- Przyciski Połącz/Rozdziel/Lista na karcie armii (patrz §4 P1).

Zasady deployu (NIE łamać):
- NIGDY npm run build / npm run dev w gra/
- Build: cd gra → node ./node_modules/vite/bin/vite.js build --outDir $env:TEMP\civ-dist --emptyOutDir
- Publish: gra/tools/publish-robocza-snapshot.ps1
- Bramki OSOBNO (nie jeden łańcuch godzinny): npx tsc --noEmit → node tools/smoke.cjs → build → publish
- PowerShell: średnik ; zamiast &&
- Po publish: WERSJE.md + KANAL-PRACA.md + docs/MACIEJ-GOTOWE.md + ten plik + STAN-PRACY-HANDOFF.md §1

Pliki kodu karty armii: hexContextTooltip.ts, sidePanelHud.ts, main.ts (~3409–3523).
Pliki HUD FALA 56: hud.ts, cityPanel.ts, minimapHud.ts, sidePanelHud.ts.
Stary dolny pasek armyStackHud.ts — celowo wyłączony (buildArmyStackHudState() → null).
```

---

## 2. STAN ROBOCZA (zsynchronizowano 2026-07-28 12:05)

| Źródło | md5 (skrót) | Co twierdzi |
|--------|-------------|-------------|
| `gra-robocza/ROBOCZA-MANIFEST.json` | **`fed92ad1`** | publish 2026-07-28 12:05 |
| `dyspozycje/WERSJE.md` | **`fed92ad1`** = AKTUALNA | FALA 56 — HUD mapa + miasto + dock minimapy (redeploy potwierdzający) |
| `STAN-PRACY-HANDOFF.md` | **`fed92ad1`** FALA 56 | zsynchronizowane |
| `docs/MACIEJ-GOTOWE.md` | **`fed92ad1`** | zsynchronizowane |

**Wniosek:** bundle na dysku zawiera **FALA 50–56** w jednym pakiecie. Poprzedni `52bb743b` (11:53) miał ten sam zakres kodu; `fed92ad1` = świeży build + pieczęć po audycie Macieja.

---

## 3. ZROBIONE W KODZIE ŹRÓDŁOWYM (`gra/src`)

### FALA 50–53 (zdeployowane wg WERSJE, md5 do `b337e2e0` / `5162a385`)

| FALA | Temat | Pliki |
|------|-------|-------|
| 50 | Etykiety HUD przy zoomie, zoom przy minimapie, tooltip budowy | hud.ts, sidePanelHud, hexContextTooltip |
| 51 | Wydarzenia max 50vh, toasty na `<html>` | hud.ts, sidePanelHud |
| 52 | Karta jednostki lewy-dół nad minimapą (`.civ-side-ctx-dock`) | sidePanelHud.ts, hud.ts |
| 53 | Rzeka = 1 MP (`RIVER_HEX_MOVE_COST = 1`) | units/setup.ts, river-terrain-move-test |

### FALA 54 — karta armii (kod ✅, deploy wg WERSJE `5162a385`)

**Pliki:**
- `gra/src/main.ts` — `buildUnitContextTooltipForUnit`, `buildContextPanelData`
- `gra/src/ui/hexContextTooltip.ts` — `buildUnitContextTooltipHtml`, stack cards
- `gra/src/ui/sidePanelHud.ts` — `headLabel` w `ContextPanelData`

**Zachowanie:**
- Stos >1: `displayName` = `Armia · (q,r)` (hexLabel ze stackState)
- `headMeta` = „N jednostek na heksie”
- `headLabel` panelu = „Armia”
- Mini-karty składu (`stackCards`) **od razu**, nie tylko po „Więcej szczegółów”
- Akcje (Ufortyfikuj, Pomiń, Rozwiąż) — bez zmian, z `stackState?.actions`

### FALA 55 — paski na żetonach armii (kod ✅, deploy ✅ `9bd4a0f6` → potwierdzone w `fed92ad1`)

**Plik:** `gra/src/ui/hexContextTooltip.ts`

- `buildUnitStackBarHtml()` — pasek HP (zielony) + pasek ruchu (niebieski)
- Na każdym żetonie: ikona, nazwa, **2 paski**, tekst `22/22 · 2/2`
- CSS: `.sp-unit-stack-bars`, `.sp-unit-stack-bar-hp`, `.sp-unit-stack-bar-mov`

**Typecheck:** przechodził (`npx tsc --noEmit` OK przed deployem).

### FALA 56 — HUD mapa + miasto + dock minimapy (kod ✅, deploy ✅ `fed92ad1`)

**Pliki:** `hud.ts` · `cityPanel.ts` · `minimapHud.ts` · `sidePanelHud.ts`

**Mapa:**
- Lewy pasek: jeden rząd **Skarbiec · Praca · Spichlerz · Nauka · Handel** (nowrap)
- Spichlerz: **bez emoji 🍞** przy liczbach
- Prawy klaster (Civpedia + Menu): widoczny także przy zoom UI 110–150%
- Minimapa: przyciski **− 100% +** i **⛶** pod minimapą (lewa krawędź 280px)

**Miasto:**
- Lewo: jeden rząd **Praca · Żywność · Skarbiec** (ikony brand, nowrap)
- Prawo przy nazwie miasta: **Nauka · Kultura · Religia** (ta kolejność, jeden rząd)

**Uwaga:** `52bb743b` (11:53) miał ten sam zakres; `fed92ad1` (12:05) = redeploy potwierdzający po audycie.

---

## 4. NIE ZROBIONE / DO ZROBIENIA

### P0 — operacyjne (nowy agent)

- [x] **Zsynchronizować dokumentację** z faktycznym md5 bundla (`fed92ad1` — 2026-07-28 12:05)
- [x] **Potwierdzić deploy FALA 55** (paski) — w bundle `fed92ad1` ✅
- [x] **Potwierdzić deploy FALA 56** (HUD mapa+miasto+dock) — `fed92ad1` ✅
- [x] **Zaktualizować** `STAN-PRACY-HANDOFF.md` sekcja 1
- [x] **Zaktualizować** `REJESTR-PROSB-I-ZADAN.md` (R-KARTA-ARMIA-2, R-HUD-*)
- [ ] **Commit** zmian w `gra/src` jeśli Maciej chce (nie commitowano w tej sesji)

### P1 — karta armii (Maciej, ze starej planszy)

Ze starego `armyStackHud.ts` **nie przeniesione** do nowej karty bocznej:

- [ ] Przyciski **Połącz** / **Rozdziel** w nagłówku karty (merge/split — panele `armyMergePanel` / `armySplitPanel` istnieją osobno)
- [ ] Strzałki **◀ ▶** przełączania aktywnej jednostki w stosie
- [ ] Przycisk **Lista** armii (`armyListHud`)
- [ ] Pasek HP na żetonie w starym HUD był bez osobnego paska ruchu — **nowy wymóg Macieja:** oba paski (zrobione w kodzie FALA 55, deploy ✅ `fed92ad1`)

### P1 — handel AI (diagnoza z sesji, **zero kodu**)

Maciej zgodził się na naprawę w kolejnej fali:

- [ ] `zaproponuj_umowe_handlowa` — często pusty `{}` → pusta karta UI
- [ ] `basketItemsAffordable` w `main.ts` — nie sprawdza `surowiec_ilosc`
- [ ] AI sprawdza złoto tylko na 1 turę, nie na cały cykl umowy
- [ ] Użyć `computeQuickDealBasket` z `diplomacy-pn-engine.ts` dla propozycji AI

### P2 — z rejestru próśb (otwarte, nie ta sesja)

Patrz `dyspozycje/REJESTR-PROSB-I-ZADAN.md`: R-PANEL-SPLIT, R-SUROWCE-UI-ZERO, R-CIVPEDIA, R-FULLSCREEN-PASEK, R-HANDEL-AI (szczegóły §5).

---

## 5. DECYZJE ABC (ta sesja)

**Brak nowych formalnych ABC** — to były prośby implementacyjne Macieja (UX karty armii), nie pytania A/B/C.

| Temat | Decyzja | Status |
|-------|---------|--------|
| Nazwa armii zamiast typu lidera | Maciej: tak, jak stara plansza | ✅ kod FALA 54 |
| Skład widoczny bez „Więcej szczegółów” | Maciej: tak | ✅ kod FALA 54 |
| Paski HP + ruch na żetonach | Maciej: tak (oprócz tekstu) | ✅ kod FALA 55 · deploy **`9bd4a0f6`** → potwierdzone w **`fed92ad1`** |
| HUD mapa nowrap + Spichlerz bez emoji | Maciej: tak | ✅ kod FALA 56 · deploy **`fed92ad1`** |
| HUD miasto lewo/prawo + zoom dock | Maciej: tak | ✅ kod FALA 56 · deploy **`fed92ad1`** |
| Handel AI | Maciej: naprawić (sesja wcześniejsza) | ❌ nie wdrożone |

---

## 6. MAPA PLIKÓW (karta jednostki / armia)

```
gra/src/main.ts
  buildUnitContextTooltipForUnit()  ~3409
  buildContextPanelData()           ~3493
  buildArmyStackHudState()          → null (stary dolny pasek OFF)
  buildArmyStackHudStateInner()     ~12203 — dane stosu + actions

gra/src/ui/hexContextTooltip.ts
  UnitContextTooltipInput (headMeta, stackCards)
  buildUnitStackCardsHtml()         — żetony + paski
  buildUnitContextTooltipHtml()

gra/src/ui/sidePanelHud.ts
  ContextPanelData.headLabel
  .civ-side-ctx-dock — pozycja karty jednostki (lewy-dół, nad minimapą)

gra/src/ui/armyStackHud.ts — REFERENCJA starego UI (nie montowany)
gra/src/ui/hud.ts — setArmyStackHudSuppressed (tylko preBattle)
```

---

## 7. BRAMKI (kolejność dla agenta)

```powershell
cd gra
npx tsc --noEmit
node tools/smoke.cjs
node tools/river-terrain-move-test.cjs   # jeśli ruszano rzekę
node ./node_modules/vite/bin/vite.js build --outDir $env:TEMP\civ-dist --emptyOutDir
.\tools\publish-robocza-snapshot.ps1
```

Po publish dopisz do `WERSJE.md` (format jak FALA 54) i wpis w `KANAL-PRACA.md`.

---

## 8. CO POSZŁO ŹLE (nie powtarzać)

1. **Jeden długi łańcuch** tsc+smoke+build+publish → użytkownik przerwał po ~62 min — agent „wisiał”.
2. **Deploy bez aktualizacji WERSJE** — manifest `9bd4a0f6` vs WERSJE `5162a385`.
3. **STAN-PRACY-HANDOFF.md** nie aktualizowany od FALA 44 — mylący punkt wejścia.
4. Subagent w tle **nie dokończył** pracy — rodzic musiał dokończyć ręcznie.

---

## 9. WPIS DO REJESTRU PRÓŚB (dopisany)

| ID | Data | Prośba | Status |
|----|------|--------|--------|
| R-HUD-MIASTO-UKLAD | 2026-07-28 | HUD miasto: lewo Praca·Żywność·Skarbiec, prawo Nauka·Kultura·Religia | **ZDEPLOYOWANE** FALA 56 · **`fed92ad1`** ✅ |
| R-HUD-ZOOM-DOCK | 2026-07-28 | Zoom ± i ⛶ pod minimapą (280px, lewa krawędź) | **ZDEPLOYOWANE** FALA 56 · **`fed92ad1`** ✅ |
| R-HUD-MAPA-NOWRAP | 2026-07-28 | HUD mapa: lewy/prawy nowrap, Spichlerz bez 🍞, prawy klaster przy zoom UI | **ZDEPLOYOWANE** FALA 56 · **`fed92ad1`** ✅ |
| R-KARTA-ARMIA-1 | 2026-07-28 | Po merge: nazwa armii + skład od razu (nie tylko typ lidera) | **ZDEPLOYOWANE** FALA 54 · **`5162a385`** (w bundle `fed92ad1`) |
| R-KARTA-ARMIA-2 | 2026-07-28 | Paski HP + ruch na żetonach składu armii | **ZDEPLOYOWANE** FALA 55 · **`9bd4a0f6`** (w bundle `fed92ad1`) ✅ |
| R-HANDEL-AI-FALA | 2026-07-28 | AI handel: sensowne koszyki, magazyny, cap złota | **NOWE** — nie zaczęte |

---

*Koniec handoffu. Następny agent: zacznij od §1 wklejki + §2 weryfikacji md5.*
