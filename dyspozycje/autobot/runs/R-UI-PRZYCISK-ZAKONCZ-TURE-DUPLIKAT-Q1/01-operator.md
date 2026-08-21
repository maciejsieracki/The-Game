# 01-operator — R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1

**Data:** 2026-08-21
**Etap:** Operator — dokończenie recon (bez zmian w kodzie `gra/`).

## STATUS: PASS

## TEMAT: R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1

## GOAL
Ustalić DOKŁADNY mechanizm jednoczesnego pojawienia się starego i nowego przycisku
„Zakończ turę"/„Wykonaj", albo jednoznacznie wykazać, że w bieżącym kodzie źródłowym
taki mechanizm nie istnieje.

## Wynik recon (punkty 1–4 z dyspozycji)

### 1. Podwójne zamontowanie `bottomBarHud.ts`? — WYKLUCZONE
- `createBottomBarHud()` (`gra/src/ui/bottomBarHud.ts:164`) samo w sobie NIE ma guardu
  (zawsze tworzy nowy `<div class="civ-bottom-bar">` i dopina do `document.body`) —
  ale ma **dokładnie jedno** miejsce wywołania w całym repo: `gra/src/ui/hud.ts:1505`,
  wewnątrz `mountBottomBar()`.
- `mountBottomBar()` ma jawny guard singletona: `if (cfg === null || bottomBarApi !== null) return;`
  (`hud.ts:1503`) — moduł trzyma jedną instancję w `bottomBarApi` (`hud.ts:339`).
- `showHud()` (`hud.ts:1630`) na wejściu woła `destroyD1BModules()` (`hud.ts:1570`),
  które **niszczy i zeruje** `bottomBarApi` (`bottomBarApi.destroy(); bottomBarApi = null;`,
  `hud.ts:1572`) — dopiero PO tym woła `mountBottomBar()` (`hud.ts:1660`). Nawet
  gdyby `showHud()` było wołane wielokrotnie, poprzedni DOM zawsze jest usuwany przed
  utworzeniem nowego — nie da się w ten sposób uzyskać dwóch żywych elementów `.civ-bottom-bar`.
- Sprawdzone również: `showHud()` ma **dokładnie jedno** wywołanie w całym repo —
  `gra/src/main.ts:18856` — zawsze z pełnym configiem (patrz pkt 3). Żaden test ani
  inny moduł nie woła `createBottomBarHud`/`mountBottomBar` bezpośrednio.
- **Wniosek:** brak w kodzie ścieżki prowadzącej do podwójnego zamontowania nowego stosu.

### 2. Własny przycisk „Zakończ turę"/„Wykonaj" w `preBattle.ts`? — WYKLUCZONE (inny przypadek, opisany osobno)
Przeczytany `gra/src/ui/preBattle.ts` w całości (910 linii). Overlay przygotowania
bitwy ma WŁASNY panel akcji (`buildDeployPanel()`, linia ~796) z przyciskami:
`Wycofaj` (`data-act="cancel"`), `Auto` (`data-act="auto"`), `BITWA`/tarcza
(`data-act="deploy"`), opcjonalnie `Zapisz` (`data-act="save"`) — żaden z nich nie
nazywa się ani nie działa jak „Zakończ turę"/„Wykonaj". To osobny, świadomie
zaprojektowany zestaw etykiet (`preBattle.ts:812-825`), nie duplikat zgłoszonego
przycisku.
Dodatkowa obserwacja (nie pasuje dosłownie do zgłoszenia, ale odnotowana na wypadek
przydatności w kolejnej rundzie): `showPreBattle()` chowa panel rosteru armii
(`setArmyStackHudSuppressed(true)`, `preBattle.ts:255`), ale **nie** chowa i nie
suppressuje `bottomBarHud` (WYKONAJ/Zakończ turę) — ten stos zostaje zamontowany i
widoczny (przygaszony przez `.pb-map-scrim`, `pointer-events:none`, więc wciąż
klikalny) w tle pod overlayem bitwy. To może dawać wrażenie „dwóch zestawów
przycisków akcji na ekranie naraz" w trybie przygotowania bitwy, ale to NIE jest ten
sam przycisk w dwóch stylach — to dwa różne, celowo osobne zestawy akcji dla dwóch
różnych kontekstów (tura vs. bitwa). Nie kwalifikuje się jako „jednoznaczny, wąski
bug" do naprawy w tym etapie.

### 3. Race condition przez reset `cfg`? — WYKLUCZONE
`cfg` (`hud.ts:332`, `let cfg: HudConfig | null = null;`) ma w całym pliku
**dokładnie jedno** miejsce przypisania: `cfg = config;` w `showHud()` (`hud.ts:1631`).
Żadna funkcja (`hideHud()`, `resetHud`, testy, tryb specjalny) nie zeruje ani nie
podmienia `cfg` na wartość częściową — `hideHud()` (`hud.ts:1680`) tylko chowa
elementy (`style.display = 'none'`), nie dotyka `cfg`. `useD1BLayout()`
(`hud.ts:526`: `cfg?.onExecutePending !== undefined || cfg?.mapToolbar !== undefined`)
jest więc `false` wyłącznie w oknie PRZED pierwszym `showHud()` (gdy `cfg === null`,
`barEl === null` — `renderBar()` wtedy w ogóle nic nie renderuje, `hud.ts:1279`) —
nigdy w trakcie normalnej rozgrywki po starcie. Brak okna czasowego, w którym
`renderBarLegacy()` mogłaby wyrenderować się OBOK już zamontowanego `bottomBarHud`.

