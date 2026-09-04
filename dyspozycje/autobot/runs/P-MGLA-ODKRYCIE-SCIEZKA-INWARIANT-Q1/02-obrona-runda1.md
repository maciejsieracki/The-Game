# P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 — Obrona Operatora, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`
MODEL+EFFORT: Opus 5, effort high (Operator — obrona, §3c pkt 2)
GOAL: bez zmian wobec `00-dispatch.md` (GOAL 1-4, GOAL 3 obowiązkowy).
RUNDY: 1/5 — **obrona NIE jest osobną rundą** (§3a, §16b pkt 5).
DEPLOY/PUSH: NIE WYKONANO

Cztery zarzuty, cztery odpowiedzi. **Wszystkie cztery: PRZYJMUJĘ.** Trzy poprawione w tej
samej rundzie; czwarty domknięty nowym dowodem, nie argumentem.

---

## Zarzut 1 — inwariant nie wykrywa `u['q'] =` ani `Object.assign` → **PRZYJMUJĘ**

Zarzut trafny i najpoważniejszy z czterech: teza „`.q =` jest KOMPLETNĄ SIECIĄ" opierała się
na wykluczeniu wykonanym **ręcznie, raz, na bazie**, a inwariant ma chronić przyszłość.

**Poprawka:** blok **[1c]** w `gra/tools/mgla-sciezka-inwariant-test.cjs` — trzy nowe skanery
z licznikiem zerowym poza jawną, uzasadnioną whitelistą:

| Skaner | Whitelista | Stan na HEAD |
|---|---|---|
| `RE_ZAPIS_NAWIASOWY` = `/\[\s*['"](q\|r)['"]\s*\]\s*=(?!=)/` | `DOZWOLONE_NAWIASOWE` — 6 wpisów `userData['q'\|'r']` (Three.js), każdy z uzasadnieniem | 6 trafień, wszystkie sklasyfikowane |
| `skanujObjectAssign` — pierwszy argument wycinany z uwzględnieniem zagnieżdżeń | `DOZWOLONE_OBJECT_ASSIGN` (pusta) + reguła „argument kończy się `.style`" | 244 wywołania, 0 podejrzanych |
| `RE_ZAPIS_ZLOZONY` — `u.q += dq`, `u.q++`, `--u.r` (dołożone ponad zarzut, ta sama klasa luki) | brak wyjątków | 0 |

**Dowód — odtworzony eksperyment Evaluatora**, nowy plik `gra/src/game/nowy-ruch.ts`
z przeskokiem wieloheksowym bez odkrycia ścieżki, usuwany po pomiarze:

| Wariant piątego miejsca | Przed poprawką | Po poprawce |
|---|---|---|
| `u['q'] = last.q; u['r'] = last.r;` | 24 pass / **0 fail** | **36 pass / 2 fail** |
| `Object.assign(u, { q: last.q, r: last.r });` | 24 pass / **0 fail** | **37 pass / 1 fail** |
| po usunięciu pliku | — | **42 pass / 0 fail** |

Nietautologiczność samych nowych skanerów jest asertowana w bloku [5] na źródłach
syntetycznych (m.in. że `['queue']` nie jest fałszywym alarmem, że `>=`/`<=`/`!==` nie są
mylone z przypisaniem, że przecinek wewnątrz pierwszego argumentu `Object.assign` go nie ucina).

**Kontrola regresji po refaktorze** (`skanujZrodlo` → `skanujWzorcem`): mutacja miejsca 1/3,
2/3 i czwartego nadal czerwieni bramkę — po 40 pass / 2 fail każda, 42/0 po przywróceniu.

---

## Zarzut 2 — zapisany wynik komendy wykluczającej jest nieprawdziwy → **PRZYJMUJĘ**

Zarzut trafny co do faktu. Sprawdzone niezależnie: `grep -rnE 'Object\.assign' gra/src
--include=*.ts` → **244**, nie 0. Zapisana liczba nie była tym, co dostaje ktoś, kto uruchomi
komendę — a to jest dokładnie ta klasa twierdzenia, przez którą temat wraca po raz czwarty.

**Poprawka** w `dowody/GOAL1-inwentaryzacja.md`:

1. Sekcja przemianowana z „Wykluczone wzorce pośrednie (sprawdzone, ZERO trafień)" na
   „Wzorce pośrednie — komendy rozstrzygające i ich PRAWDZIWE wyniki", z jawną adnotacją, że
   poprzedni zapis był nieprawdziwy.
