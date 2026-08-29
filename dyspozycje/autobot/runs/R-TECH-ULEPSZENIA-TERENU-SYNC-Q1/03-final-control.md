# 03-final-control — R-TECH-ULEPSZENIA-TERENU-SYNC-Q1

```text
STATUS: PASS-WITH-NOTES
TEMAT: R-TECH-ULEPSZENIA-TERENU-SYNC-Q1
GOAL: Naprawić dwa potwierdzone bugi karty odkrycia technologii
      (gra/src/ui/techDiscoveryNotice.ts), sekcja „Ulepszenia terenu":
      Bug A (dane, tech.json — 4 rozbieżności nazw vs terrain-improvements.json)
      i Bug B (kod — improvementIconSvg() dostaje polską etykietę zamiast
      ImprovementKey, cichy fallback do imp-farm dla ~13 technologii).
ZMIANY/COMMIT: f70f7b91416d0de3dcff03a7885082d4e5336a0c (Operator, kod) +
  2eb3769 (raport Operatora) + 8a483ee (raport Evaluatora), branch
  autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1. Final Control nie modyfikuje kodu
  produkcyjnego — dodaje wyłącznie ten raport (03-final-control.md).
  git diff 3f02f72 HEAD --stat: gra/data/tech.json (8 linii, 4-/4+),
  gra/src/ui/techDiscoveryNotice.ts (23 linie), gra/tools/technology-discovery-
  card-visual-test.cjs (+111), plus artefakty runu 01-operator.md/02-evaluator.md.
  Zero innych plików. `git diff 3f02f72 HEAD --check`: czysto.
TESTY (uruchomione samodzielnie, w tym worktree, niezależnie od raportów):
  - KROK 0: HEAD tego worktree (47cdca1) był przodkiem commitu Evaluatora
    (8a483ee, "raport Evaluatora"), więc `git merge --ff-only 8a483ee` —
    fast-forward bez konfliktów. Uwaga procesowa: sam branch
    `autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` w repo wskazywał wyłącznie na
    2eb3769 (raport Operatora) — commit Evaluatora (8a483ee) istniał tylko na
    branchu roboczym innego worktree (worktree-wf_6b92c459-179-1), nigdy nie
    zaktualizowano nim referencji brancha tematu. Nie jest to defekt kodu, ale
    lukę w higienie referencji git wart odnotowania orkiestratorowi przy
    integracji (użyć 8a483ee, nie 2eb3769, jako podstawy scalenia).
  - npm install w gra/ (brak node_modules na starcie): 69 pakietów, 0 błędów —
    zgodne z obydwoma raportami.
  - npm run typecheck (tsc --noEmit): 0 błędów — zgodne.
  - node tools/technology-discovery-card-visual-test.cjs: **48 PASS, 0 FAIL**
    (policzone programowo: grep -c "^PASS"/"^FAIL" na surowym stdout) —
    dokładnie zgodne z 01-operator.md i 02-evaluator.md.
  - Świeża lektura kodu (niezależna od raportów):
    * gra/data/tech.json: diff dokładnie 4 pola („Odblokowuje ulepszenie
      terenu" — Murarstwo, Oswojenie zwierząt, Brązownictwo, Wojskowość),
      zgodnie z tabelą 00-dispatch.md; Brązownictwo → null (sekcja znika,
      accordionSection() zwraca '' przy count===0 — potwierdzone lekturą).
    * gra/src/ui/techDiscoveryNotice.ts: 2 nowe importy (terrain-improvements.json,
      typ ImprovementKey), 1 nowa stała modułowa IMPROVEMENT_NAME_TO_KEY, 1 linia
      wywołania zmieniona (improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name)).
      Zero zmian w innych sekcjach karty — potwierdzone diffem.
    * gra/src/ui/icons/brandAssets.ts: improvementIconSvg(key) czyta
      `improvementMap.map[key] ?? improvementMap.map._default ?? 'imp-farm'`
      — mechanizm Bugu B (kluczowanie po ImprovementKey) potwierdzony w źródle.
    * gra/data/terrain-improvements.json: `git diff 3f02f72 HEAD --` — pusty
      diff, plik kanoniczny nietknięty.
    * Kolizje nazw w terrain-improvements.json: 22 rekordy (bez kluczy `_`-
      prefiksowanych), 0 duplikatów pola `nazwa` — sprawdzone programowo (Python).
    * Hutnictwo żelaza: `Odblokowuje ulepszenie terenu` nadal `null`, mimo że
      terrain-improvements.json ma realny rekord `kopalnia_zelaza` z
      `tech: "Hutnictwo żelaza"` — świadomie NIE naprawione, zgodnie z jawną
      decyzją zakresu 00-dispatch.md (§Uwaga informacyjna). Potwierdzone.
    * list()/accordionSection(): logika splitu (`/[;,+]/`, filtr '', '-', '—')
      i chowanie sekcji przy count===0 odczytane wprost ze źródła, zgodne z
      opisem obu raportów.
  - Allowlista: `git diff 3f02f72 HEAD --stat` dotyka wyłącznie plików
    wskazanych w 00-dispatch.md + artefaktów runu. Zero zmian w main.ts,
    unitInfoCard.ts, sidePanelHud.ts, bottomBarHud.ts, terrain-improvements.json.
  - `git status` / `git clean -ndx`: working tree czysty (jedyny nieśledzony
    element to gitignored gra/node_modules/, utworzony przez `npm install`
    tego runu weryfikacyjnego).
BLOKADY: brak blokad dla tego tematu (allowlista, GOAL, testy — wszystko
  zgodne). Jedna NOWA obserwacja spoza zakresu tego tematu, wykryta świeżym
  czytaniem kodu (nie kwestionuje PASS tego runu, bo dotyczy pola `Uwagi`,
  którego ten temat celowo NIE dotyka wg allowlisty):
  - Evaluator (02-evaluator.md, §1) twierdzi, że pole `tech.Uwagi` „NIGDY nie
    jest renderowane graczowi", opierając to na grepie WYŁĄCZNIE w
    techDiscoveryNotice.ts. To nieprawda dla całego kodu gry: `cityPanel.ts`
    ma funkcję `appendTechDetailBlock()` (wywoływaną z buildingowego i
    jednostkowego panelu szczegółów, linie 7066 i 7292), która renderuje
    `t.Uwagi` graczowi jako wiersz „Uwagi tech" — po przefiltrowaniu przez
    `playerFacingNote()`/`isDevOnlyPlayerText()`. Ten filtr rozpoznaje tylko
    wzorce `PYTANIE \d+`, `DECYZJA`, `DEC-\d{8}` i „patrz unit-building-
    bonuses" — NIE rozpoznaje prefiksu „ABC-7:”. Czyli Uwagi Brązownictwa
    („kończy Epokę 1; ABC-7: Popalnia brązu na mapie") nadal przecieka do
    gracza w panelu szczegółów budynku/jednostki wymagającego Brązownictwa,
    mimo że karta odkrycia technologii (ten temat) poprawnie już nie pokazuje
    widmowego „Popalnia brązu" w sekcji Ulepszenia terenu.
  - To PRZED-ISTNIEJĄCY stan (nie regresja tego tematu — Uwagi nie było w
    allowlisście ani nie zostało tu zmienione) i nie unieważnia PASS tego
    zlecenia, ale uzasadnienie Evaluatora w tym jednym punkcie jest
    faktycznie błędne i warto zarejestrować osobny, mały temat (np.
    "R-TECH-UWAGI-BRAZOWNICTWO-STALE-Q1") do wyczyszczenia lub przepisania
    Uwagi dla Brązownictwa (i przeglądu innych Uwagi pod kątem tego samego
    wzorca „ABC-N:”).
NASTĘPNY KROK: integracja orkiestratora — scalić autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1
  (commit 8a483ee, zawiera 3f02f72→f70f7b9→2eb3769→8a483ee) do main, następnie
  zaktualizować referencję brancha tematu (dziś zatrzymaną na 2eb3769) i
  zamknąć rejestr. Rozważyć osobny dispatch dla obserwacji „Uwagi Brązownictwa”
  powyżej (poza allowlistą tego tematu).
DEPLOY/PUSH: NIE WYKONANO
```

