# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Final Control, runda 4

STATUS: PASS
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
GOAL: R4-1 — baza budżetu nazwy dobrana pomiarem, 0/15 przycięć w trzech konfiguracjach,
0 kolizji plakietka↔plakietka, margines do sufitu tekstury podany liczbowo; praca rund 2–3
utrzymana. Sędzia §3c: jedna para zarzut/obrona.
MODEL+EFFORT: Sonnet 5, effort high (Final Control)

## WERYFIKACJA WŁASNA (nie na słowo)

- **Diff obrony `bbae09b4` w `cityMapStatChip.ts` = 0 linii kodu.** Sprawdzone filtrem po
  liniach `+`/`-` spoza bloków `/** */`: zero trafień. 4 pliki commita, wszystkie
  w allowliście (`cityMapStatChip.ts` z rundy 3, reszta `runs/<ID>/**`).
- **Algebra przeliczona samodzielnie** z `cityMapStatChip.ts:812-832`: przy nazwie
  wypełniającej budżet `nameW = 305 − prodW − growthW − crownW`, a `midExtraW` wnosi
  `gap+growthW+gap+prodW` → `growthW` i `prodW` skracają się, zostaje sam `gap`.
  `10+30+38+8+27+(266−g)+(8+g)+28+8+30+10 = 463 = BASE + 158`. Zgodne z
  `SLOTY_POZA_NAZWA_PX` z G5. Wariant bez glifu produkcji daje 455 — węższy, więc
  najgorszy przypadek wskazany poprawnie.
- **Arytmetyka sufitu:** `(354+158)×4 = 2048` dokładnie; `(355+158)×4 = 2052 > 2048`;
  `(391+158)×4 = 2196 > 2048`. Sufit 354 jest najwyższą dopuszczalną bazą, dawne 391 było
  błędem. Baza 305 → 1852 < 2048, margines 196 px tekstury (49 px CSS).
- **Skrypt dowodowy uruchomiony:** `pomiar-plakietki-runda-4.cjs` drukuje 463 px CSS /
  1852 px tekstury / margines 196 / sufit 354, kolizje 0/45 i najgorszy przypadek bez
  kolizji, exit 0. Komentarz i dowód są spójne — sedno zarzutu zamknięte.
- **Bramki (uruchomione przeze mnie):** `tsc --noEmit` zielone; `mapa-etykieta-stolicy`
  47/0 (**G5 zielona**, także G6, G7); `city-map-badge` 62/0; `city-badge-growth-percent`
  38/0; `rozmiar-label` 13/0; `city-names-pool` 12/0; `city-names-pools` 6/0;
  `display-names` 27/0. Referencyjne: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- **Parytet czerwonych:** `flaga-mp-nie-gasnie` 31/1, `miasta-panstwa-wylaczone` 52/3 —
  poziom rundy 3, bez pogorszenia.
- **Temat wizualny (§9 poz. 6b):** obejrzałem `dowody/mapa-uklad-gesty-runda4-zblizenie.png`
  i niezależny `dowody/eval-r4-uklad-gesty.png`. Stolica GRACZA z trzema slotami —
  `UMGUNGUNDLOVU` w całości, **bez wielokropka**, korona, WZROST%, glif produkcji,
  populacja; sąsiednie plakietki miast-państw **nie stykają się** z nią ani ze sobą.
- Nie mutowałem drzewa; `git status` czysty, HEAD `bbae09b4`.

## WERDYKTY

**1 → ODDAL.** Zarzut był trafny co do liczb, ale obrona nie broni się deklaracją: naprawa
weszła w tej samej rundzie (§3c pkt 2) i **wytwór w worktree jest już poprawny**,
co sprawdziłem bezpośrednio. `NAPRAW` wymaga wskazania „co i gdzie poprawić" — nie ma
czego: oba komentarze podają 463/1852/196/354, skrypt dowodowy drukuje te same liczby,
G5 jest zielona i nie przeczy komentarzowi. Defekt był wyłącznie dokumentacyjny
(0 linii kodu w diffie), `CITY_NAME_BUDGET_BASE = 305` nietknięte, 1852 < 2048 — brak
ryzyka regresu i brak podstawy do zużycia rundy 5/5 na pracę już wykonaną. Zarzut
zamknięty, nie wraca.

## UWAGI (nie zarzuty, nie wymagają osobnego tematu)

- Sufit z ratyfikacji rundy 4 („≈369") był szacunkiem, który dispatch kazał sprawdzić
  własnym rachunkiem — faktyczny to 354. Baza 305 mieści się z zapasem 49 px.
- `pomiar-plakietki-runda-4.cjs:276` drukuje „ROZBIEŻNA z pomiarem!", porównując bazę 305
  z minimum arytmetycznym 298, nie z dispatchem. Etykieta myli, ale opisuje wiążącą
  pozycję 3 (baza 305 to świadomy wybór Operatora dla marginesu) i żyje w artefakcie runu,
  nie w kodzie gry.
- Kryterium „brak zachodzenia na sąsiednie heksy" nie obowiązuje (ratyfikacja rundy 4);
  poszerzenie o ~45 px jest kosztem przyjętym przez właściciela.

## CHECKLISTA §16b

1 `00-dispatch.md` istnieje, GOAL zmieniany wyłącznie ratyfikacjami z ECHO właściciela ✓ ·
2 ID identyczne we wszystkich rundach ✓ · 3 jedyny zarzut ma obronę i werdykt ✓ ·
4 `ODDAL` nie ukrywa uwagi o GOAL, dowodzie, zakresie ani §9 ✓ · 5 licznik 4/5, obrona nie
jest osobną rundą ✓ · 6 rejestr (`REJESTR-PROSB-I-ZADAN.md:4530`) zgodny — DISPATCHOWANE,
bez integracji ✓ · 7 temat niedzielony · 8 agregat: same `ODDAL` → **PASS**.

BLOKADY: brak.
ZMIANY/COMMIT: bez zmian w `gra/` — wyłącznie ten raport.
RUNDY: 4/5
NASTĘPNY KROK: integracja allowlist-only ręką orkiestratora, potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
