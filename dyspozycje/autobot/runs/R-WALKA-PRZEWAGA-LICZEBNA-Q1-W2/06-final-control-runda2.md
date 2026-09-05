# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — Final Control, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort high
GOAL: R2-1 — `morale_startowe = max(fleeMorale + eps, morale_bazowe × (1 − spadek))`; praca
rundy 1 utrzymana. Zgodny z `00-dispatch.md` §RUNDA 2 (§16a pkt 9).

ZMIANY-COMMIT: baza `36f40c7d`, oceniane `9d45d9b7`, HEAD `33e53200`. 4 pliki (266+/3−), wszystkie
w allowliście. W1 (`auto-battle-power.ts`, `auto-battle-params.json`), `main.ts`, `WERSJE.md`,
`docs/decyzje/**`, `playbook.json`, `gra-robocza/**` — **0 zmian**. `git diff --check` czysto,
brak sekretów. `e356d144` przodkiem HEAD.

TESTY (uruchomione przeze mnie): `walka-morale-przewaga-mocy` **123/123**, `walka-jeden-kontratak`
**24/24**, `tsc --noEmit` 0 błędów. Referencyjne: logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6. Kryt. 8: battle-roster 7/7, battle-summary OK, battle-hp-display 7/7,
teren-walki-etapy 33/33, army-hunger-combat 13/13 — exit=0.

## WŁASNE MUTACJE

- **Klamp mierzalny.** Cofnięcie samego klampu (`eps`/`fleeMorale` nadal referowane): **113/123,
  exit=1**, wskazane dokładnie cztery rekordy graniczne (50/22→18, 40/25→14, 30/25→11, 60/22→21).
  Całe źródło na bazie: 110/123.
- **Bramka iteruje po WSZYSTKICH rekordach.** CZĘŚĆ G czyta `units.json` w locie. Zsabotowałem trzy
  rekordy **spoza** czwórki — pierwszy, środkowy i ostatni zbioru (Procarz, Halabardnik Shang,
  Miecznik galijski): **122/123, exit=1**, wymienione z nazwy. Usunięcie jednego rekordu →
  „oczekiwano 71, jest 70". To nie jest próbka.
- **Własny odczyt `units.json`: 75 rekordów, 71 z obiema kolumnami, 4 pominięte** = Taran, Taran
  okuty, Katapulta, Wieża oblężnicza — `Typ=Siege`, `Morale ucieczki=null` → `isNeverRout`
  (`battleScene.ts:1502`). Potwierdzone; CZĘŚĆ G mierzy to, co głosi.
- **`moraleMax`/`fleeMorale`:** 0 przypisań w diffie. Dopisanie obu: **102/123, exit=1** — łapią D1,
  D2, ułamek strony, asercje strukturalne i G.
- **Tabela GOAL 2 przeliczona niezależnie** (`min(65%, 50%·log₁₀ r)`): 1,5/2/3/5/10 → **91/85/76/65/50**,
  sufit 35; podłoga 23 dla fm=22 nieaktywna. Realny moduł daje to samo.
- **Epsilon to parametr:** przestrojenie na 1/7/20 przesuwa podłogę na 23/29/42. W
  `auto-battle-params.json` zero trafień.
- **Runda 1 utrzymana:** 24/24, w tym ufortyfikowany i w mieście = 1 oraz kontratak w KAŻDEJ rundzie
  tego samego starcia; reset flagi `battleScene.ts:9230` w `_resetBattleRuntimeState`.

Drzewo po mutacjach przywrócone — `git status` czysty, HEAD bez zmian.

BLOKADY: `map-field-battle-test.cjs` exit=1, `TypeError: import_meta.glob is not a function` —
identyczny po cofnięciu wszystkich trzech plików do bazy. INFRA, nie defekt tematu.

## WERDYKT — czy pusta lista zarzutów jest uzasadniona

**TAK** — nie na podstawie zgodności poprzednich raportów, lecz własnych przebiegów i pięciu
mutacji. Najgroźniejszy scenariusz, bramka zielona bo mierzy próbkę, sprawdziłem wprost i **nie
zachodzi**. Żaden `NAPRAW`, żadne `DO DECYZJI CZŁOWIEKA` → agregat `PASS` (§16b pkt 8).

**NOTA (jedyny powód `-WITH-NOTES`, §11):** `04-operator-runda2.md` ma 555 słów wobec ~400. Treść
jest destylatem — wada formy, nie substancji, a §11 przypisuje jej wprost `PASS-WITH-NOTES`.
Przekroczenie jest systemowe (02: 558, 03: 552, 05: 476, ten raport: 468 — nota obejmuje i jego),
więc wg §16b pkt 4 idzie jako **osobny temat PROCESS**.

**Do protokołu, nie zarzut:** `RuntimeUnit` ma pole `morale`, ale to wcześniejszy mapowy licznik
dezercji (obecny w `487b0cfc`); `types/unit.ts` nietknięty, diff nie dotyka `RuntimeUnit` ani
`effectiveDefenderM` — „morale od przewagi nie trafia na mapę" utrzymane. Wpis wyniku W2 w
`REJESTR-PROSB-I-ZADAN.md` należy do kroku integracji.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, per plik i per hunk) → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