## Werdykt

**PASS-WITH-NOTES.** GOAL w pełni zrealizowany, allowlista zachowana co do
litery, wszystkie testy odtworzone niezależnie z identycznymi liczbami
(69 pakietów, 0 błędów typecheck, 48 PASS/0 FAIL), świadoma decyzja zakresu
(Hutnictwo żelaza) potwierdzona jako rzeczywiście nienaruszona. Jedna
faktyczna nieścisłość w uzasadnieniu Evaluatora (pole `Uwagi` NIE jest
całkowicie niewidoczne dla gracza — patrz BLOKADY) nie dotyczy tego tematu i
nie blokuje przekazania do integracji, ale powinna zostać zarejestrowana jako
osobne zgłoszenie.

## 1. Zgodność z GOAL (świeże czytanie kodu)

Bug A: dokładnie 4 pola zmienione w `tech.json`, zgodnie z tabelą
`00-dispatch.md` — Murarstwo (usunięto widmowe „Kopalnia”), Oswojenie zwierząt
(„Bydło”→„Trzoda”), Brązownictwo („Popalnia brązu”→`null`), Wojskowość
(„Fort / umocnienia”→„Fort”). `terrain-improvements.json` nietknięty (pusty
diff). Bug B: `techDiscoveryNotice.ts` buduje `IMPROVEMENT_NAME_TO_KEY`
(nazwa→ImprovementKey) raz na poziomie modułu z kanonu
`terrain-improvements.json` i używa go w jedynym miejscu wywołania
`improvementIconSvg()` dla sekcji „Ulepszenia terenu”; mechanizm
`improvementMap.map[key] ?? ... ?? 'imp-farm'` w `brandAssets.ts` (przeczytany
wprost) potwierdza, że przed poprawką KAŻDY klucz w postaci polskiej etykiety
nie trafiał w mapę i zawsze fallbackował na `imp-farm` — teraz trafia.

