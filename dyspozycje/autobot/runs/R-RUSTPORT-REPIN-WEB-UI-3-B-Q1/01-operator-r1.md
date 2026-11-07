STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-B-Q1
GOAL: przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany web `86d510c66 → 9b019a7d8` (FALA 509–532) dla `armyStackHud`, `siegeMapPanel`, `unitRecruitCard`, `newGameFlow`, `empireDetailTypes`.

## ZMIANY-COMMIT

Gałąź `op/R-RUSTPORT-REPIN-WEB-UI-3-B-Q1` od `rust-port/parity-v2` `dde5e9034`. Kod: **`383bdf3d3`**; raport: osobny commit.
- 5 plików klasy PD (port DOM) — hunki weba przeniesione 1:1 poza: `siegeMapPanel` (provider głodu → nowe pole `SiegePanelDto.starveFrac?`, `viewmodel/types.ts` addytywnie, U3B-Z2), `unitRecruitCard` (martwy import `formatManpowerCompact` z `game/manpower` nieprzeniesiony, U3B-Z3).
- `repin-ui3-manifest.json` +sekcja `portDomUI3B`; `verify-repin-ui3-copies.mjs` +blok UI-3-B (SHA, DISJ, WEB, DELTA = zmiana portu vs `portBase` ≡ zmiana weba 86d→9b0, wyjątki jawne); `repin-ui2-overlay.mjs` +blok UI-3-B; przeniesione wpisy (U3B-Z1): `ui2c.json` −3, `repin-ui2-manifest` `portDomRefs` −1, `repin-ui2f-ported` −1.
- NOWE: `dom-harness/run-repin-ui3b.mjs`, `mutate-repin-ui3b.mjs`, fixtura `repin_ui3b-web-vectors.json`, 18 PNG weba w `png/`; `package.json` +2 skrypty; `P5-REPIN-UI-2.md` §11.6.
- Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `git diff --check` czysty.

## TESTY (kod końcowy `383bdf3d3`, `npm ci`)

- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (UI-3: 12 kopii, 1 adapter, portDomUI3B 5/5 web + 5/5 delta, niezgodnych 0).
- `run-repin-ui3b` (Chromium 141 headless `/opt/pw-browsers/chromium-1194`, URUCHOMIONY web `git archive 9b019a7d8`): 173 sceny (1280×720 + 360×640), 1049 kroków (prawdziwe kliknięcia/`fill`/klawisze), 18 PNG web = port bajtowo, pokrycie 55/55, pageerror+console.error 0, różnic 0. Niezależny weryfikator: drugi `git archive origin/main` (= `9b019a7d8`) → fixtura bajtowo identyczna (sha256 `9c6e19ea…`, `webVectorsSha256=08e0c960…`).
- `mutate-repin-ui3b`: **27/27** wykrytych (8 oblężenie, 7 rekrutacja, 4 kreator, 3 teksty uchwały, 5 bramka DELTA — typ/pole `picked`, komentarze; wymagany raport `DELTA`, nie samo SHA). Pliki przywracane bajtowo.
- Regresja (nakładka pin `edb8fb56`+UI-2+UI-3+UI-3-B; UI-2 na WEB86U3): L0 3861/0, L1A 3618/0, L2 1784/0 (354/150 jak baza), C4 1649/0 (75), hud 909/0, cityux 164/0, `run-cycles` 6442/1623 (tylko `diplomacyTradeBasket` 1592 + `diplomacyAudience` 31, E-Z3), UI-2-A 2292/0, B 1356/0 (PIX 0), C 752/0, D 797/0, E 183/0, E-cycles 9335/0, F 35/0, G 9216/0, UI-3-A 33×2/0 PIX 0 56/56. Wszystkie EXIT=0 poza znanym `run-cycles`.
- `run-newgame`: pełny przebieg > 580 s (limit wywołania, obciążony CPU) → 8 przebiegów `--only-label` pokrywających wszystkie kombinacje (dane/brak, v4, legacy+legacy2, uszkodzone, bez-danych, getCivs, zredukowane, tylko-pozne): każdy różnic=0, EXIT=0 (sumy przypadków nieporównywalne z 2195 — sekwencje powtarzane w każdym przebiegu).
- NIE_ZMIERZONO: GPU/natywne okno Tauri; `mutate-cycles`; wiersz „Automatyzacja budowy” na danych Rust (`rust-port/engine/data/ui-params.json` nie ma klucza — w realnej aplikacji v2 wiersz się nie pokaże, U3B-Z4).

## BLOKADY

Brak. NOTY:
1. Hooki P6 (poza zakresem): producent `SiegePanelDto.starveFrac`, zapamiętanie liczby rekrutów (`initialQuantity`/`onQuantityChange`), przekazanie `autoBuildEnabled`, synchronizacja `ui-params.json` Rust z kluczem `auto_build_enabled`.
2. Pliki wspólne (manifesty, nakładka, weryfikator, `package.json`, P5 doc) zmienione addytywnie w osobnych blokach — konflikty z C/D/E rozwiąże orkiestrator. `ui2c.json`: usunięte tylko moje 3 wpisy.
3. Scratchpad jest współdzielony z innymi sesjami: przed zauważeniem użyłem katalogów `scratchpad/w86`, `w9b` (utworzone przez `mkdir -p`; zawierały tylko moją ekstrakcję, usunięte); dalej wyłącznie `scratchpad/ui3b/` — usunięty po etapie wraz z `node_modules`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-WEB-UI-3-B-Q1 r1.
DEPLOY-PUSH: NIE WYKONANO
