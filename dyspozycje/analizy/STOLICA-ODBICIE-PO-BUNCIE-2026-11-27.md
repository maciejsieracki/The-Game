# Stolica AI po buncie i odbiciu miasta (R-WEB-CAPITAL-RECAPTURE-Q1, tag CAPRECAP)

Baza: origin/main `af3e0f141bdee917a1261ffa9c87e8561c80cc07`. Data: 2026-11-27.
Zakres: tylko odczyt kodu i pomiar na module czystym. Zero zmian w `gra/src`.

## 1. Stan kodu (odczyt)

- `main.ts:2479` — `capitalCityIdByOwner: Map<ownerId, cityId>` (jawny wpis stolicy).
- `main.ts:40167` — `capitalCityIdForOwner(ownerId)`: jawny wpis zwracany TYLKO gdy miasto
  istnieje i nadal ma tego właściciela; inaczej fallback na najstarsze miasto właściciela.
  Ten resolver zasila etykiety `isCapital`, Mennicę, efekty stolicy, panel i ekonomię tury.
- `main.ts:41828` — `transferCityToRebelFactionWithLedger`: bunt zmienia WYŁĄCZNIE
  `city.ownerId` na `REBEL_FACTION_OWNER_ID` (-99). Nie czyści ani nie przenosi wpisu
  `capitalCityIdByOwner`, nie uruchamia sukcesji ani `applyCapitalCapturePlunder`.
- `main.ts:40744` — `runCapitalCapturePlunder`: dla `oldOwner === -99` osobna ścieżka (bez stolicy).
- `main.ts:40764` — kluczowe: `designatedCapitalId = capitalCityIdByOwner.get(oldOwner) ?? undefined`,
  czytane SUROWO, bez walidacji i bez użycia resolvera.
- `game/capital-capture.ts:102` — `wasCapitalOfOldOwner`: gdy `designatedCapitalId != null`,
  kryterium „to była stolica” = porównanie id z tym surowym wpisem (CAŁOŚĆ kryterium).
  Dopiero gdy brak wpisu, używany jest fallback „najstarsze miasto”.

## 2. Rozjazd (hipoteza z dispatchu — potwierdzona na poziomie kodu)

Po buncie stolicy AI (miasto X, wpis = X):

| Stan | Surowy wpis (`capitalCityIdByOwner`) | Efektywna stolica (`capitalCityIdForOwner`) | Kryterium przejęcia stolicy (`wasCapitalOfOldOwner`) |
|---|---|---|---|
| Przed buntem | X | X | X |
| Po buncie X (ownerId = -99) | X (nieaktualny) | Y = najstarsze pozostałe miasto | X |
| Po przejęciu Y przez innego właściciela | X (nieaktualny) | Z = najstarsze z pozostałych | X -> Y NIE spełnia kryterium |

Skutek, który wynika z kodu:
- przejęcie FAKTYCZNEJ stolicy (Y) nie uruchamia plunderu skarbca/puli pracy/nauki,
  nie uruchamia sukcesji (`newCapitalIdForOldOwner`) i nie generuje raportu „przejęcie stolicy”;
- przeniesienie efektywnej stolicy na Z następuje cicho (resolver), bez zdarzenia;
- stary wpis X pozostaje w mapie. Jeśli X wróci do AI (odbicie/cesja), efektywna stolica
  wraca na X automatycznie (wpis jest ważny po odzyskaniu miasta).

Nie stwierdzono w kodzie: dwóch jednoczesnych stolic (resolver waliduje właściciela),
ani braku stolicy przy istniejącym mieście (fallback zawsze daje miasto, jeśli istnieje).

## 3. Pomiar na module czystym (NIE live)

Narzędzie: `gra/tools/capital-recapture-stale-designation-test.cjs` (nowe; bundle esbuild
do plików tymczasowych i sprzątanie; bez przeglądarki). Stan: AI (owner 1) ma city1 (najstarsze),
city2 (wpis stolicy), city3; gracz (0) ma city4.

Wynik uruchomienia (surowy wyjściowy stdout):

