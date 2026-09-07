# P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`
GOAL: Jeden surowiec = jeden kolor, wzięty z jednego źródła prawdy.
ROLA/MODEL+EFFORT: Operator — Opus 5, effort high.
GUARD §2b: `094be1db`, drzewo czyste — zgodne z dispatchem.

## G1 — recon (tabela; linie wg bazy `094be1db`)

Kolor mierzony w ŻYWYM Chromium (`getComputedStyle`), nie z grepa. Rozróżnienie
kluczowe: **tożsamość** (ikona/medalion, wartość, zapas) vs **stan** (zielony/
czerwony/pomarańczowy przyrost-deficyt). Stan jest wspólną konwencją OBU ekranów
(HUD: `.civ-hud-chip-rate` zielony/orange; miasto: tempo i delta zielone/czerwone).

| Surowiec | HUD mapy `hud.ts` | Panel miasta `cityPanel.ts` | Zmierzone PRZED |
|---|---|---|---|
| Praca | 606 wartość `--civ-gold-primary`; 598 medalion `#f4e0a0→#a9861f`; `hudChip6c.ts:51` | 2442 ikona `#e8d88a`; 2450 wartość; 2461 zapas `#e8b84a`; 10155 stan; 1844/4926/11152 `'gold'` | HUD #e8d88a · miasto ikona #e8d88a, zapas #e8b84a |
| Żywność | 606/598 j.w. | 2442/2450/2461; 1841, 10156, 11151 stan | j.w. |
| Skarbiec | 606/598 j.w. | **1845, 10686, 11153 `'blue'`** (=#5a9bd4) vs 4555, 11157 `'gold'`; 10157 stan | HUD #e8d88a · miasto **#5a9bd4 w 3 miejscach** |
| Nauka | 607 wartość **#7cb4e4**; 599 medalion `#8fb6e0→#3a5f8a` | 2451 **#7cb4e4**; 1846/4557/10687/11154 `'blue'`→**#5a9bd4**; 2444 medalion | HUD #7cb4e4 · miasto #7cb4e4 **i** #5a9bd4 |
| Kultura | 606/598 j.w. | 10159 `'gold'`; 3994 `class="gold"`; 10690, 11155 | #e8d88a / #e8d88a |
| Religia | 606/598 j.w. | 10160 `'gold'` | #e8d88a / #e8d88a |

**Rozjazd realny — nie PASS.** Trzy złota (#e8d88a, #e8b84a, #e0b24a) i trzy błękity
(#5a9bd4, #7cb4e4, #8ec5ff) na sześć surowców; Skarbiec raz złoty, raz błękitny.

**Poza parą wskazaną przez właściciela (NIE zmieniane, C-025):** `empireDetailPanel.ts`
299/358/566-567/1106-1108 (`#d9a441`, `#8ec5ff`), `empireBalance.ts` 48/79-82 (martwy —
brak importu w `main.ts`), `sideListHud.css.ts:75`, `cityPanel.ts:2149` (podsumowanie
Pracy w błękicie `#8ec5ff`). Rekomendacja: osobny temat.

## G2 — jedno źródło prawdy

`gra/src/ui/resourceColors.ts` (NOWY). Wybór modułu TS + zmienne CSS zgodnie z tym, co
projekt już robi (`brandTokenVars.ts`, `sideListHud.css.ts`); `tokens.css` jest FROZEN
i NIE ruszony. **Żaden kolor nie jest nowy** — oba to tokeny marki, wybrane liczbą
wystąpień (ECHO): złoto `--tg-gold-primary` #e8d88a (odrzucone #e8b84a 1×, #e0b24a,
#d9a441), błękit `--tg-science-blue` #5a9bd4, 4 miejsca renderu vs #7cb4e4 3× i #8ec5ff.

**Zmiana koloru per surowiec (przed → po), warstwa tożsamości:**

| Surowiec | HUD mapy | Panel miasta |
|---|---|---|
| Praca / Żywność / Kultura / Religia | #e8d88a → bez zmian | zapas #e8b84a → **#e8d88a** |
| Skarbiec | #e8d88a → bez zmian | „Pieniądz" #5a9bd4 → **#e8d88a** (3 miejsca); zapas #e8b84a → #e8d88a |
| Nauka | wartość #7cb4e4 → **#5a9bd4** | wartość #7cb4e4 → **#5a9bd4**; ikona #e8d88a → **#5a9bd4**; zapas #e8b84a → #5a9bd4 |

Klucz palety chipa W3 wyprowadzany z istniejącego `data-res-stat`, BEZ zmiany sygnatury
`w3CityChip(...)` — inaczej pękała pozycyjna bramka `hud-miasto-stock-tempo-test`
(złapane i naprawione w rundzie: 46/25 → 71/0).

## ZMIANY/COMMIT

`ed81fcdc` — `gra/src/ui/resourceColors.ts` (NOWY), `gra/tools/kolor-surowce-spojnosc-test.cjs`
(NOWY), `gra/src/ui/{cityPanel,hud,mapToolbarHud,brandTokenVars}.ts`.
`9ca58908` — raport + `dowody/{przed,po,mutacja}-*.png` (18 plików).
`44a358ea` — `gra/src/ui/hud.ts`: reguły palety doklejane ZA literałem szablonowym CSS
(patrz TESTY, regresja nr 2). Allowlista zachowana, wyłącznie `gra/src/ui/`, `gra/tools/`
i katalog runu; bez `git add -A`, commity po jawnych ścieżkach.

## TESTY

- `tsc --noEmit` (5.9.3, przez `node ./node_modules/typescript/bin/tsc`) — 0 błędów.
- Referencyjne: logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
- NOWA bramka `kolor-surowce-spojnosc-test.cjs` — **33/33**.
- Bramki UI (grep `cityPanel|hud|empire|hudChip6c|mapToolbarHud|brandTokenVars` → 93 pliki):
  71 szybkich → 60 zielonych, 11 czerwonych; **10 z nich czerwone identycznie na bazie**
  `094be1db` (porównanie na kopii bazy w `/tmp`, nie `git checkout`) — pre-istniejące;
  jedyna realna regresja (`hud-miasto-stock-tempo-test` 46/25) naprawiona → 71/0.
  22 real-render → 18 zielonych; `entity-card-action-buttons` (30/1) i
  `wydarzenia-zbadano-karta-tech` (144/1) czerwone IDENTYCZNIE na bazie — pre-istniejące;
  `build-panel-ulepszenia-scroll` i `sidepanel-blocking-card-cutoff` po naprawie (`44a358ea`)
  zielone 43/0 i 47/0, tak jak na bazie.
- **Mutacja (nietautologiczność):** `praca: #e8d88a → #ff3fb0` w palecie → nowa bramka
  CZERWONA (`A2b praca` FAIL, exit 1) ORAZ zmiana widoczna na obu zrzutach
  (`mutacja-hud-mapy-lewy.png` — magenta „Praca 0"; `mutacja-panel-miasta-*` — ikona
  Pracy `rgb(255,63,176)`). Cofnięte KOPIĄ pliku, `git diff --quiet` zielone.

## BLOKADY

Brak. Allowlista nie wyszła poza `gra/src/ui/` i `gra/tools/`.

## NOTY (dlaczego PASS-WITH-NOTES)

1. **Świadomie NIE zmieniam zielonego/czerwonego** tempa w panelu miasta. To kolor
   STANU, obecny w tej samej roli na HUD mapy; usunięcie go skasowałoby sygnał deficytu
   Żywności. Jeśli właściciel czytał zgłoszenie jako „wartość Pracy ma być złota także
   w mieście", to jest zmiana widoczna dla gracza i wymaga jego decyzji — nie mieści się
   w liczeniu wystąpień.
2. Panel cywilizacji ma własne, wciąż rozjechane odcienie (patrz G1) — poza zakresem.
3. Raport przekracza ~400 słów, bo tabela G1 jest twardym kryterium końca.
4. **Dwie regresje złapane i naprawione w rundzie, obie w cudzych bramkach — bez dotykania
   ich plików:** (1) `hud-miasto-stock-tempo-test` pilnuje POZYCJI argumentów
   `w3CityChip(...)` — nowy parametr ją zbił; klucz palety wyprowadzam z istniejącego
   `data-res-stat`. (2) `build-panel-ulepszenia-scroll` replikuje literał szablonowy CSS
   HUD-u i czerwienieje na nieznanej wstawce `${…}`; reguły palety są teraz doklejane
   za literałem. Obie bramki wróciły do wyniku bazowego.
5. **Incydent własny (C-019, zgłaszam sam):** sprzątając pliki nadpisane przez cudze bramki
   (`entity-card-diorama` przepisuje `runs/R-KARTA-JEDNOSTKI-3D-.../dowody/*.png`,
   `et-turn-lbl` tworzy `gra/tools/.shots-et-turn-lbl/`) puściłem pętlę po
   `git diff --name-only`, która cofnęła też MOJĄ niezacommitowaną poprawkę `hud.ts`.
   Wykryte natychmiast, poprawka odtworzona i zacommitowana (`44a358ea`), bramki
   przeliczone na finalnym kodzie. Wniosek: sprzątanie cudzych artefaktów tylko po
   JAWNEJ liście ścieżek, nigdy po `git diff --name-only`.
6. Zrzuty PO i MUTACJA przeliczone na finalnym kodzie — bajtowo identyczne z zacommitowanymi
   (render deterministyczny, `git status` czysty po powtórce).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high) — weryfikacja G1, palety i mutacji.
Po Final Control: wpis nowej bramki do `R-PROC-AUTOBOT.md` §6 (wymóg tamże) przy integracji.
DEPLOY/PUSH: NIE WYKONANO
