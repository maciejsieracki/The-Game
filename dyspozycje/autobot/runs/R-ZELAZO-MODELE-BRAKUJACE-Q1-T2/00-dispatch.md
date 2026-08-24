# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T2`
GOAL: Rozróżnić wizualnie **Soldurii** i **Gaesatae** (epoka Żelazo, kultura Celtowie) —
dziś obie jednostki renderują się identycznym modelem `buildCeltWarrior()`, mimo że to
historycznie bardzo różne jednostki.

## Wyzwalacz

Kontynuacja `R-ZELAZO-MODELE-BRAKUJACE-Q1` po zamknięciu T1. Pełny kontekst, ECHO
właściciela i podział na tematy: `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-T2-Q1`, odgałęziona od `origin/main` (zawiera już T1),
osobny worktree per rola.

## Allowlista

- `gra/src/render/units.ts` — WYŁĄCZNIE: (a) linia dispatchu ok. `units.ts:1229`
  (`if (n.includes('gaesatae')) return buildCeltWarrior(...)`), (b) sama funkcja
  `buildGaesatae()` (ok. `units.ts:2401-2439` — **JUŻ ISTNIEJE W KODZIE, ale jest
  MARTWA — nigdzie niewywoływana**, patrz Kontekst techniczny niżej), (c) opcjonalnie
  funkcja `buildCeltWarrior()` (ok. `units.ts:2359-2394`) TYLKO jeśli Operator uzna,
  że Soldurii potrzebuje własnej, odrębnej geometrii zamiast reużycia istniejącego
  modelu wojownika celtyckiego — decyzja i uzasadnienie do udokumentowania.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render).

Poza zakresem: wszystko poza tymi dwiema jednostkami. `Miecznik galijski`,
`Rydwan celtycki` (też Celtowie, Żelazo, już mają dedykowane modele) — NIE ruszać.

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

**Kluczowe znalezisko (zmienia charakter zadania z „napisz od zera" na „napraw
wpięcie + audyt jakości"):** funkcja `buildGaesatae()` **JUŻ ISTNIEJE** w
`gra/src/render/units.ts` (ok. linii 2401-2439) — kompletna, z komentarzem „NAKED
Celtic shock warrior: skin-tone body (no tunic), bronze torc, tall oval shield +
spear, bare head with mustache. Reads as bare-skinned." Ma: nagie ciało (skóra
zamiast tuniki), loincloth, bransoletę/torque z brązu, wąsy, długie włosy, włócznię
(`addSpearRight`), wysoką owalną tarczę celtycką, bose stopy. **Funkcja NIGDZIE nie
jest dziś wywoływana** — dispatch po nazwie „gaesatae" (`units.ts:1229`) woła zamiast
niej `buildCeltWarrior()` (ten sam model co Soldurii). To dokładnie ten sam wzorzec
„ładnie napisany, ale nieosiągalny kod", jaki opisuje `R-BRAZ-SUPER-DISPATCH-Q1` dla
super-jednostek Brązu.

Zadanie Operatora dla Gaesatae NIE jest „zbuduj od zera" — jest:
1. Podmienić dispatch (`units.ts:1229`) na `return buildGaesatae(ownerColor_);`.
2. Zaudytować jakość i historyczną trafność ISTNIEJĄCEGO modelu z tą samą surowością,
   jakby to była nowa praca — sprawdzić dosłownie każdy element (nagość, broń — gaesum
   to CIĘŻKI OSZCZEP/WŁÓCZNIA DO RZUTU, nie kolejowa broń zwarcia — czy `addSpearRight`
   czyta się poprawnie jako broń dystansowa gotowa do rzutu czy jako włócznia zwarcia;
   `units.json` dla Gaesatae ma `Atak dystansowy=0` — SPRAWDŹ czy to nie koliduje z
   ikonografią rzucającego oszczepnika, i jeśli tak, udokumentuj świadomą decyzję
   projektową dot. pozy), torque z brązu (poświadczone historycznie u Celtów), wąsy
   (poświadczone), brak butów.
3. Dodać brakującą sekcję „ZGODNOŚĆ HISTORYCZNA" (styl K1-K7 z `braz-konnica-opus5.ts`)
   jeśli jej tam nie ma — z odniesieniem do znanych źródeł (bitwa pod Telamon 225 p.n.e.,
   opis Polibiusza o walczących nago Gaesatae).
4. Naprawić/dopracować, jeśli audyt znajdzie realne wady (geometria, proporcje,
   anachronizmy) — nie zostawiać „jak jest" tylko dlatego że już istniało.

**Soldurii** — dziś dzieli `buildCeltWarrior()` z (nieużywanym w praktyce)
„Wojownik celtycki". Historycznie Soldurii (opisani przez Cezara, *De Bello Gallico*
3.22 — celtiberyjski/galijski zwyczaj `devotio`/`soldurii`: elitarna przysięgła
gwardia dzieląca los pana, do śmierci włącznie) byli DOBRZE UZBROJENI, zamożni
wojownicy — ubrani (nie nadzy), długi żelazny miecz, wysoka owalna tarcza, torque —
to jest DOKŁADNIE to, co `buildCeltWarrior()` już przedstawia. Operator ma
ZDECYDOWAĆ i udokumentować: (a) czy `buildCeltWarrior()` w obecnym kształcie jest
wystarczająco trafny dla elitarnej gwardii przysięgłej (i wystarczy dodać/rozszerzyć
dokumentację historyczną K1-K7 stylu, bez zmiany geometrii) — CZY (b) Soldurii
zasługuje na własną, odrębną geometrię z oznakami elitarności/zamożności (bogatszy
pancerz, ozdoby) odróżniającą ją jeszcze mocniej od zwykłego wojownika. Obie ścieżki
są dopuszczalne — kryterium sukcesu to wyraźna wizualna RÓŻNICA między Soldurii a
Gaesatae (nagi oszczepnik vs. odziany, dobrze uzbrojony miecznik), nie konkretna
implementacja.

## Kryteria sukcesu

1. Soldurii i Gaesatae wizualnie WYRAŹNIE różne od siebie — nagość/lekkie
   uzbrojenie Gaesatae kontra pełne odzienie/uzbrojenie Soldurii, potwierdzone
   real renderem obu obok siebie.
2. Sekcja historyczna (K-style, z odniesieniem do źródeł) dla obu jednostek —
   nowa dla Soldurii jeśli jej nie ma, zweryfikowana/uzupełniona dla Gaesatae.
3. Zero regresji dla innych jednostek celtyckich (Miecznik galijski, Rydwan celtycki)
   i dla nieużywanego dziś w praktyce dispatchu „Wojownik celtycki"/„celtic warrior".
4. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9
   poz. 6a) — oba modele obok siebie, zmierzone proporcje względem `HEX_R`.
5. `tsc --noEmit` i `vite build` (C-001) czyste; testy tematu + 5 bramek
   referencyjnych zielone.
6. Jeśli audyt Gaesatae znajdzie coś, co wymaga decyzji produktowej (nie
   implementacyjnej) — `DECISION_REQUIRED`, nie własna interpretacja. Wybór
   ścieżki (a)/(b) dla Soldurii to decyzja implementacyjna (§10), nie wymaga pytania.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T1).
DEPLOY/PUSH: NIE WYKONANO.