```
MEASURE S1-po-buncie {"surowyWpis":"city2","wpisWazny":false,"efektywnaStolicaAI":"city1"}
MEASURE S1-przejecie-efektywnej-stolicy {"wynikCapture":null,"oczekiwanoWgResolvera":"city1","zgodnosc":"NIEZGODNE (brak plunderu/sukcesji dla faktycznej stolicy)","efektywnaStolicaAIpo":"city3","surowyWpisPo":"city2"}
MEASURE KONTROLA-wpis-wyczyszczony {"wynikCapture":"przejecie_stolicy","zgodnosc":"OK"}
MEASURE S2-odzyskanie-stolicy {"efektywnaPrzed":"city1","efektywnaPo":"city2","surowyWpis":"city2","uwaga":"stary wpis wraca do roli stolicy automatycznie (sprawdzic oczekiwanie)"}
```

Interpretacja:
- S1: po buncie efektywna stolica = city1 (wpis nieważny). Przejęcie city1 daje `null` = brak
  plunderu i sukcesji. Reprodukcja rozjazdu z kodu: TAK (na module czystym).
- KONTROLA: gdy wpis jest wyczyszczony przy buncie, to samo przejęcie daje `przejecie_stolicy`.
  Wskazuje to na poprawkę: kasować/przenosić wpis przy zmianie właściciela miasta-stolicy.
- S2: odzyskanie X przez AI przywraca X jako stolicę (zgodne z resolverem; do decyzji, czy
  to jest pożądane — nie zmieniano).

## 4. Co NIE zostało zmierzone (live)

- S1–S5 w przeglądarce (Trudny, Wysoki x4, kultura trudny, dyplomacja trudna; seed 4242 i 7;
  min. 3 konfiguracje startowe): NIE ZMIERZONO. Powód: w tej rundzie nie uruchomiono Chromium
  ani buildu live; pomiar wymaga też realnego przejęcia stolicy przez armię (nie hak cesji,
  bo cesja nie idzie ścieżką `applyCapitalCapturePlunder`). Istniejące narzędzia
  `caprebel2-live.cjs` (tryb `odb`) robią cesję hakiem, nie zdobycie — nie odtwarzają tej ścieżki.
- Mennica/efekty stolicy po przejęciu efektywnej stolicy: NIE ZMIERZONO na żywo.
- Round-trip zapisu w środku (S5): NIE ZMIERZONO.

## 5. Proponowana poprawka (NIE wdrożona w tej rundzie)

Minimalna, zgodna z dispatchem („wpis czyszczony/ustawiany przy zmianie właściciela miasta,
bez zmiany balansu”): w `transferCityToRebelFactionWithLedger` oraz w `transferCityByTreaty`
(ścieżka cesji), przed zmianą `city.ownerId`:

- jeśli `capitalCityIdByOwner.get(fromOwner) === city.id`, usunąć wpis tego właściciela
  (`capitalCityIdByOwner.delete(fromOwner)`).

Skutek: `wasCapitalOfOldOwner` wraca do zgodności z resolverem (fallback „najstarsze miasto”),
efektywna stolica = surowa stolica, plunder/sukcesja działa przy przejęciu faktycznej stolicy.
Brak zmiany wartości (balans, formuły, progi) — zmienia się tylko, KTÓRE przejęcie uruchamia
konsekwencje stolicy. Zapis wstecznie zgodny (pusty wpis = fallback, obsługiwany już dziś).

Uwaga do decyzji orkiestratora: po poprawce przejęcie faktycznej stolicy AI zacznie
uruchamiać plunder (skarbiec/pula nauki) i sukcesję. To zmiana zachowania gry, nie tylko
techniczna — wymaga oceny, czy to zamierzone (wg komentarza w `capital-capture.ts` tak: „przejęcie
stolicy = plunder”). Jeśli właściciel uzna inaczej, to pytanie ABC, nie decyzja inżynierska.

Testy do poprawki (po decyzji): regresja w `capital-recapture-stale-designation-test.cjs`
(oczekiwanie `przejecie_stolicy` dla S1 po poprawce; mutacja czerwona = wyłączenie czyszczenia),
oraz bramki z dispatchu (`ai-test 297/0`, `wiring 267/0`, `capital-capture-test`).

## 6. Otwarte

- Pomiar live S1–S5 (3 konfiguracje, 2 ziarna) — do wykonania w osobnej rundzie.
- Zachowanie S2 (automatyczny powrót stolicy na odzyskane miasto) — do potwierdzenia jako zamierzone.
