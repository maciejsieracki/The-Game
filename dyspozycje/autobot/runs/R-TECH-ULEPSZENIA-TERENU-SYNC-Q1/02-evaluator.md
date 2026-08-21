# 02-evaluator — R-TECH-ULEPSZENIA-TERENU-SYNC-Q1

```text
STATUS: PASS
TEMAT: R-TECH-ULEPSZENIA-TERENU-SYNC-Q1
GOAL: Naprawić dwa potwierdzone bugi karty odkrycia technologii
      (gra/src/ui/techDiscoveryNotice.ts), sekcja „Ulepszenia terenu":
      Bug A (dane, tech.json — 4 rozbieżności nazw vs terrain-improvements.json)
      i Bug B (kod — improvementIconSvg() dostaje polską etykietę zamiast
      ImprovementKey, cichy fallback do imp-farm dla ~13 technologii).
ZMIANY/COMMIT: brak nowych zmian produkcyjnych — raport Operatora potwierdzony
  bez modyfikacji. Weryfikacja wykonana na commicie f70f7b91416d0de3dcff03a7885082d4e5336a0c
  (branch autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1, HEAD po ff-merge 2eb3769).
  Ten raport dodaje wyłącznie 02-evaluator.md (allowlista:
  dyspozycje/autobot/runs/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1/).
TESTY:
  - git diff 3f02f72 HEAD -- gra/data/tech.json: dokładnie 4 pola zmienione
    (Murarstwo, Oswojenie zwierząt, Brązownictwo, Wojskowość), 8 linii
    (4 usunięte + 4 dodane), zero innych pól/technologii ruszonych, "Uwagi"
    nietknięte.
  - Niezależny skrypt Node (własny, poza allowlistą Operatora, usunięty po
    użyciu): iteracja PO WSZYSTKICH technologiach z niepustym polem
    "Odblokowuje ulepszenie terenu" (18 pozycji tekstowych po tym samym
    splicie co list() w kodzie: `/[;,+]/`, filtr '', '-', '—') vs zbiór nazw
    z terrain-improvements.json → 0 rozbieżności, potwierdza raport Operatora
    niezależnie. Pierwsza wersja skryptu (naiwny split tylko po przecinku, bez
    filtra '—') dała 1 fałszywy alarm (Matematyka → "—") — to placeholder
    "brak", poprawnie odfiltrowywany już w istniejącej (nietkniętej) funkcji
    list() w techDiscoveryNotice.ts; po dopasowaniu logiki splitu do
    rzeczywistego kodu aplikacji: 0 rozbieżności, 18/18 zgodnych.
  - Kolizje nazw w terrain-improvements.json (dwa różne klucze ImprovementKey
    z tą samą "nazwa", co cicho nadpisałoby wpis w IMPROVEMENT_NAME_TO_KEY):
    sprawdzono programowo wszystkie 21 rekordów (bez kluczy `_meta`,
    `_miasto_zasieg_ref`) → 0 kolizji, każda "nazwa" unikalna.
  - git diff 3f02f72 HEAD -- gra/data/terrain-improvements.json: pusty diff,
    plik kanoniczny nietknięty, potwierdzone.
  - Hutnictwo żelaza: pole "Odblokowuje ulepszenie terenu" nadal `null`
    (potwierdzone programowo) — świadomie poza zakresem wg 00-dispatch.md,
    NIE zmienione, zgodnie z decyzją.
  - npm install w gra/ (brak node_modules na starcie tego worktree): 69
    pakietów, bez błędów.
  - npm run typecheck (tsc --noEmit): 0 błędów — potwierdzone niezależnie.
  - node tools/technology-discovery-card-visual-test.cjs: **48 PASS, 0 FAIL**
    — dokładna liczba z raportu Operatora potwierdzona niezależnym
    uruchomieniem (grep -c "^PASS"/"^FAIL" na surowym stdout).
  - Przegląd kodu techDiscoveryNotice.ts (diff 3f02f72→HEAD): zmiana
    ograniczona do (a) 2 nowych importów (terrain-improvements.json,
    typ ImprovementKey z ../render/improvements), (b) 1 nowa stała modułowa
    IMPROVEMENT_NAME_TO_KEY zbudowana raz z terrain-improvements.json,
    (c) 1 linia wywołania zmieniona z improvementIconSvg(name) na
    improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name). Zero zmian w
    innych sekcjach karty (Budynki/Jednostki/Kolejne technologie/Zmiany
    ekonomiczne) — potwierdzone diffem, nie tylko deklaracją.
  - improvementIconSvg(key: string, ...) w brandAssets.ts potwierdza
    mechanizm Bugu B: `improvementMap.map[key] ?? improvementMap.map._default
    ?? 'imp-farm'` — kluczowanie po ImprovementKey, dokładnie zgodne z opisem
    z 00-dispatch.md; fallback ("?? name") w naprawionym kodzie jest
    bezpieczny (brak wyjątku), nie maskuje już żadnej ze zweryfikowanych
    18 pozycji (0 fallbacków potwierdzone testem [4]).
  - Przegląd rozszerzenia testu (sekcja [4], +111 linii): odtwarza logikę
    list()/IMPROVEMENT_NAME_TO_KEY niezależnie z tych samych plików źródłowych
    (nie kopiuje oczekiwanych wartości na sztywno bez podstawy), sprawdza
    zarówno dane (Bug A) jak i faktyczne dopasowanie ikon przez
    improvement-icon-map.json (Bug B) dla min. 5 różnych technologii z różnymi
    ikonami (świadoma kontrola przeciw fałszywemu PASS: żadna oczekiwana ikona
    poza Rolnictwem nie jest imp-farm). Sekcje [1]-[3] (17 oryginalnych testów)
    bez regresji.
  - git diff 3f02f72 HEAD --stat: dotyka WYŁĄCZNIE tech.json,
    techDiscoveryNotice.ts, technology-discovery-card-visual-test.cjs,
    01-operator.md (artefakt runu) — zero innych plików, zero
    main.ts/unitInfoCard.ts/sidePanelHud.ts/bottomBarHud.ts, zgodnie z
    allowlistą 00-dispatch.md.
  - git diff 3f02f72 HEAD --check: czysto (brak problemów białych znaków).
  - git status --short po weryfikacji: czysty working tree (poza gitignored
    gra/node_modules/).
BLOKADY: brak.
NASTĘPNY KROK: Final Control (Sonnet 5, effort High, OSOBNY subagent wg
  R-AUTOBOT-FINALCONTROL-SUBAGENT-Q1) na branchu
  autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1, commit f70f7b9 (+ ten raport
  Evaluatora).
DEPLOY/PUSH: NIE WYKONANO
```

