# R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — dispatch

TEMAT: `R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1`
RUNDA: 1/5
DOMAIN: GAME (znalezisko 1) + INFRA (znalezisko 2) — dwa połączone, niezależne fixy z
jednego zgłoszenia właściciela na żywo.
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Właściciel zgłosił na żywo zrzut ekranu ze świeżej gry, tura 1: czerwony baner „THE GAME —
BOOT ERROR" na całą szerokość ekranu z treścią:
```
[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary/trójkąta dla
ownerów [0] -- wszystkie istniejące pary zablokowane, lub brak jakiejkolwiek pary do
dołączenia. Przydział pominięty tej tury (ponowna próba w kolejnej).
```
Pytanie właściciela: dlaczego to się dzieje w turze 1, skoro wojna wymuszona ma zaczynać
się w turze 25? Orkiestrator zdiagnozował DWIE osobne przyczyny (opisane niżej jako
znalezisko 1 i 2), zadał ABC właścicielowi w sprawie znaleziska 1 — **właściciel wybrał:
dodać próg tury dla gracza**, spójnie z AI (cofnięcie wcześniejszej decyzji „gracz bez
specjalnego przypadku" z tematu `R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1`,
zintegrowanego, commit `1a7a48e9`).

### Znalezisko 1 (GAME) — brak progu tury dla gracza

`gra/src/main.ts`, blok „Krok C" (grep `triggeredSubjects.push({ ownerId: 0` — numer linii
NIEAKTUALNY, main.ts zmienia się codziennie, znajdź świeżym grepem):
```ts
const playerCity = cities.find(c => c.ownerId === 0);
if (playerCity && totalActiveForcedWarsByOwner(0) === 0) {
  triggeredSubjects.push({ ownerId: 0, q: playerCity.q, r: playerCity.r });
}
```
Jedyny warunek to „gracz nie ma dziś aktywnej wojny wymuszonej" — **brak jakiegokolwiek
progu tury**. AI ma próg 25 tur (`WOJNA_KAMIEN_WYMUSZONA_START_TURY = 25` w
`forced-war-stone.ts`, `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI = 25` w `forced-war-bronze.ts`,
`WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI = 25` w `forced-war-iron.ts` — wszystkie trzy
= 25, ale bronze/iron liczą OD WEJŚCIA W EPOKĘ tego ownera, nie od startu gry). Efekt:
gracz jest w puli „triggered" od tury 1, ale AI jeszcze nie wyzwolone i nie ma istniejących
par do dołączenia — `unresolvedOwnerIds: [0]` co turę aż do pierwszego wyzwolenia AI
(~turze 25).

**Naprawa:** dodaj próg `turn >= 25` (ta sama wartość liczbowa co istniejące stałe —
rozważ eksport wspólnej nazwanej stałej zamiast literału `25`, jeśli to nie wymaga
przenoszenia jej między modułami w sposób zwiększający zakres) do warunku dołączenia
gracza w Kroku C. **Nie zmieniaj** progów AI (bronze/stone/iron) — te zostają jak są.

### Znalezisko 2 (INFRA) — BOOT ERROR CATCHER przechwytuje `console.error` bezterminowo