## 2. Kompletność allowlisty

`git diff 3f02f72 HEAD --stat`: `gra/data/tech.json`,
`gra/src/ui/techDiscoveryNotice.ts`,
`gra/tools/technology-discovery-card-visual-test.cjs` + artefakty runu
(`01-operator.md`, `02-evaluator.md`). Zero innych plików. `--check`: czysto.

## 3. Testy uruchomione samodzielnie

`npm install` (69 pakietów), `npm run typecheck` (0 błędów), `node
tools/technology-discovery-card-visual-test.cjs` (48 PASS, 0 FAIL) —
identyczne z liczbami w 01-operator.md i 02-evaluator.md.

## 4. Gotowość do integracji

`git status` czysty, historia czytelna (3f02f72 dispatch → f70f7b9 kod →
2eb3769 raport Operatora → 8a483ee raport Evaluatora), brak śladu push/scalenia
do main (branch tego tematu nie jest przodkiem `main`), oba raporty (Operator,
Evaluator) kończą się „DEPLOY/PUSH: NIE WYKONANO”. Uwaga procesowa: branch-ref
`autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` w repo głównym wskazuje dziś na
2eb3769, NIE na 8a483ee (commit Evaluatora powstał na osobnym branchu
roboczym worktree Evaluatora i nigdy nie zaktualizował referencji tematu) —
orkiestrator powinien scalić do main od 8a483ee, nie od 2eb3769.

## 5. Świeże czytanie 00-dispatch.md — kryteria końca

Wszystkie 6 kryteriów końca zweryfikowane niezależnie: (1) Brązownictwo/
Murarstwo bez widm — potwierdzone testem i lekturą `accordionSection()`;
(2) Oswojenie zwierząt/Wojskowość pokazują aktualne nazwy — potwierdzone;
(3) ikony poprawne dla wszystkich technologii — potwierdzone (0 fallbacków,
5 punktowych sprawdzeń różnych ikon w teście); (4) `tsc` 0 błędów —
potwierdzone; (5) test wizualny bez regresji, rozszerzony — 17→48,
0 FAIL — potwierdzone; (6) żadna inna sekcja karty nie zmieniona —
potwierdzone diffem (tylko import + 1 stała + 1 linia wywołania).
Decyzja o pozostawieniu Hutnictwa żelaza poza zakresem — zweryfikowana
jako rzeczywiście zachowana (pole nadal `null`) i architektonicznie
uzasadniona (mapa nazwa→klucz, nie filtr po polu `tech`, świadomie unika
„przypadkowej” naprawy tego przypadku — potwierdzone lekturą kodu: sekcja
nadal czyta z tekstowego pola `tech.json`).

Jedyne odstępstwo znalezione przy świeżym czytaniu to opisana w BLOKADY
nieścisłość w uzasadnieniu Evaluatora dot. pola `Uwagi` — nie jest to
kryterium końca tego tematu (nie było w allowliście ani w GOAL), więc nie
zmienia werdyktu poza PASS-WITH-NOTES.