## Werdykt

**PASS.** Raport Operatora zweryfikowany adwersaryjnie punkt po punkcie
(00-dispatch.md, tabela 4 rozbieżności) i potwierdzony niezależnie —
zero defektów wymagających poprawki, zero rozszerzenia zakresu poza
allowlistę.

## Szczegóły weryfikacji (§1-7 zlecenia)

**1. `tech.json` diff vs `3f02f72`:** dokładnie 4 pola zmienione, zero innych
pól/technologii ruszonych. `git diff 3f02f72 HEAD --stat` potwierdza 8 linii
(4-/4+) w tym pliku — nic więcej. Pole `Uwagi` dla Brązownictwa nadal zawiera
przestarzałą wzmiankę „ABC-7: Popalnia brązu na mapie" — świadomie nietknięte
(poza allowlistą tego tematu: allowlista mówi wyłącznie o polu „Odblokowuje
ulepszenie terenu"), i nieszkodliwe, bo `tech.Uwagi` jest polem
deweloperskim, NIGDY nie renderowanym graczowi (potwierdzone grepem — jedyne
wystąpienie `.Uwagi` w `techDiscoveryNotice.ts` to komentarz dokumentujący tę
właśnie decyzję projektową sprzed tego tematu). Nie jest to defekt tego runu.

**2. Niezależna weryfikacja zero-mismatch dla WSZYSTKICH technologii:**
wykonano własnym skryptem Node (nie skryptem Operatora), z tą samą regułą
parsowania co produkcyjna funkcja `list()` (`split(/[;,+]/)`, filtr pustych,
`-`, `—`). Wynik: 18 pozycji tekstowych w całym `tech.json`, 0 rozbieżności
wobec `terrain-improvements.json`. (Pierwsza, naiwna wersja mojego skryptu —
split tylko po przecinku, bez filtra placeholdera „—" — dała 1 fałszywy
alarm dla Matematyki; po korekcie zgodnie z rzeczywistą logiką aplikacji
potwierdzone 0/18.)

**3. Kolizje nazw w `IMPROVEMENT_NAME_TO_KEY`:** sprawdzono wszystkie 21
rekordów `terrain-improvements.json` (pomijając `_meta`, `_miasto_zasieg_ref`)
— każde pole `nazwa` unikalne, 0 kolizji. Mapa budowana raz na poziomie
modułu nie może więc cicho nadpisać żadnego wpisu.

**4. `terrain-improvements.json` nietknięty:** `git diff 3f02f72 HEAD --
gra/data/terrain-improvements.json` — pusty diff, potwierdzone.

**5. Testy uruchomione samodzielnie:** `npm install` (69 pakietów, bez
błędów), `npm run typecheck` → 0 błędów, `node
tools/technology-discovery-card-visual-test.cjs` → **48 PASS, 0 FAIL**
(policzone programowo z surowego stdout, nie na słowo raportu Operatora) —
dokładnie zgodne z 01-operator.md.

**6. Hutnictwo żelaza:** pole `Odblokowuje ulepszenie terenu` nadal `null`
(potwierdzone programowo) mimo istniejącego rekordu `kopalnia_zelaza` z
`tech: "Hutnictwo żelaza"` w kanonie — świadomie NIE naprawione, zgodnie z
jawną decyzją zakresu w `00-dispatch.md`. Zweryfikowano też, że architektura
wybrana przez Operatora (mapa nazwa→klucz zamiast przebudowy na filtrowanie
`terrain-improvements.json` po polu `tech`) rzeczywiście unika przypadkowego
„naprawienia" tego przypadku przy okazji — potwierdzone lekturą kodu: sekcja
nadal czyta z pola tekstowego `tech.json`, nie z filtra po `tech`, więc
Hutnictwo żelaza pozostaje nietknięte niezależnie od stanu
`terrain-improvements.json`.

**7. Allowlista całościowo:** `git diff 3f02f72 HEAD --stat` dotyka wyłącznie
`gra/data/tech.json`, `gra/src/ui/techDiscoveryNotice.ts`,
`gra/tools/technology-discovery-card-visual-test.cjs` oraz artefaktu runu
`01-operator.md`. Zero zmian w `main.ts`, `unitInfoCard.ts`, `sidePanelHud.ts`,
`bottomBarHud.ts` lub jakimkolwiek innym pliku.

## Dodatkowe uwagi jakościowe (nie blokują PASS)

- Uzasadnienie architektoniczne Operatora (mapa nazwa→klucz zamiast
  przebudowy na filtr po `tech`) zweryfikowane jako trafne: potwierdzono
  istnienie `IMPROVEMENT_MULTI_TECH_REQ` w `src/game/improvement-tech.ts`
  (bramka AND dla `posterunek` — Obróbka drewna + Murarstwo), którą naiwny
  filtr po polu `tech` w `terrain-improvements.json` (gdzie `posterunek` ma
  `tech: "-"`) by pominął. Wybór Operatora unika tego ryzyka regresji.
- `improvementIconSvg(key: string, ...)` w `brandAssets.ts` nie wymusza typu
  `ImprovementKey` w sygnaturze — rzutowanie `as ImprovementKey` w mapie jest
  więc kosmetyczne dla czytelności, nie funkcjonalnie wymagane przez
  `tsc`. Nie jest to defekt.

## Napraw wykonanych podczas weryfikacji

Brak. Nie znaleziono jednoznacznego defektu wymagającego poprawki — zero
zmian w plikach produkcyjnych. Dodano wyłącznie ten raport.