`gra/index.html`, blok `<script>` na samej górze `<head>` (komentarz „BOOT ERROR CATCHER —
runs before the main bundle; catches bundle-eval errors"):
```js
var _ce=console.error;
console.error=function(){
  showBootErr(Array.prototype.join.call(arguments,' '));
  _ce.apply(console,arguments);
};
```
Ten hook **nigdy się nie odinstalowuje** — działa przez całą sesję gry, nie tylko podczas
ładowania bundla. Efekt: KAŻDE wywołanie `console.error(...)` gdziekolwiek w logice gry
(nie tylko to ze znaleziska 1 — jest ich więcej w kodzie, to nie jedyne miejsce) zamienia
się w rosnący, nigdy nieczyszczony czerwony baner „THE GAME — BOOT ERROR" widoczny dla
gracza, mimo że `console.error` samo w sobie nie oznacza żadnej katastrofy (autor kodu
świadomie wybrał `console.error` do zalogowania OCZEKIWANEGO, obsłużonego przypadku
brzegowego — patrz komentarz „ECHO, brzegowy przypadek" tuż nad wywołaniem w main.ts).

**Naprawa (rekomendowana, prosta):** usuń całkowicie override `console.error` (blok
`var _ce=console.error; console.error=function(){...}`) — zostaw wyłącznie
`window.onerror` i `window.addEventListener('unhandledrejection', ...)`, które już
poprawnie łapią REALNE, nieobsłużone wyjątki (dokładnie to, co powstaje przy błędzie
ewaluacji bundla — błąd składni/rzut na najwyższym poziomie modułu odpala
`window.onerror`, nie `console.error`). Jeśli po przeczytaniu kodu dojdziesz do wniosku,
że jest lepsza naprawa (np. ograniczenie okna czasowego zamiast usunięcia) — uzasadnij
w raporcie, ale usunięcie jest preferowane jako najprostsze i najbezpieczniejsze.

## GOAL

1. Dodaj próg tury (`turn >= 25`) do warunku dołączenia gracza do `triggeredSubjects`
   (Krok C, main.ts) — behawioralnie: gracz NIE dołącza do puli przed turą 25, dokładnie
   jak AI. Po turze 25 zachowanie identyczne jak dziś.
2. Usuń (albo napraw równoważnie, patrz wyżej) override `console.error` w
   `gra/index.html` — `window.onerror`/`unhandledrejection` zostają nietknięte.
3. Zweryfikuj że po naprawie znaleziska 1, sekwencja tur 1-24 NIE generuje już żadnego
   `console.error`/DECISION_REQUIRED z tego konkretnego miejsca (test regresyjny: symulacja
   kilkudziesięciu tur od startu gry, zero wystąpień tego konkretnego loga przed turą 25).

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz zakładania że usunięcie hooka `console.error` w `index.html` jest bezpieczne bez
sprawdzenia, czy JAKIKOLWIEK inny kod (testy, inne narzędzia dev) polega na tym, że
`console.error` jest podmienione globalnie — grep `__boot_err__`/`showBootErr` w całym
repo PRZED usunięciem, potwierdź brak innych konsumentów. Zakaz twierdzenia że próg tury
gracza działa bez realnej symulacji tur 1-30 pokazującej brak przedwczesnego dołączenia
i poprawne dołączenie po turze 25.

## BINARNE KRYTERIUM SUKCESU

- Gracz NIE dołącza do `triggeredSubjects` przed `turn >= 25` — dowód: symulacja/test
  tur 1-30, zero wystąpień przedwczesnego dołączenia, poprawne dołączenie od tury 25
  (przy zero aktywnych wojen wymuszonych gracza).
- `wojna-wymuszona-parowanie-test.cjs` (47 asercji) — zielony, zero regresji; jeśli test
  zakładał dotychczasowe zachowanie „gracz bez progu", zaktualizuj go zgodnie z nowym,
  zamierzonym zachowaniem (to jest ZAMIERZONA zmiana zachowania, nie bug do ukrycia).
- Cała rodzina `forced-war-*-test.cjs` (17 plików wg rejestru) zielona.
- `gra/index.html`: override `console.error` usunięty (albo naprawiony równoważnie),
  `window.onerror`/`unhandledrejection` nietknięte i nadal działają (test: wymuszony
  `throw` w kontekście testowym nadal pokazuje baner; zwykły `console.error(...)` już NIE
  pokazuje banera).
- `tsc --noEmit` czysto, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/src/main.ts` — wyłącznie dodanie progu tury w Kroku C (znalezisko 1).
- `gra/index.html` — wyłącznie usunięcie/naprawa override `console.error` (znalezisko 2).
- `gra/tools/wojna-wymuszona-parowanie-test.cjs` — jeśli wymaga aktualizacji pod nowy próg.
- Nowa bramka (np. `gra/tools/wojna-wymuszona-prog-tury-gracz-test.cjs` i/lub
  `gra/tools/boot-error-catcher-console-error-test.cjs`).
- `dyspozycje/autobot/runs/R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1/**`

Zakazane bezwzględnie: zmiana progów AI (bronze/stone/iron), `gra/data/**`, pliki z
sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-wojna-prog-tury`, gałąź
`autobot/R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1`, baza jawnie `origin/main` (commit
`235a88cc` w chwili założenia, może być nowszy przy starcie pracy — potwierdź
`git log -1` PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian progów AI (bronze/stone/iron) — WYŁĄCZNIE gracz dostaje próg.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli usunięcie hooka `console.error` w `index.html` okaże się mieć nieoczywisty
  konsument (np. istniejący test na niego polega) — STOP, DECISION_REQUIRED z opisem,
  nie wymyślaj obejścia samodzielnie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.
