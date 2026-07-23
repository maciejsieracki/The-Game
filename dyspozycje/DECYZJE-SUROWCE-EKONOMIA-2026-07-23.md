# DECYZJE — SUROWCE / EKONOMIA (2026-07-23, sesja chmurowa)

Rejestr decyzji Macieja i stanu prac nad przebudową modelu surowców. Punkt wejścia dla
każdej sesji/agenta kontynuującego temat. Skrót w KANAL-PRACA.md; żywy stan w STAN-PRACY-HANDOFF.md.

## A. DECYZJE (zatwierdzone przez Macieja)

| # | Decyzja | Status |
|---|---|---|
| 1 | **Bydło/Owce/Lama = NIE surowce** — tylko ulepszenia terenu dające bonus żywności/produkcji. Surowcem „zwierzęcym" jest wyłącznie **Koń**. | ✅ wdrożone `d6c4f33` |
| 2 | **Model składowania:** zliczają się WSZYSTKIE surowce OPRÓCZ: **Żywność** (spichlerz, osobny system), **Sól** (dostęp), **Koń** (dostęp), **Ceramika** (dostęp). Reszta = sztuki w magazynie miasta. | ✅ wdrożone `f136c09` |
| 3 | **Ceramika = tylko DOSTĘP.** Garncarnia NIE konwertuje glina→ceramika (receptura usunięta). Koszt 3 budynków ceramika→**cegła**: Karawanseraj 4, Świątynia 6, Biblioteka 5. Ceramika usunięta z katalogu cen handlu. | ✅ wdrożone `f136c09` |
| 4 | **Produkcja BEZ pracowników.** Ulepszenie w terenie produkuje bazową stawkę NIEZALEŻNIE od obsady ludnością i zasięgu pracy miasta; produkcja przypisana do najbliższego miasta właściciela (po terytorium). Naprawiony stary przeciek: bazowy plon terenu (np. Równina drewno=2) wpadał do magazynu nawet bez ulepszenia. | ✅ wdrożone `f136c09` |
| 5 | **Stawki wydobycia** (JSON `terrain-improvements.json` → `surowiec_ilosc_tura`): Tartak→drewno **4**, Kamieniołom→kamień **4**, Glinianka→glina **4**, Kopalnia miedzi→ruda **2**, Kopalnia (złoże żelaza)→ruda_zelaza **2**. Konwertery bez zmian tempa. | ✅ wdrożone `f136c09` |
| 6 | **Żelazo = produkowane w mieście** (Odlewnia/Kuźnia żelaza), nie wydobywane. Ruda żelaza = wydobywana (Kopalnia). | ✅ (licznik to odzwierciedla) |
| 7 | **Manpower regen = 2%** (zostaje; spójne z opisem bonusu Rzymu „2×→4% vs 2%"). „5%" to relikt starego tekstu. | ✅ bez zmian |
| 8 | **Spichlerz II** bramkuje się na **dostępie do Soli** (Warzelnia soli daje sól). Pole `techUnlock="Warzelnia soli"` jest semantycznie bramką surowcową — POPRAWNE, nie ruszać. | ✅ bez zmian |
| 9 | **USUŃ całkowicie Paliwo (surowiec) + Mielerz (budynek).** Konwertery biorą **drewno 1:1** zamiast paliwa (Cegielnia 2 glina+1 drewno; Piec hutniczy 1 ruda+1 drewno; Odlewnia żelaza 1 ruda_zelaza+1 drewno). | ⏳ subagent `aa4a6fecf55865ad0` |
| 10 | **Bonusy budynków produkcyjnych** (parametr JSON 10%, placeholder): **Stolarnia** +10% drewna CAŁEJ CYWILIZACJI/szt (civ-wide, stackuje); **Warsztat kamieniarski** +10% kamienia civ-wide/szt; **Garncarnia** +10% żywności **LOKALNIE** (miasto gdzie stoi). Istniejące efekty zachować, bonus na wierzchu. | ⏳ subagent `aa4a6fecf55865ad0` |
| 11 | **Koszty budynków** (`koszt_surowce`) — tabele Kamień/Brąz/Żelazo (wartości STARTOWE do strojenia w grze). Kamień: tylko drewno/kamień. Ceramika NIE jest kosztem. | ⏳ subagent `aa4a6fecf55865ad0` |
| 12 | **CUDA-AI = A:** AI pełnych cywilizacji buduje cuda (progi ai-params.json §9 = placeholdery). | ✅ wdrożone + deploy `aa3c9b06` |
| 13 | **Wonder-bonusy w ekonomii = A (wpiąć).** Dziś bonusy cudów NIE są wpięte dla nikogo (tylko tekst UI). Osobny subagent PO dedykowanym przebiegu surowców (kolizja w economy.ts). | ⏳ do zrobienia |
| 14 | **Reguła ×2-jeśli-obsadzone:** ROZWAŻANA — jeśli ludność pracuje na ulepszeniu, podwaja produkcję surowca (żywność wyłączona). Dziś: płaska baza bez ×2. Decyzja PO symulacji bilansu. | ⏳ symulacja `a065df5d8ce1ffd2f` |

## B. KOSZTY BUDYNKÓW (propozycja startowa — decyzja: proceed + stroić w grze)

**KAMIEŃ** (drewno/kamień): stolarnia d5 · kamieniarski d3 k3 · targowisko d6 · spichlerz d5 k3 · garncarnia d4 k2 · kamienne_kregi k8 · studnia k5 · stela k6 · palac d8 k8.
**BRĄZ** (d/k/cegła/brąz): kuznia d4 k4 · odlewnia_brazu k6 c4 · port d10 · karawanseraj c4 · spichlerz_ii c10 · cegielnia d4 k4 · swiatynia c6 · biblioteka c5 · akwedukt c12 · mennica k6 braz3 · mury c15 · koszary d6 k6 braz4 · magazyn d8 k4 · trybunal c8.
**ŻELAZO** (k/cegła/brąz/żelazo): odlewnia_zelaza c8 braz4 · port_wielki c10 braz4 · kuznia_zelaza c6 braz4 · fort(Cytadela) c18 zelazo6 · warsztat_oblezniczy c8 zelazo6 · akademia c14 · teatr c10 · sad c8 · pretorium c9 · laznia_publiczna c10 · akademia_wojskowa c12 zelazo6.
POZA ZAKRESEM: Wielka Kuźnia (ep.4), Lazaret (ep.5) — usunięte z planów (#12).

## C. STAN PRAC (commity na branchu `claude/sprawdzenie-funkcjonalnosci-ek4ra0`)

- `d6c4f33` — bydło/owce/lama nie-surowce + licznik magazynów + CUDA-AI.
- `6859d9e` — #15 Ludy Morza (embarkacja+rajdy) + tooltipy (rekrutacja).
- `07bc172` — docs: Civpedia + Poradnik + regeneracja wikiBundle (naprawiony bundler).
- `f136c09` — model surowców: ceramika=dostęp, produkcja bez pracowników, licznik+tempo, stawki 4/4/4/2/2.
- **DEPLOY ROBOCZA `aa3c9b06`** (fala 3) — livestock+licznik+CUDA-AI+Ludy Morza+UMOWA-B. Model surowców (`f136c09`) i docs (`07bc172`) NIE są jeszcze w bundlu — wejdą falą 4.

## D. W TOKU (subagenty, worktree)

- `aa4a6fecf55865ad0` — Paliwo/Mielerz removal + bonusy Stolarni/Warsztatu/Garncarni + koszty budynków (dec. 9/10/11).
- `a065df5d8ce1ffd2f` — symulacja bilansu surowców (10 miast/100 tur; scenariusze płaska baza vs ×2-obsadzone). Podejrzenie: drewno = wąskie gardło (napędza cegłę+brąz + budulec).

## E. DO ZROBIENIA (kolejność)

1. Integracja `aa4a...` (Paliwo/Mielerz + bonusy + koszty) → bramki → commit.
2. Decyzja **×2-obsadzone** po symulacji `a065df...`.
3. **Wonder-bonusy w ekonomii** (osobny subagent, po surowcach).
4. **DEPLOY fala 4** — surowce + docs (wikiBundle) + wonder-bonusy + ewentualne ×2.
5. **Koszty jednostek** (brąz/żelazo; Kamień = 0 surowców) — po budynkach; units.json już częściowo ma koszty → weryfikacja.
6. Strojenie po playteście: stawki wydobycia, bonusy 10%, progi CUDA, params Ludy Morza.
7. Sync paneli Excel z nowymi parametrami (po wszystkim).

## ⛔ ZASADA NADRZĘDNA — PARYTET AI (Maciej 2026-07-24)
**Każda zmiana gameplayowa/ekonomiczna dla cywilizacji GRACZA obowiązuje TAK SAMO dla KAŻDEJ cywilizacji AI. ZERO uproszczeń dla AI.** Jeśli gracz ma magazyn/handel/koszty surowcowe/upkeep/cuda — AI też, wg tych samych reguł. Cały kod ekonomii/dyplomacji ma być **ownerId-agnostic** (liczony per owner dla wszystkich, ownerId=0 gracz + AI). Gałąź „tylko gracz / tylko `ownerId===0`" w mechanice = błąd do uogólnienia. Przy KAŻDYM zadaniu POTWIERDŹ, że działa dla AI (najlepiej asercją na ownerId≠0). Maciej wielokrotnie łapał braki parytetu — to ma się skończyć.

## F. UWAGI DLA INNYCH AGENTÓW

- Budowanie TYLKO: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` z `gra/`. NIGDY `npm run build/dev`.
- Źródło prawdy = JSON w `gra/data/`. Parametry strojeniowe: `terrain-improvements.json` (surowiec_ilosc_tura), `econ-params.json`, `buildings.json` (koszt_surowce), `ai-params.json` (§9 CUDA/Ludy Morza).
- Licznik surowców: panel imperium → sekcja „SUROWCE STRATEGICZNE" (`main.ts buildEmpireResourceRows`).
- Produkcja per-ulepszenie: `turn-economy.ts computeTerritoryResourceYieldByCity`, `terrain-improvements.ts territoryResourceYieldForImprovement`.
- Pre-istniejące porażki testów (NIE regresja): combat-test, ai-test (233/7), diplomacy-value-catalog-test (2), eko-tech-paczka1-test (Mielerz — do naprawy w dec.9).