### 4. Hipoteza alternatywna (c) — WYSOCE PRAWDOPODOBNA, potwierdzona kontekstem czasowym
`bottomBarHud.ts` (nowy stos) i cały mechanizm gate'u D1B zostały wprowadzone/
wdrożone commitem `8340514` (2026-08-20 17:16:55 +0200, "feat(ui): trzy karty od
Designu") i opublikowane commitem `ef14baf` (2026-08-20 17:20:39 +0200, "deploy:
publish ROBOCZA FALA 300") — **to jest ta sama paczka**, która wprowadziła kartę
odkrycia technologii przywołaną w dyspozycji jako precedens stale-build w tej samej
sesji. Zgłoszenie właściciela padło następnego dnia (dispatch `a1bbffe`,
2026-08-21 09:21:48 UTC), czyli ok. 18h po deployu nowego UI — dokładnie w oknie,
w którym otwarta wcześniej karta przeglądarki (z kodem sprzed FALA 300, gdy
legacy top-bar z przyciskiem `Zakończ turę ▶` był jeszcze realnie używany) mogła
pokazać fragment starego UI nałożony na świeżo wczytane elementy nowego, bez
udziału żadnego z mechanizmów 1–3 powyżej. Brak w repo service workera / własnego
cache JS (`grep serviceWorker` — 0 trafień), więc źródłem byłby zwykły cache HTTP
przeglądarki / nieodświeżona karta, nie kod aplikacji.

## Ustalenie końcowe
Żaden z trzech mechanizmów kodowych (1: podwójne montowanie, 2: własny przycisk
`preBattle`, 3: race condition na `cfg`) nie reprodukuje się ani nie jest możliwy
w bieżącym źródle — każdy wykluczony przez bezpośrednie śledzenie kodu (cytaty i
numery linii wyżej). `renderBarLegacy()` jest dziś martwym kodem: nieosiągalnym,
bo jedyne wywołanie `showHud()` zawsze przekazuje pełny config. Zgodnie z
dyspozycją (pkt 4, hipoteza c) najbardziej prawdopodobnym wyjaśnieniem zgłoszenia
jest powtórka wzorca stale-build/nieodświeżonej karty przeglądarki z tej samej
paczki wdrożeniowej (FALA 300, 2026-08-20), NIE bug w kodzie źródłowym — do
potwierdzenia u właściciela (twardy refresh / nowa karta) jako najszybszy test
rozstrzygający.

## ZMIANY/COMMIT
Brak zmian w `gra/`. Jedyna zmiana: ten raport
(`dyspozycje/autobot/runs/R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1/01-operator.md`).
Zacommitowane lokalnie, bez push.

## TESTY
Brak testów uruchamianych — etap czysto analityczny (grep + odczyt pełnych plików:
`gra/src/ui/hud.ts`, `gra/src/ui/bottomBarHud.ts`, `gra/src/ui/preBattle.ts`,
fragmenty `gra/src/main.ts` wokół `showHud`/`playtestWalkaActive`). Brak zmian w
`gra/` = brak ryzyka regresji, testy jednostkowe nie dotyczą tego etapu.

## BLOKADY
Brak blokad technicznych. Jedyna "blokada" to brak możliwości zreprodukowania
zgłoszenia z poziomu samego kodu źródłowego — wymaga potwierdzenia od właściciela
(czy problem utrzymuje się po twardym odświeżeniu / w nowej karcie).

## NASTĘPNY KROK
ABC do właściciela: „Czy duplikat przycisku Zakończ turę/Wykonaj nadal występuje po
twardym odświeżeniu strony (Ctrl+Shift+R) / w nowej karcie przeglądarki?" —
- Jeśli NIE występuje po odświeżeniu → temat ZAMKNIĘTY jako stale-build (hipoteza c
  potwierdzona), bez zmian w kodzie, żadnej dalszej rundy Operator/Evaluator.
- Jeśli WCIĄŻ występuje po odświeżeniu → temat wraca do Operatora z dowodem
  (zrzut ekranu + zawartość DOM z DevTools), bo oznacza to mechanizm nieujęty w
  punktach 1–4 powyżej — wymaga nowej rundy recon, nie naprawy na ślepo.
Do rozważenia w tle (nie GOAL tego tematu, do backlogu): usunięcie martwego kodu
`renderBarLegacy()`/legacy top-bar z `hud.ts` jako sprzątanie ryzyka, skoro dowiedziono
że jest dziś nieosiągalny.

## DEPLOY/PUSH: NIE WYKONANO
