# RECON — playerPracaPool: SILNIK per-fotel (P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1)

Data reconu: 2026-09-12. Wszystkie numery linii świeżo zweryfikowane grepem +
Read na `main.ts` w tym worktree (bazującym na `origin/main` po `54f297dc`).
Zero zmian w `gra/src/**` — to jest wyłącznie dokument.

## 1. Pełna, świeża lista miejsc

Deklaracja: `let playerPracaPool: number = 0;` — **`main.ts:11173`**.
Alias `playerPracaCell` (getter/setter nad tą zmienną, seat `HUMAN_OWNER_PRIMARY`
w `pracaPoolByHuman`) — `main.ts:10781-10788`.

| Linia(e) | Funkcja/blok | Kategoria | ownerId w scope? |
|---|---|---|---|
| 4260-4263 | `tryBeginWonderMapBuild` (start budowy cudu na mapie z UI) | koszt | Cała funkcja hardcoded na `0` (`wonderGateOk(0,…)`, `wonderBuildSites.push({…ownerId:0})`) — nie tylko praca. `ME()` dostępny w tym scope. |
| 13121-13128 | `tryFoundPlayerCityAt` | koszt założenia miasta | TAK — `ME()` już użyty 2 linie wyżej (`evaluateFoundCityAffordance(playerPracaPool, playerCities, ME())`); tylko odjęcie `playerPracaPool -= aff.kosztPraca` zostało wprost. |
| 13234-13236 | handler cofnięcia (undo) budowy ulepszenia — zwrot kosztu | koszt (refund) | Ta sama rodzina handlerów co niżej — `req` bez jawnego ownerId, kontekst zakłada aktywny fotel (`ME()`/`0`). |
| 13300-13318 | `applyBuildRequest`, gałąź `wycinka` (start kosztu wycinki) | koszt wycinki | `freshClearingState(req.key, 0)` obok — hardcoded `0`, nie `ME()`. |
| 13349-13421 | `applyBuildRequest`/`commitBuildRequest` (koszt ulepszenia terenu + stadnina) | koszt kolejki budowy terenu | Jak wyżej, `0` hardcoded w sąsiednich wywołaniach (`citySurowceSumForOwner(0)`). |
| 22121, 22144 | `buildModeHud.getPracaPool` / `getFoundCityLockHint` (HUD gating panelu budowy) | odczyt (UI gating), nie SILNIK | Read-only — wyszarzanie pozycji w panelu. |
| 23090 | `setPlayerPracaPool` (hak testowy) | test hook | Diagnostyczny, nie ścieżka gracza. |
| 23946 | `grantTestPraca` (hak testowy) | test hook | Diagnostyczny, nie ścieżka gracza. |
| 32002-32031 | blok upkeep Pracy + Cuda-mapa na końcu tury (`advanceCityEconomy`/EOT) | **upkeep końca tury** | **NIE.** `econ.pracaUpkeepByOwner.get(0)` i `advanceOwnerWonderMapBuilds(0, …)` hardcoded na owner `0`, blok NIE pętli po `humanSeats.humanOwnerIds` (w przeciwieństwie do bloku auto-ulepszeń 100 linii niżej). |
| 32118-32279 | auto-ulepszenia gracza (`hOidPracaPool`/lokalny cień `playerPracaPool`) | koszt (auto) | **JUŻ per-fotel poprawnie** — patrz §2. |
| 36263 | reset nowej gry | reset | Globalny reset, dotyka tylko aliasu seat 0. |
| 37123-37124 | seed presetu nowej gry (`preset.pracaStart`) | reset/init | Jak wyżej, tylko seat 0 przez alias. |
| 29723 | serializacja zapisu (`meta.playerPracaPool`) | save | Patrz §4 — pojedyncza liczba. |
| 38032-38043 | deserializacja wczytania | load | Patrz §4. |

Test hooki (22121/22144/23090/23946) nie są SILNIKIEM w rozumieniu dispatchu —
zostawione w tabeli dla kompletności, ale poza zakresem migracji ekonomii.

## 2. `main.ts:32120` — rozstrzygnięcie

`hOidPracaPool = ownerPracaPool(hOid)` (32118) → lokalny `let playerPracaPool =
hOidPracaPool` (32120, cień zmiennej modułu, celowo nazwany identycznie —
komentarz 32277-32279 to potwierdza wprost) → wszystkie odjęcia/dodania w tym
bloku działają na cieniu → zapis z powrotem `setOwnerPracaPool(hOid,
playerPracaPool)` (32279). **To JEST już poprawny kod per-fotel** (migracja
Etapu6c-economy, runda 2, ZARZUT #1 Evaluatora — pętla po `humanOwnerIds`
zamiast pojedynczego `ownerId===0`). Nazwa cienia nie jest kolizją wymagającą
poprawki — to świadomy wybór dla czytelności diffu, udokumentowany w kodzie.

## 3. Ryzyko per klaster

- **Koszt założenia miasta / wonder-map / build-queue / wycinka (UI handlery,
  §1 wiersze 1-6)**: dotyczy WYŁĄCZNIE aktywnego fotela człowieka — to
  bezpośrednie akcje kliknięcia gracza, `ME()` jednoznacznie dostępny w każdym
  scope. Migracja bezpieczna, dziś no-op przy `humanOwnerIds.length===1`
  (identyczny profil ryzyka jak temat cache).
