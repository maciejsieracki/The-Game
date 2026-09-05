# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — Final Control, runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1`
ROLA: Final Control · MODEL+EFFORT: **Sonnet 5, effort high**
DATA: 2026-09-05
BAZA: `c8483a64` · HEAD: `0c40b994`
GOAL (R2-1): zdjąć w `wydarzenia-zbadano-karta-tech-real-render-test.cjs` wyłącznie warunek
strażnika `clickRowLabel`, który przerywał scenariusz BEZ kliknięcia. Zgodny z dispatchem
(§16b pkt 1); ID identyczne we wszystkich artefaktach, licznik 2/5 bez resetu (pkt 2, 5).

## ZMIANY/COMMIT

`git diff 3d9713de..HEAD` = **2 pliki**, oba w ratyfikowanej allowliście: raport runy +
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (1+/1−). Realna zmiana kodu to
**jedna linia (l. 292)** — usunięty człon `at.inButton === true`. **Produktu nie tknięto**:
w diffie rundy 2 nie ma ani jednego pliku `gra/src/**`. Zero naruszeń §9.

## TESTY (uruchomione przeze mnie, liczby własne)

| Bramka | Wynik |
|---|---|
| `wydarzenia-zbadano-karta-tech` @HEAD | **144/1** |
| `wydarzenia-zbadano-karta-tech` @`c8483a64` | **144/1** |
| `improvement-card-callsites` · `civpedia-karty-nazwa-przyciskiem` | 36/0 · **27/0** |
| `unit-info-card-viewport-height` · `tech-discovery-card-real-click` | 35/0 · 12/0 |
| logic · tech-tree · research · unit-replace · combat | 213/213 · 19/19 · 33/33 · 13/13 · 6/6 |
| `tsc --noEmit` | exit 0 |

**INFRA obeszłem, nie zignorowałem.** Bramka domyślnie buduje do współdzielonego
`os.tmpdir()/civ-zbadano-karta-tech-dist` (l. 65) — dwa przebiegi zmieszałyby dist i dały
fałszywy parytet. Użyłem flagi `--dist`: osobne buildy bazy i HEAD, **różne md5**
(`d8507fc8…` vs `1be597a5…`), baza z osobnego worktree `--detach c8483a64`, przebiegi
**sekwencyjne**.

**Parytet (B7) co do wartości.** Linia FAIL bazy i HEAD **identyczna bajtowo** — ten sam md5
`0ae37f14…`, `cardClientH:470, cardScrollH:690`.

## NIETAUTOLOGICZNOŚĆ — MUTACJA WŁASNA (§9 poz. 6a)

W pliku **po zmianie** wyłączyłem SAM `page.mouse.click` w `clickRowLabel` (l. 295; pozostałe
11 wywołań `page.mouse.click` nietknięte, ten sam dist): **144/1 → 138/3**. Czerwienieją
dokładnie skutki kliku — karta boczna `{"rect":null,"title":null}`, padają `(B6) klik w
etykiete otworzyl karte „Obóz łowiecki" OBOK` i `obie karty w DOM`. Mutacja cofnięta,
plik bajtowo równy oryginałowi, `git status` czysty, HEAD `0c40b994`.

**Strażnik nie zniknął — zwęził się:** `at.inKey !== true` nadal przerywa scenariusz, gdy
punkt nie trafia w `.entity-card-row-key`. Klik dalej idzie w ETYKIETĘ.

## DOWÓD WIZUALNY (§9 poz. 6a) — obejrzany

`karta-1-technologia-gora.png`: `Stolarnia`, `Palisada drewniana`, `Taran` to **oramkowane
przyciski-pigułki** bez podkreślenia; **„Szczegóły →" nie ma**. `karta-3/4-*-linki.png`:
`Obróbka drewna` jako przycisk w `value` (poprawnie — `linkAnchor` domyślnie `'value'`).
Skan produktu: zero żywych `value: 'Szczegóły →'` w `gra/src/**` (5 trafień to komentarze
o usunięciu).

## BLOKADY

Brak.

## NOTY DLA ORKIESTRATORA (nie zarzuty, nie naprawiane)

1. **§16b pkt 3 — brak artefaktu Evaluatora rundy 2.** W runie nie ma `04-evaluator-runda2.md`;
   pusta lista zarzutów nie jest nigdzie udokumentowana, więc **nie da się potwierdzić, że
   Evaluator przeszedł 10 punktów §16a**. Nie obniżam werdyktu — merytorykę pokryłem
   własnymi przebiegami i własną mutacją, zgodnie z „Final Control pracuje na wytworze
   w worktree" — ale luka jest procesowa i powinna zostać domknięta.
2. **Rozjazd liczby w dispatchu potwierdzony.** Kryterium `civpedia-karty-nazwa-przyciskiem
   24/0` jest nieaktualne; zmierzyłem **27/0**. `24/0` to stan sprzed OBRONY rundy 1
   (`01-operator-runda1.md:51`). Brak regresu.
3. **Dryf dokumentacyjny** (komentarz l. 268-272, etykieta asercji l. 581 — nadal mówią
   „`button[data-entity-kind]`"/„Szczegóły →"). Świadomie pominięty przez Operatora zgodnie
   z „nic więcej w tym pliku". Wymaga **faktycznie założonego** osobnego tematu (§16b pkt 4).

## RUNDY

2/5. Runda Obrony nie jest osobną rundą (§3a) — licznik zgodny.

## WERDYKT (§16b pkt 8)

Lista zarzutów była pusta, więc nie orzekałem par zarzut/obrona; checklista §16b obowiązywała
w całości. **Pusta lista jest uzasadniona** — opieram to na własnych przebiegach, nie na
raportach poprzednich ról. Zmiana jest minimalna i w allowliście, produktu nie tknięto,
parytet z bazą jest bajtowy, a kluczowe ryzyko („zdjęto warunek strażnika, czyli zluzowano
test") **obaliłem własną mutacją**: bramka po zmianie nadal mierzy skutek kliknięcia
i czerwienieje, gdy klik zniknie. Zdjęty człon był martwym warunkiem, który po GOAL 1
blokował własny scenariusz, a nie asercją chroniącą jakąkolwiek własność produktu.

Zero `NAPRAW`, zero `DO DECYZJI CZŁOWIEKA` → **PASS**. Gotowość do integracji: TAK,
allowlist-only, ręką orkiestratora.

## NASTĘPNY KROK

Integracja allowlist-only (2 pliki) przez orkiestratora, następnie `READY_FOR_DEPLOY`.
Osobno: założyć temat dokumentacyjny z noty 3 i domknąć lukę z noty 1.

DEPLOY/PUSH: **NIE WYKONANO**