2. Komendy przeniesione z tabeli do bloku ```bash — w tabeli markdown `|` wymaga escapowania
   jako `\|`, więc skopiowana komenda **nie zadziałałaby**; to ta sama pułapka co w zarzucie.
3. Wpisana komenda faktycznie rozstrzygająca:
   `grep -rnoE 'Object\.assign\([^,]*,' gra/src --include=*.ts | grep -v '\.style' | wc -l` → **0**,
   obok naiwnej z jej prawdziwym wynikiem **244**.
4. Wniosek skorygowany: `.q =` **nie jest** kompletną siecią samo z siebie; kompletną siecią
   jest dopiero suma czterech skanerów bloku [1] + [1c].
5. Kolumna „Egzekwowany w bramce?" — trzy wzorce TAK, dwa (spread, podmiana elementu tablicy)
   jawnie NIE, z uzasadnieniem, zamiast udawania pokrycia, którego nie ma.

**Wszystkie zapisane liczby zweryfikowane ponownym uruchomieniem** (skrypt kontrolny):
A 0/0, B 6, C 244→0, D 0/0.

**Znalezisko własne przy okazji tej weryfikacji** (nie było w zarzutach): komenda główna
zwraca na HEAD **48**, nie 47. Różnica to jedna linia KOMENTARZA dodana przez tę rundę
w `main.ts` — komentarz cytuje własny wzorzec. Skaner bramki pomija całe linie komentarza,
więc widzi niezmiennie 47 trafień na poziomie kodu (potwierdzone rozbiciem na pliki:
main 26, post-battle 8, battleScene 8, scout 2, ai-city 2, manualBattle 1). Uzgodnienie
zapisane w inwentaryzacji, żeby nikt nie dostał innej liczby niż zapisana.

---

## Zarzut 3 — bramka nigdzie nie zarejestrowana, więc nie jest „automatyczna" → **PRZYJMUJĘ**

Zarzut trafny. Potwierdzam własnym sprawdzeniem: `R-PROC-AUTOBOT.md` §6 wymienia 8 bramek —
`logic`, `tech-tree`, `research`, `unit-replace`, `combat`, `unit-power`, `map-gen`, `tsc` —
i **żadnej bramki mgły**; `.github/` i `.husky/` nie istnieją; w `gra/tools/` nie ma runnera
zbiorczego. Uruchomienie tych bramek zależy dziś wyłącznie od tego, że dispatch je nazwie.

**Poprawki NIE robię — i to jest zachowanie zgodne z §14, nie porażka.** Rejestr bramek żyje
w `docs/decyzje/R-PROC-AUTOBOT.md`, plik **zakazany bezwzględnie** w `00-dispatch.md`
(„Zakazane bezwzględnie: … `docs/decyzje/**`"), a §9 pkt 4 dodatkowo zabrania wieźć zmianę
procesu w allowliście tematu produktowego. Edycja byłaby natychmiastowym FAIL.

Rozważyłem i **odrzuciłem** obejście w allowliście: dopisanie wywołania inwariantu do
`mgla-teleport-koniec-tury-test.cjs` (plik jest w allowliście). Zmieniłoby to jego wynik
z 16/16, a `00-dispatch.md` §KRYTERIA KOŃCA wymaga wprost „16/16 — bez regresu". Obejście
naruszyłoby kryterium końca tego samego dispatchu i nadal nie dałoby automatyzmu — nadal
ktoś musiałby uruchomić tę drugą bramkę.

**Zapisane jako ryzyko rezydualne** w `01-operator-runda1.md` (nota 2) z wnioskiem o osobny
temat `PROCESS`, proponowane ID **`P-PROC-BRAMKI-MGLA-REJESTRACJA-Q1`**, zakres: dopisanie
`mgla-sciezka-inwariant-test.cjs`, `mgla-sciezka-rzeka-test.cjs` i `mgla-sciezka-live-test.cjs`
do tabeli §6 (allowlista: `docs/decyzje/R-PROC-AUTOBOT.md`). Przyznaję wprost: raport rundy 1
nie wspominał o tym ani słowem i to była luka po mojej stronie.

---

## Zarzut 4 — brak dowodu z żywej przeglądarki → **PRZYJMUJĘ**

Evaluator zostawił klasyfikację tematu Final Control. **Nie odsyłam tego pytania dalej —
usuwam je, dostarczając dowód**, bo trzy poprzednie rundy przeszły zielone bramki
kontraktowe przy nadal widocznym błędzie i to jest dokładnie ten tryb porażki.

**Nowa bramka `gra/tools/mgla-sciezka-live-test.cjs`** (allowlista: „nowe bramki
`gra/tools/*-test.cjs`"). Realny `vite build` (`--outDir` w `os.tmpdir()`, poza drzewem repo,
C-001) → headless Chromium → `?playtest=mapa` → realny klik w
`button.uc-act-btn[data-act="scout-explore"]` (przycisk „Zwiedzaj") → realny koniec tury.

Hak `__mglaSciezkaTestDebug` w `main.ts` steruje **wyłącznie danymi wejściowymi** scenariusza
(gdzie stoi zwiadowca — przez REALNY `spawnDifficultyBonusUnit`; jaka jest mgła na starcie
pomiaru — przez REALNY `refreshFog()`; która jednostka zaznaczona) i czyta stan. Nigdy nie
dopisuje do `explored`. Ten sam wzorzec i to samo ograniczenie co `__dyploMapaOdkrycieTestDebug`.

**Asercja główna [C3] nie wymaga znajomości trasy:** istnieje heks, który (a) doszedł do
`explored` w tej turze i (b) NIE jest widoczny z pozycji KOŃCOWEJ zwiadowcy. Gdyby odkrycie
powstawało wyłącznie z heksu końcowego — jak w zgłoszeniu właściciela — ten zbiór byłby pusty.

| Przebieg | Dystans | Nowe heksy | Widoczne z końca | **Odkryte tylko po drodze** | Wynik |
|---|---|---|---|---|---|
| normalny | 3 heksy w 1 turze | 5 | 91 | **2** | **11 pass / 0 fail** |
| `--mutacja` (odkrycie per-krok → no-op) | 3 heksy w 1 turze | 3 | 91 | **0** | 10 pass / **1 fail** [C3] |

Przebieg mutacyjny odtwarza w żywej grze **dosłownie** zdanie właściciela: „odkrywa się w tym
miejscu, w którym pojawi się na końcu, a nie odkrywa nic po drodze". Skrypt przywraca
`main.ts` po przebiegu — potwierdzone `git diff --stat` (jeden hunk, +70, sam hak testowy).

Zrzuty: `dowody/live-01-przed-tura.png`, `dowody/live-02-po-turze.png`,
`dowody/live-02-po-turze-MUTACJA.png` (stan sprzed naprawy).

**Uwaga metodologiczna, którą zostawiam Final Control:** żywa przeglądarka domyka GOAL 2 i
GOAL 4 (zachowanie), ale **nie może** domknąć GOAL 3. Inwariant jest twierdzeniem o zbiorze
wszystkich przyszłych miejsc w kodzie; żaden zrzut ekranu tego nie dowodzi, dowodzi tego
mutacja. Dlatego dowód tego tematu jest z konieczności dwuczęściowy i obie części są tu obecne.

---

## NOTA Evaluatora (poza §16a) — długość raportu → **PRZYJMUJĘ**

`01-operator-runda1.md` miał 861 słów przy limicie ~400. Skrócony; surowe dane (tabele
mutacji, liczby przebiegów) przeniesione do `dowody/GOAL3-nietautologicznosc.md`, zgodnie
z §11 („surowe materiały zostają w `dyspozycje/autobot/runs/<ID>/`").

---

## Znalezisko własne — NUL w pliku bramki (zgłaszam sam, nie było w zarzutach)

`mgla-sciezka-inwariant-test.cjs` w commicie `6a162196` zawierał **12 bajtów NUL** (klucz
trafienia budowany jako `plik + '\0' + tekst + '\0' + nr`). Git klasyfikował plik jako
binarny — `git diff` pokazywał „Binary files differ", `grep` go pomijał, czyli recenzent
bramki nie mógł jej przejrzeć normalnymi narzędziami. Zastąpione funkcją
`klucz(plik, tekst, nr)` → `JSON.stringify([...])`: separator nadal niemożliwy do podrobienia
przez treść pola, ale drukowalny. `file` potwierdza „JavaScript source, UTF-8 text";
0 bajtów NUL. Zero zmian semantyki — 42/42 przed i po.

---

## KOMPLET BRAMEK PO POPRAWKACH

tsc 5.9.3 exit 0 · **inwariant 42/42** (było 24/24) · rzeka 14/14 · **live 11/11 (NOWA)** ·
mgla-teleport **16/16 bez regresu** · logic 213/213 · tech-tree 19/19 · research 33/33 ·
unit-replace 13/13 · combat 6/6 · scout-auto-explore 25/25.

`mgla-odkrycie-wzdluz-sciezki` — 16 pass / 1 fail, **bez zmiany wobec bazy** (C-058,
potwierdzone niezależnie przez Evaluatora: `currentVisible()` bajt w bajt identyczne na
`20f9993d` i HEAD). Plik poza allowlistą, nie dotykany.

NASTĘPNY KROK: Final Control (Sonnet 5, effort high) — werdykt per zarzut (§3c pkt 3).
