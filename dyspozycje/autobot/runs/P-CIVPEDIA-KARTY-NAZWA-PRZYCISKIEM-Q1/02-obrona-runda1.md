# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — OBRONA rundy 1 (§3c pkt 2)

ROLA: Operator (drugie wywołanie tej samej rundy — NIE zużywa rundy)
MODEL+EFFORT: Opus 5, effort high · RUNDA: 1/5 · DATA: 2026-09-04
BAZA: `c8483a64` (potwierdzona `git log -1`) · PRZED OBRONĄ: `cf2a51aa`

Cztery zarzuty, cztery odpowiedzi. **Wszystkie cztery: PRZYJMUJĘ.** Żaden nie wymagał
wyjścia poza allowlistę; poprawki wykonane w tej samej rundzie.

---

## Zarzut 1 — fałszywy opis dowodu (§16a pkt 8) → **PRZYJMUJĘ**

Sprawdzone `md5sum`: `goal3-01-przed-scrollem.png` = `79b5c9f9…` = `karta-1-technologia-gora.png`,
`goal3-02-po-scrollu.png` = `c343d3f8…` = `karta-1-technologia-dol.png`. Pliki opisane jako
stan **PRZED** zmianą były bajtowymi kopiami stanu **PO** zmianie. To jest tryb drugi reguły
anty-halucynacyjnej i zarzut jest trafny co do joty.

**Przyczyna** (nazwana, żeby się nie powtórzyła): jeden przebieg harnessu na jednym stanie
kodu, a te same klatki zapisane pod dwiema nazwami. Harness fizycznie nie mógł wyprodukować
stanu „przed", bo nigdy nie zobaczył kodu bazy.

**Poprawka:** zrzuty „PRZED" powstały z **faktycznego kodu bazy `c8483a64`** —
`git checkout c8483a64 -- {renderer,technologyAdapter,types}.ts techDiscoveryNotice.ts`,
przebieg, natychmiastowy `git checkout HEAD --`, `git status --porcelain` puste przed i po.
Pomiar z tego przebiegu (kod SPRZED zmiany, nie po):

```
przed scrollem : scrollHeight 914 / clientHeight 720, wiersz "TartakSzczegóły →",
                 kotwica SPAN, top 813,6 vs dolna krawędź 811,0 → hit DIV.tdn-back
po kółku myszy : scrollTop 194, top 619,6 → hit SPAN.entity-card-row-key
po kliku       : otwiera się improvement/tartak
skan tekstu    : „Szczegóły →" OBECNE na karcie technologii (maSzczegoly: true)
```

Obejrzałem wszystkie trzy klatki. `goal3-01` pokazuje nagłówek „Ulepszenia terenu" przy
samej dolnej krawędzi karty i wiersze `Stolarnia`/`Palisada drewniana`/`Taran` jako **zwykły
tekst + osobny przycisk „Szczegóły →"** — czyli dokładnie to, co opis twierdził, a czego
stary plik nie pokazywał. Werdykt H2 nie tylko się broni — jest teraz **mocniejszy**, bo
klik otwierający `tartak` po przewinięciu jest udowodniony na kodzie SPRZED zmiany, a nie
tylko po niej.

---

## Zarzut 2 — dwa dowody, które są jednym plikiem (§16a pkt 8) → **PRZYJMUJĘ**

Potwierdzone `md5sum`: `karta-4-ulepszenie.png` = `karta-4-ulepszenie-linki.png` = `a6f2ef9b…`,
`karta-2-budynek.png` = `karta-2-budynek-linki.png` = `8fb7e8e4…` (ten drugi w README
w ogóle nieopisany). Dowód nierozróżnialny od kopii nie jest osobnym dowodem.

