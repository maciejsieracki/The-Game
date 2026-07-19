# STAN SESJI 2026-07-09/10 — RZEKI + DRZEWKO TECH + TEREN + MIASTA — punkt wznowienia

> Napisane 2026-07-10 ~15:00 jako audyt kompletności dokumentacji (nie chat-log — synteza analityczna).
> Jeśli wracasz po resecie kontekstu, przeczytaj TEN plik pierwszy, potem `START-TU.md` (obieg pracy)
> i memory `civ-game-tech-tree-plan.md`. Zanim uznasz cokolwiek za „zrobione" — sprawdź `git log -1`
> w repo Civ, bo rzeki były w iteracji RÓWNOLEGLE z pisaniem tego audytu.

## 1. Rzeki — ROZSTRZYGNIĘTE (styl finalny: kanciasty)

Sześć iteracji renderu 2026-07-09/10 (centrolinia → wall-hugging+Chaikin → CatmullRom naturalny →
**kanciasty finalny**). Ostatni stan zacommitowany: **`3d5da76`** (2026-07-10 14:31, stempel ROBOCZA
**`3dec388b`**) — trasowanie krawędziowe, `sharp=true`, zero wygładzania, rzeka wewnętrzną stroną
ścianki wzdłuż ≥2 boków heksa, dochodzi do morza. Render-only, determinizm generatora nietknięty.
Pełna historia iteracji + decyzje: `RZEKI-MODEL-PELNY-PLAN.md` (sekcja „STAN NA 2026-07-10" na końcu),
diagnoza ujść: `RZEKI-DIAGNOZA-UJSCIA.md`.
**UWAGA:** audyt zastał NIEZACOMMITOWANE zmiany w `gra/src` (m.in. `main.ts`, `cityPanel.ts`,
`production.ts`, `loader.ts`, `tech.json`, `buildings.json`) — równoległa sesja pracuje dalej w chwili
pisania tego pliku. Traktuj `3d5da76` jako ostatni PEWNY (zacommitowany) punkt, nie jako ostateczność.

## 2. Teren — ZATWIERDZONE

`terrainCellBias` (komórka = 4 heksy, bias deterministyczny z hash) rozbija jednolite plamy
Równiny/Łąka na mozaikę, proporcja ~35/65 zachowana. **Zatwierdzone przez Macieja 2026-07-10**
(„równiny i trawy równo pomieszane, plamy rozbite" = sukces). Wchłonięte w build `9c58ebc2` →
`3dec388b`. Wcześniejsza próba „TEREN A" (szum HF, `gen-helpers.ts`) była COFNIĘTA (niekompletna,
psuła tsc) — nie mylić z `terrainCellBias`, który jest INNYM, udanym podejściem.

## 3. Miasta — WPIĘTE

Modele kamień (`miasto-kamien.ts`, P1–P10, zatwierdzone przez Macieja z korektą progresji) i brąz
Grecja/Rzym (`miasto-braz.ts`, router per-cywilizacja) wpięte w `cities.ts` (`buildSettlementModelForStyle`):
era1=kamień, era2=brąz Grecja/Rzym, era3+ = fallback brąz. Inne cywilizacje brązu (Sumer, Egipt…)
zostają na starym `buildBronzeCityRoblox` do czasu własnych partii. Niezweryfikowane wzrokowo:
miasto epoki Kamień w realnej rozgrywce (brak trybu playtest startującego w erze 1).

## 4. Drzewko technologii — CZĘŚCIOWO ZROBIONE, restrukturyzacja OTWARTA

**Zrobione i wdrożone** (build `22bb83a5` → `3dec388b`, dyspozycja `DRZEWKO-TECH-FIX.md`):
bramka „wymagane ulepszenie" (Żegluga→Tartak), Obróbka żelaza→„Piec hutniczy", pole jawne
`awansDoEpoki` (Brązownictwo→2, Obróbka żelaza→3), 20 jednostek żelaznych pod właściwe techy,
Kusznik usunięty, Astronomia→Obserwatorium (nowy tech+budynek), Prawo (Kodeks)→Trybunał (nowy budynek).
Testy zielone (tech-tree 19/0, research 33/0, harness ery 14/0).

**Otwarte / niezaimplementowane:**
- **Restrukturyzacja 3-tier per epoka** — 9 propozycji zmian połączeń (D1–D9) w
  `DRZEWKO-TECH-ANALIZA-CIV.md` — **niezatwierdzona przez Macieja** (analiza, nie decyzja).
- **Dwie zasady progresji epok** (Maciej, później tego samego dnia): (1) twarda bramka —
  cała epoka odkryta przed odblokowaniem następnej; (2) tech-awans zawsze na T3 epoki —
  wymaga przeniesienia Obróbki żelaza z „T1 Żelaza" na „T3 Brązu" koncepcyjnie. **Koliduje
  z §8 `DRZEWKO-TECH-ANALIZA-CIV.md`** („awansDoEpoki bez zmian") — patrz §9 dopisany tam
  2026-07-10 flagujący tę kolizję. Do złączenia z D1–D9 przy następnym podejściu.
- **Chiński unikat** — po usunięciu Kusznika, Chiny budują bazowy Łucznik; opis w `civs.json`
  („Kusznik: lepszy łucznik") niespójny. Decyzja produktowa czym zastąpić — niepodjęta.
  **[ZAŁOŻENIE — do potwierdzenia]**
- **Panele Excel niezsyncowane** — `tech.json`/`units.json`/`buildings.json` zmienione, `gen-panel-*.py`
  nieodpalony (ryzyko nadpisania — celowo wstrzymane).
- `demoKeysForHex` nie seeduje `kopalnia_miedzi` (staleness trybu demo, drobne).

## 5. Deliverables

`dyspozycje/DRZEWKO-TECH-UKLAD-3TIER.xlsx` (2026-07-10 14:44) + `dyspozycje/DRZEWKO-TECH-UKLAD-3TIER.svg`
(14:53) — eksport wizualny propozycji 3-tier z `DRZEWKO-TECH-ANALIZA-CIV.md`. Osobno: Maciej poprosił
o **eksport CAŁEGO drzewka do Excela z kosztami** (+ prereq/unlock/epoka) do samodzielnego dostrojenia
kosztów — źródło `gra/data/tech.json`, narzędzie prawdopodobnie `gra-robocza/tools/build-tech-excel-mirror.py`
lub `panele-sterowania/gen-panel-*.py`. **Ten drugi eksport (z kosztami) nie jest potwierdzony jako
zrobiony** — sprawdź czy istnieje przed założeniem, że temat zamknięty.

## 6. Stan techniczny

- **`gh auth` wygasł** — `git push` wstrzymany od rana 2026-07-10; wszystkie commity dnia (79eb3159 →
  3dec388b) są lokalne na `main`, niepushnięte na GitHub. Wymaga `gh auth login` (Maciej).
- **Model tierów:** ROBOCZA (bieżąca iteracja, `gra-robocza/Gra-ROBOCZA.html`) → KANON (jedna pewna
  wersja, `publish-kanon-snapshot.ps1`) → FINALNA (raz dziennie). Ostatnia promocja do KANONU:
  `dee7140d` (2026-07-09) — **cały dzisiejszy ciąg (rzeki/teren/miasta/drzewko) jest jeszcze TYLKO
  w ROBOCZA, NIE promowany do kanonu/finalnej.**
  Reguła: `gra/src` = CANON źródła (superset, buduje się z niego); `gra-robocza/srcKopiaMaster` =
  zamrożone lustro od 2026-07-08, NIE budować z niego. Pełne zasady: memory `civ-game-canon-build.md`.
- **Quirk `inject-build-stamp`:** stempel = pierwsze 8 znaków md5 pliku PO wstawieniu placeholdera
  `CIV-BUILD-STAMP-PENDING`; weryfikacja HOST-side (grep na wgranym pliku, nie na /tmp) obowiązkowa —
  historyczne przypadki deployu niestemplowanej kopii (patrz `_handoff/KANAL-PRACA.md`, incydent
  2026-07-06 ~03:50).
- Runbook deployu (potwierdzony, używany cały dzień 07-10): build `gra/` przez
  `node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir` → kopia do
  `gra-robocza/Gra-ROBOCZA.html` → `inject-build-stamp.ps1 -Tier ROBOCZA` → update
  `ROBOCZA-MANIFEST.json` → `sync-playtest-bundles.cjs` → `verify-robocza-bundle.cjs` (VERIFY OK) →
  2 commity (source + HTMLe+manifest). **Rejestr wersji: `WERSJE.md` — zaktualizowany tym audytem
  dla całego dnia 2026-07-10** (wcześniej brakowało wpisów, mimo reguły „po każdym publishu").

## Linki do pełnej historii

- Rzeki: `RZEKI-MODEL-PELNY-PLAN.md`, `RZEKI-DIAGNOZA-UJSCIA.md`
- Drzewko: `DRZEWKO-TECH-FIX.md` (zrobione), `DRZEWKO-TECH-ANALIZA-CIV.md` (propozycja 3-tier, §9 = kolizja z zasadami progresji), `REFERENCJA-CIV6-DRZEWKO-TECH.md` (materiał źródłowy)
- Wersje/stemple: `WERSJE.md`
- Build/kanon: memory `civ-game-canon-build.md`
- Pełny stan sesji + decyzje ABC: memory `civ-game-tech-tree-plan.md`
