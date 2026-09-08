STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1
GOAL: Weryfikacja niezależna (runda 2) poprawek Obrony rundy 1: korekta wniosku o
nakładaniu z 6a (playerIsAtWarWith), pełna lista funkcja-po-funkcji klastra silnika
(§4), konkretny plan dowodu no-op (§6), spójność końca dokumentu z poprawkami.
MODEL+EFFORT: sonnet-5, effort high

TESTY (własne, niezależne, świeże): git log/status w
`/home/user/wt-hotseat-etap6d-recon` (3 commity: recon+Evaluator+Obrona, poprawny
branch); świeży `git status --short` + `git diff -- gra/src/main.ts | grep -n
playerIsAtWarWith` w `/home/user/wt-hotseat-etap6a-input` (potwierdza dokładnie
diff z Obrony: 1 blok, `openPlayerMapUnitAttack` L303-304, ciało funkcji
main.ts:9843-9846 nietknięte); świeży brace-matched sample main.ts na 4 pozycjach
z tabeli §4 (`isActiveDiploOwner`:6369-6373, `buildPlayerDiploSummary`:6498-6521 w
CAŁOŚCI, `recordWarDeclarationEvent`:8333-8368 w CAŁOŚCI,
`applyAllianceObligationsOnWar`:18709-18760 w CAŁOŚCI,
`buildDiplomacyTickCtxForPair`:17927-17952 w CAŁOŚCI,
`getRelationBreakdown`:17961-17985); świeży `ls gra/tools/ | grep hotseat` (5
plików) + `find` po `*economy*`/`*6c*` (0 wyników) do weryfikacji odwołania w §6.

BLOKADY: patrz zarzuty niżej.

RUNDY: 2/5

ZARZUTY:

1. Zarzut 1 z rundy 1 (nakładanie z 6a / playerIsAtWarWith) — POTWIERDZONY
   NAPRAWIONY, bez zastrzeżeń. Własny świeży `git diff` w
   `/home/user/wt-hotseat-etap6a-input` daje identyczny wynik co Obrona
   (dokładnie ten sam 2-liniowy diff, `openPlayerMapUnitAttack`). §5 teraz
   jawnie rozróżnia "nie w main" (prawdziwe) od "6a w ogóle jej nie tknęła"
   (fałszywe) i dodaje rekomendację kolejności integracji (6d po 6a na
   `openPlayerMapUnitAttack`, z opisem ryzyka konfliktu tekstowego). Brak
   dalszych uwag do tego punktu.

2. Zarzut 2 z rundy 1 (pełna lista funkcja-po-funkcji, klaster silnika) —
   TABELA §4 SAMA NIE JEST KOMPLETNA W SWOIM WŁASNYM, ZADEKLAROWANYM ZAKRESIE.
   Obrona twierdzi "70/89 zero hardkodów, 19/89 mają łącznie 35 odrębnych linii
   — wszystkie linie wypisane" jako kompletną listę dla klastra "hardkod
   wewnątrz ciała nazwanej funkcji dyplomacji". Własny świeży, pełny (nie
   próbkowy per-linia, tylko fragment) `Read` całych ciał 2 z 19 funkcji z
   tabeli obala tę kompletność:
   - `buildPlayerDiploSummary` (main.ts:6498-6521) — tabela podaje TYLKO linie
     6500 i 6508 (`c.ownerId===0`, `u.ownerId===0`). Świeży pełny odczyt ciała
     ujawnia co najmniej 8 DALSZYCH linii z literałem `0` jako argumentem
     funkcji dyplomacji/cywilizacji reprezentujących "gracza" — dokładnie ten
     wzorzec, który dispatch (00-dispatch.md pkt 2) wprost nazywa w zakresie
     ("literał `0` jako argument funkcji dyplomacji"): 6499
     `civKeyForOwner(0)`, 6504 `objectivePowerForOwnerEffective(0)`, 6506
     `getWiarygodnosc(0)`, 6511 `ownerDiploLabel(0)`, 6512
     `civTypeForOwner(0)`, 6513 `civKolorHexFn(0)`, 6515
     `epochLabelForOwner(0)`, 6516 `empireEpochForOwner(0)`. Z czego
     `getWiarygodnosc(0)` i `ownerDiploLabel(0)` to DWIE z 15 funkcji
     dyplomacji jawnie wymienionych w §2-3 jako "śledzone" — a mimo to ten
     konkretny call-site nie pojawia się ani w tabeli §4, ani nie jest
     rozliczony gdzie indziej w dokumencie.
   - `buildDiplomacyTickCtxForPair` (main.ts:17927-17952) — tabela podaje
     linie 17934, 17939, 17940, ale pomija L17950
     (`wiarygodnoscSelf: atWar || !playerInPair ? undefined :
     getWiarygodnosc(0)`), czwarty hardkod wewnątrz TEJ SAMEJ funkcji, tego
     samego rodzaju co pozostałe trzy.
   - Dodatkowo `getRelationBreakdown` — dokument podaje L17976 jako jedną z 4
     linii hardkodu, ale świeży odczyt main.ts:17961-17985 pokazuje, że L17976
     to `aktywnyHandel: hasSzlakowTreaty(activeDeals, a, b),` (BEZ literału
     `0`) — realny hardkod jest na L17978
     (`contactEstablished: a === 0 ? ... : (b === 0 ? ... : true)`). Numer
     linii w dokumencie jest błędny (przesunięcie o 2).
   Weryfikacja kontrolna: `isActiveDiploOwner` (6369-6373: linia 6371 zgodna),
   `recordWarDeclarationEvent` (8333-8368: wszystkie 5 zadeklarowanych linii
   zgodne, ciało w pełni rozliczone) i `applyAllianceObligationsOnWar`
   (18709-18760: wszystkie 5 linii zgodne, ciało w pełni rozliczone) —
   POPRAWNE, więc błąd nie jest uniwersalny, ale wystarczająco częsty (2 z 6
   ręcznie zweryfikowanych funkcji w całości + 1 zła numeracja linii), by
   podważyć twierdzenie "kompletna do linii, wszystkie linie wypisane" dla
   CAŁEJ tabeli 19/89. Metoda opisana w Obronie (brace-matching granic funkcji)
   naprawiła poprzedni błąd (mylenie granic funkcji), ale najwyraźniej
   regex/wzorzec użyty WEWNĄTRZ ciała do wykrywania hardkodów łapie głównie
   porównania `zmienna===0`/`!==0` i pomija literały `0` przekazywane jako
   argumenty do innych nazwanych funkcji (nawet gdy ta wywoływana funkcja jest
   jedną z 15 śledzonych w §2-3) — czyli dokładnie ten wzorzec, o który dispatch
   ostrzegał osobno. Wniosek: sama Obrona zarzutu 2 (przyjęcie częściowe, z
   kompletną tabelą DLA klastra silnika) nie jest w pełni uzasadniona — klaster
   silnika, mimo zawężenia, NIE MA jeszcze kompletnej, wypisanej listy linii;
   ma listę z udowodnionymi lukami. Decyzja właściciela o dalszym zakresie
   (kontynuacja vs. podział tematu) pozostaje akceptowalnym rozwiązaniem
   PROCESOWYM, ale nie zwalnia z poprawienia już dostarczonej tabeli — inaczej
   przyszły dispatch implementacji 6d odziedziczy niedoliczoną allowlistę
   nawet dla zakresu, który dokument deklaruje jako zamknięty.