- **Upkeep końca tury + Cuda-mapa (32002-32031)**: **RYZYKOWNE względem
  drugiego fotela człowieka, NIE względem AI** — `econ.pracaUpkeepByOwner`
  ma wpisy per-owner (w tym AI), ale ten konkretny blok czyta tylko klucz `0`
  i pisze do modułowej zmiennej niezależnie od tego, czyja tura się kończy.
  AI ma osobną gałąź (`aiPracaPoolByOwner`, pętla `for (const [oid,…])`,
  32018-32025) — NIE dotyka jej ta migracja. Sam kod już nazywa ten blok
  "świadomie NIETKNIĘTE tym tematem" w komentarzu `main.ts:10871` — czyli
  temat obecny jest dokładnie tym zapowiedzianym follow-upem.
- **Reset/preset (36263, 37123)**: bezpieczne dla seat 0 (alias), ale NIE
  czyszczą/seedują dodatkowych wpisów `pracaPoolByHuman` drugiego fotela —
  do zweryfikowania razem z istniejącym seedowaniem przy `addSecondHumanSeat`
  (`pracaPoolByHuman.set(newActiveOwnerId,{praca:0})`, linia 10911/23688).
  Nie dotyka AI.

## 4. Save-load — POJEDYNCZA LICZBA, potwierdzone dowodem

Zapis (`main.ts:29723`, wewnątrz obiektu `meta`): `playerPracaPool,` — literalnie
sama zmienna modułu, nie `Array.from(pracaPoolByHuman.entries())` (wzorem
`ownerDefaultPodzialHandlu`/`ulepszeniaEmpireByOwner` linia wyżej, które SĄ
serializowane per-owner).

Odczyt (`main.ts:38032-38033`):
```ts
const savedPracaPool = saved.meta?.playerPracaPool as number | undefined;
playerPracaPool = typeof savedPracaPool === 'number' ? savedPracaPool : 0;
```
Tylko seat 0 (przez alias `playerPracaCell`) jest odtwarzany. Drugi fotel
człowieka (obiekt `{praca}` w `pracaPoolByHuman`, NIE aliasowany) **traci całą
swoją pulę Pracy przy zapisie/wczytaniu** — po wczytaniu wraca do `0` (albo do
wartości domyślnej seedowania), niezależnie od stanu przed zapisem. To
**DODATKOWY problem, poważniejszy niż migracja kosztów/upkeep** — utrata
realnych danych gracza, nie tylko błędna ekonomia w locie. Wymaga osobnego
poziomu pilności w kolejnym dispatchu (implementacja).

## 5-6. Warianty implementacji + rekomendacja

**Wariant A — jedna runda, tylko UI-handlery (§1 wiersze 1-6).** Zamienić
bezpośrednie odczyty/zapisy na `ownerPracaPool(ME())`/`setOwnerPracaPool(ME(),
…)` w `tryBeginWonderMapBuild`, `tryFoundPlayerCityAt`, undo-build,
`applyBuildRequest`/`commitBuildRequest`. Ryzyko: niskie (identyczny wzorzec
jak Etap6c-economy dla bloku auto-ulepszeń, już w produkcji). Nie rusza
upkeep/reset/save-load. Koszt weryfikacji: mały (istniejąca bramka
`hotseat-drugi-fotel-tura-test.cjs` + ręczny test 2 fotele + wycinka/kolejka).

**Wariant B — A + upkeep końca tury + Cuda-mapa (32002-32031).** Dodatkowo
pętla po `humanSeats.humanOwnerIds` (analogicznie do bloku auto-ulepszeń
100 linii niżej) zamiast hardcoded `econ.pracaUpkeepByOwner.get(0)`. Ryzyko:
średnie — to jest kod faktycznie uruchamiany co turę dla KAŻDEGO fotela, nie
tylko na klik UI; wymaga też zweryfikowania czy `advanceOwnerWonderMapBuilds`
akceptuje ownerId inny niż 0 bez efektów ubocznych. NIE dotyka AI (osobna
gałąź `aiPracaPoolByOwner` pozostaje bez zmian).

**Wariant C — A + B + naprawa save-load (§4) + reset/preset seedowanie
drugiego fotela.** Pełne zamknięcie tematu. Największy zakres, wymaga zmiany
formatu zapisu (`meta.pracaPoolByHuman` jako `Array.from(entries())`, wzorem
istniejących pól) z migracją wstecz (stary zapis = pojedyncza liczba → seat 0).
Ryzyko regresji: głównie zgodność wsteczna zapisów, nie ekonomia AI.

**Rekomendacja Operatora: Wariant C, w dwóch osobnych PR-ach/rundach
implementacji (najpierw A+B jako jeden dispatch, potem save-load jako drugi)** —
bo save-load dotyka formatu trwałego (ryzyko utraty danych przy błędzie
migracji wstecz) i zasługuje na własną, węższą bramkę weryfikacji, niezależną
od bramki ekonomii tury. Żadna z tych zmian nie dotyka ekonomii AI.

## Odnośnik krzyżowy

Recon Etapu 6c (`P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1/01-operator-recon.md`)
§4 — ten dokument jest bezpośrednim follow-upem tamtego znaleziska; nie
edytowano tamtego pliku merytorycznie.