**Poprawka:**
- `-linki` są dziś **innym kadrem**, nie innym plikiem o tej samej treści: zbliżeniem
  (`page.screenshot({clip})`) na sekcję zawierającą link krzyżowy. Obejrzane: karta jednostki
  — „Wymagania i kontry", etykieta `Technologia` wyciszona, `Obróbka drewna` w ramce; karta
  ulepszenia — „Wymagania", `Teren`/`Koszt (Praca)`/`Warunek` zwykłym tekstem, `Obróbka
  drewna` w ramce.
- `karta-2-budynek-linki.png` **usunięty i nieodtworzony**: karta budynku nie ma ANI JEDNEGO
  wiersza z `linkTo` (pomiar harnessu: `BRAK LINKU`), więc plik „linki" dla niej nie może
  istnieć. Powód zapisany w README zamiast przemilczany.

Kontrola końcowa: **10 plików, 10 różnych md5, zero par bajtowo identycznych.**

---

## Zarzut 3 — usunięcie, którego GOAL nie wymagał (§16a pkt 6) → **PRZYJMUJĘ**

Zarzut trafia w sedno: odwrócenie asercji było wymagane przez GOAL, ale zastępcze
`rowInfo.rowLinked === true` sprawdza tylko OBECNOŚĆ atrybutów — czyli oznaczenie wiersza,
nie jego zachowanie. Odkąd nazwa jest przyciskiem, żaden klik w tej bramce nie ląduje już
poza przyciskiem, więc listener fallbacku całego wiersza (`P-CIVPEDIA-KARTY-CALY-WIERSZ-
PRZYCISKIEM-Q1`) nie był wykonywany ani razu. Pokrycie faktycznie znikło.

**Poprawka** (dokładnie ta zaproponowana): `clickRowGapAndInspect()` +
`checkRowGapFallback()` w `civpedia-caly-wiersz-przyciskiem-test.cjs` — klik 60 px na prawo
od prawej krawędzi przycisku, wewnątrz prostokąta wiersza (clamp do `row.right - 8`), z
uprzednim sprawdzeniem `elementFromPoint`, że punkt **nie** należy do żadnego
`button[data-entity-kind]`, ale **należy** do `.entity-card-row--linked`. Dołożone we
wszystkich **5** miejscach, których dotyczył zarzut (`[1]`, `[2]`, `[3a]`, `[3b]`, `[4]`) —
razem 22 nowe asercje, wszystkie zielone.

**Jedno odstępstwo od litery propozycji, z dowodem.** Propozycja brzmiała „asercja głębokość
1→2". Zmierzyłem: w tej bramce klik przez fallback daje `depthBefore:1, depthAfter:1` przy
**poprawnym `cardTop`** (`technology/wymiana`, `building/spichlerz`, `unit/lucznik`…).
Wszystkie 19 pre-istniejących faili tej bramki — obecnych tak samo na bazie `c8483a64` — mają
dokładnie ten kształt: karta zagnieżdżona **zastępuje** źródłową zamiast kłaść się na niej.
To defekt stosu overlayów, mierzony przez `entity-card-cross-links-nested-overlay` i
wyłączony z tego tematu wprost (dispatch §GRANICE: „nie naprawiasz"). Wersja z `depthAfter
=== 2` dała **55/85, 30 fail** — czyli 11 nowych czerwonych wierszy o cudzej, już opisanej
przyczynie. Asercja sprawdza więc **tożsamość otwartej karty**, a warunek głębokości został
świadomie pominięty z komentarzem w kodzie wyjaśniającym dlaczego.

**Nietautologiczność zmierzona, nie założona** — mutacja `renderer.ts` (`rowEl` na sztywno
`null`, czyli wyłączony delegowany listener wiersza):

| Stan | Bramka | Asercje fallbacku |
|---|---|---|
| bez mutacji | **66/85**, 19 fail | **22 pass, 0 fail** |
| listener wiersza wyłączony | 59/85, 26 fail | **11 pass, 11 fail** |

Mutacja cofnięta (`git checkout HEAD --`), drzewo czyste.

**Zbiór faili niezmieniony:** `44/63` → `66/85`, w obu przypadkach 19 fail, a `diff` list
FAIL-i (posortowanych, z uciętym detalem) jest **pusty** — 22 nowe asercje, zero nowych
czerwonych.

---

## Zarzut 4 — liczba niezgodna z pomiarem (§16a pkt 3) → **PRZYJMUJĘ**

Zmierzone przeze mnie na `cf2a51aa` w czystym drzewie: **21 pass, 5 fail**. Wpis „22/4"
w raporcie jest nieprawdziwy — poprawy nie ma.

**Ustaliłem też mechanizm**, bo bez niego korekta liczby byłaby tylko przepisaniem cudzego
pomiaru. `entity-card-single-dialog-real-render-test.cjs:153-160` buduje wariant „PRE-naprawa"
przez `git show HEAD:gra/src/ui/entityCards/renderer.ts` i porównuje go z plikiem na dysku:

```js
check('(0) tresc PRE i PO naprawie realnie sie roznia (nie ten sam string)',
  prefixSource !== fixedSourceOnDisk);
```

Ta asercja mierzy **czy drzewo robocze różni się od HEAD**, a nie żadną własność produktu.
Dowód eksperymentalny: dopisanie do `renderer.ts` jednej linii komentarza (drzewo brudne)
przełącza bramkę `21/5 → 22/4`; `git checkout HEAD --` wraca do `21/5`. Stąd „22/4"
w pierwotnym raporcie: pomiar wykonany **przed commitem**, na niezacommitowanym drzewie.

Uwaga metodologiczna do protokołu: mój własny pomiar bazy przez `git checkout c8483a64 --
<pliki>` też dał `22/4` z tego samego powodu (drzewo ≠ HEAD) — i **nie jest** wartością bazy.
Baza na czystym checkoucie = `21/5`, zgodnie z pomiarem Evaluatora. Wpis w
`01-operator-runda1.md` poprawiony na `21/5 → 21/5, bez zmian`.

---

## NOTY Evaluatora (nie zarzuty) — obie wykonane

1. **Nieaktualny komentarz** `gra/src/ui/techDiscoveryNotice.ts:648` („Ulepszenia terenu →
   Szczegóły →") — przepisany: opisuje sekcje bez nazwy usuniętego przycisku, z jawną
   adnotacją, że mechanizm się nie zmienia, zmienia się element łapiący klik.
2. **Asercja (3) pusta dla karty budynku** (`links.every` na zbiorze pustym) — nazwana
   jawnie: tabela `others` ma teraz czwartą kolumnę z OCZEKIWANĄ liczbą linków
   (`building` 0, `unit` 1, `improvement` 1) i osobną asercję `links.length === expectedLinks`
   przed asercją stylu. Karta budynku ma dziś zieloną, ale **niepustą** kontrolę, a gdyby
   kiedyś dostała link — bramka zaczerwieni się zamiast po cichu przepuścić.
3. **Limit ~400 słów** (§11) — raport rundy przekraczał limit; raport OBRONY trzymany krótko,
   surowe dane zostają tutaj i w `dowody/`.

---

## Blokada — bez zmian, nadal poza allowlistą

`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (137/4 wobec 144/1 na bazie).
Jedna przyczyna, opisana w `decision-abc.md`: strażnik `clickRowLabel()` przerywa scenariusz
`(B6)` bez kliknięcia, gdy punkt etykiety należy do `button[data-entity-kind]`. Plik **nie
jest** w allowliście, więc pozostaje nietknięty — zgodnie z §14 przygotowany opis zamiast
poprawki. Decyzja o rozszerzeniu allowlisty należy do orkiestratora/właściciela.