3. Zarzut 3 z rundy 1 (plan dowodu no-op) — NAPRAWIONY CO DO KONKRETNOŚCI
   (nazwany skrypt, metoda porównania, lista funkcji per klaster — zgodnie z
   wzorem 6c), ale z DROBNĄ NIEŚCISŁOŚCIĄ FAKTOGRAFICZNĄ: §6 nazywa
   `gra/tools/hotseat-etap6c-economy-test.cjs` "istniejącym" skryptem-wzorem
   obok `hotseat-etap3-akcesory-test.cjs`. Świeży `ls gra/tools/` (5 plików
   `hotseat-*`) i `find` po `*economy*`/`*6c*` potwierdzają, że ten plik NIE
   ISTNIEJE w repo — 6c był również recon-only (bez implementacji), więc
   skrypt testowy nie mógł jeszcze powstać. Nie podważa to samej metody
   (opis porównania bit-w-bit i lista funkcji są konkretne i wykonalne), ale
   dokument myląco przedstawia nieistniejący plik jako istniejący precedens;
   wymaga jednozdaniowej korekty (np. "wzorem NAZWY konwencji
   `hotseat-etap3-akcesory-test.cjs`; analogiczny skrypt dla 6c jeszcze nie
   powstał, bo 6c jest też na etapie recon").

Koniec dokumentu (BLOKADY/NASTĘPNY KROK/STATUS) jest spójny z treścią §4-§6 —
BLOKADY jawnie przyznają niekompletność całości i wymóg decyzji właściciela,
NASTĘPNY KROK poprawnie kieruje do oceny Evaluatora nad §4/§5/§6 — brak
powtórki błędu Etapu 6b (rozjazd podsumowania). Ten aspekt sprawdzony i OK.

NASTĘPNY KROK: Runda Obrony (kolejny wpis w tym samym pliku serii, np.
05-obrona-runda2.md) na zarzuty 2 i 3: zarzut 2 wymaga albo poprawienia tabeli
§4 o brakujące linie (co najmniej `buildPlayerDiploSummary` +8 linii,
`buildDiplomacyTickCtxForPair` +1 linia L17950, korekta numeru linii
`getRelationBreakdown` 17976→17978) i przebiegnięcia całej tabeli 19/89 metodą,
która wychwytuje TAKŻE literał-0-jako-argument (nie tylko porównania
`===0`/`!==0`), albo jawnego obniżenia twierdzenia z "kompletna, wszystkie
linie wypisane" do "reprezentatywna próbka z udokumentowanym ryzykiem
niedoliczenia dla wzorca argumentu-literału"; zarzut 3 wymaga jednozdaniowej
korekty odwołania do nieistniejącego `hotseat-etap6c-economy-test.cjs`.
DEPLOY/PUSH: NIE WYKONANO
