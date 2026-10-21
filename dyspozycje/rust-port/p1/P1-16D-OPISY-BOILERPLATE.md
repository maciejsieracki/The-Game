# P1.16D — Opisy boilerplate: status 4 pozycji z §9.5 (pin web edb8fb56)

**Temat:** R-RUSTPORT-P1-16D-OPISY-BOILERPLATE-Q1 (runda 1/5, Operator)
**Źródło:** `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2a, §2b
**Pin:** `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` — wszystkie dowody z `git show edb8fb56:<ścieżka>` (bez checkout/build/dev).
**Metoda:** własne przeliczenie na pinie (skrypt Python w scratchpadzie, nie w repo). Liczby z audytu nie przepisywano bez sprawdzenia.

## Podsumowanie statusów

| # | Pozycja | Status | Dowód (skrót) |
|---|---|---|---|
| 1 | Boilerplate „Przykład liczbowy / Strategia / Typowe błędy" w Poradniku (22 rozdziały) | NADAL ISTNIEJE (z korektą liczb audytu) | §1.1 poniżej |
| 2 | Cuda świata „×3 plony w mieście wzniesienia" (19 kart) | NADAL ISTNIEJE | §2 |
| 3 | Jednostki „Countery i taktyka" | NIEROZSTRZYGNIĘTY (twierdzenie audytu „identyczny" obalone: 13 wariantów; współdzielone bullety w grupach 15/9/9/4/3/2 wymagają decyzji produktowej) | §3 |

| 4 | Cywilizacje „Strategia dla gracza" (9/9) | NADAL ISTNIEJE | §4 |

## 1. Poradnik — liczebność bloków na pinie

Liczba wystąpień nagłówka `### Przykład liczbowy` (wszystkie 22 pliki `docs/PORADNIK-GRACZA/NN-*.md`). "Warianty" = liczba różnych treści bloku po usunięciu linii `→ [link]`.

| Rozdział | Bloki (pin) | Warianty (pin) | Audyt §2a | Zgodność |
|---|---|---|---|---|
| 00-jak-czytac | 7 | 2 | 7× | zgodne |
| 01-pierwsze-kroki | 7 | 3 | 7× | zgodne |
| 02-mapa-swiata | 8 | 6 | 8× | zgodne |
| 03-pasek-zasobow | 8 | 6 | 8× | zgodne |
| 04-jednostki-mapa | 7 | 3 | 7/8 sekcji | zgodne (7 bloków przy 7 sekcjach ##) |
| 05-budowa-mapa | 7 | 2 | brak w tabeli | nowe dane |
| 06-miasto-spoleczenstwo | 11 | 11 | brak w tabeli | treści unikalne, nie szablon |
| 07-miasto-budowa-rekrutacja | 8 | 3 | 8/8 sekcji | zgodne |
| 08-ekonomia-imperium | 6 | 6 | brak w tabeli | treści unikalne, nie szablon |
| 09-nauka-epoki | 3 | 3 | brak w tabeli | treści unikalne |
| 10-walka | 9 | 3 | brak w tabeli | wspólne szablony |
| 11-oblezanie | 8 | 2 | brak w tabeli | wspólne szablony |
| 12-dyplomacja | 8 | 2 | brak w tabeli | wspólne szablony |
| 13-cywilizacje | 6 | 2 | brak w tabeli | wspólne szablony |
| 14-ai-zagrozenia | 5 | 3 | 5× | zgodne |
| 15-kultura-religia-cuda | 6 | 2 | 6× | zgodne |
| 16-zwyciestwo | 4 | 2 | 4× | zgodne |
| 17-zaawansowane | 3 | 1 | 3× | zgodne |
| 28-katalog-ulepszen | 17 | 16 | 17× | zgodne |
| 45-katalog-budynkow | 24 | 24 | 24× | zgodne |
| 57-katalog-jednostek | **50** | 5 (różnią się tylko linie „Utrzymanie") | **47×** | **NIEZGODNE — pin ma 50, nie 47** |
| 91-katalog-cudow-antyk | 19 | 2 | 19× | zgodne |

Suma na pinie: **231 bloków** `Przykład liczbowy` w 22 rozdziałach.

**Odtworzenie liczebności (jedna komenda, bez checkout):**
`git grep -c '^### Przykład liczbowy' edb8fb56 -- 'docs/PORADNIK-GRACZA/*.md'`
Wynik (zweryfikowany 2026-10-21): 00:7, 01:7, 02:8, 03:8, 04:7, 05:7, 06:11, 07:8, 08:6, 09:3, 10:9, 11:8, 12:8, 13:6, 14:5, 15:6, 16:4, 17:3, 28:17, 45:24, 57:50, 91:19; suma 231.
Liczba wariantów (kolumna „Warianty") jest wynikiem skryptu w scratchpadzie i nie jest jednoliniowo odtwarzalna; nie jest ona podstawą statusu pozycji 1 — status opiera się na liczebności i na identycznych blokach (np. katalog 57).

Uzupełnienia do §2a audytu:
- Rozdziały 00–17 (18 plików) mają komplet trójki (`Przykład` = `Strategia gracza` = `Typowe błędy`, po tyle samo wystąpień). Katalogi 28/45/57/91 (4 pliki) mają **tylko** `Przykład liczbowy`, bez `Strategia`/`Typowe`. Audyt pisał o trójce w każdym z 22 rozdziałów — to nieprecyzyjne.
- Blok `Przykład` w katalogu 57: w każdym z 50 bloków identyczne 2 linie („Koszt **20** pracy…", „Bonus **+2 żywność**…"); zmienia się tylko linia „Utrzymanie" (wartości 0/1/2/3 ¤/t). Łącznie ok. 200 niepustych linii treści; cały blok z odstępami zajmuje 353 z 748 linii pliku.
- W 06 i 08 bloki `Przykład` mają treści specyficzne dla sekcji (nie szablon) — ten sam mechanizm nie dotyczy ich w tej formie. Nie sprawdzano osobno bloków `Strategia`/`Typowe` w tych dwóch rozdziałach.

Wniosek pozycji 1: **NADAL ISTNIEJE** — wspólne szablony nadal występują w 00–05, 07, 10–17 oraz w katalogach 28/45/57/91. Korekta do audytu: katalog 57 ma **50** bloków, nie 47.

## 2. Cuda świata „×3 plony w mieście wzniesienia" — NADAL ISTNIEJE

- Dowód danych: `git show edb8fb56:gra/src/data/wikiBundle.json` (pin). Plik to **jedna linia JSON** (`line 1`), więc dowodem jest ścieżka JSON: `encyklopedia[]` z `category == "Cuda świata"` (19 wpisów, `cuda/*`), pola `wikiM`/`full`. Zweryfikowano: **19 z 19** wpisów zawiera frazę „×3 plony w mieście wzniesienia"; łącznie 38 wystąpień frazy w pliku (= 19 × 2 pola).
- Dowód kodu: `git show edb8fb56:gra/src/game/wonders-data.ts` — linia **193**: „a więc są FLAT dodatkiem do KAŻDEGO miasta właściciela"; linia **195**: „BEZ ponownego mnożenia przez _meta.bonus_miasto_mnoznik=3".
- Dowód meta: `git show edb8fb56:gra/data/wonders.json` — linia **47** `_meta.bonus_miasto` = „Yield +/turę × KAŻDE miasto…"; linia **71** `bonus_miasto_mnoznik: 3` (pole historyczne, wartości w `cuda[].bonusy.miasto` są już wliczone). Przykład: `cuda[0]` (`piramidy`) ma `bonusy.miasto = {pieniadz:3, praca:3}` (wartość flat; nie weryfikowano osobno innych cudów).
- Wniosek: opis w wiki („×3 w mieście wzniesienia") jest sprzeczny z kodem i z `_meta`. Błąd nadal obecny na pinie.

## 3. Jednostki „Countery i taktyka" — NIEROZSTRZYGNIĘTY

- Dowód: `git show edb8fb56:gra/src/data/wikiBundle.json` (pin, jedna linia JSON), `encyklopedia[]` z `category == "Jednostki"`: 49 wpisów, każdy ma sekcję `### Countery i taktyka` w `wikiM` i `full` (0 wpisów bez sekcji).
- Na pinie są **13 różnych treści** tej sekcji (porównanie treści sekcji między polami `wikiM`+`full`, bez identyfikatorów w pliku). Grupy wg liczebności: 15 (`jednostki/hastati`, `…/berserker-germanski`, `…/gaesatae`, `…/halabardnik-shang`, `…/hu-ben-wei-gwardia-tygrysa`, `…/gwardia-krolewska-sumeru`, `…/krolewska-gwardia`, `…/medzaj-gwardia-faraona`, `…/uthulwana-bia-e-tarcze`, `…/wojownik`, `…/wojownik-germanski`, `…/wojownik-mykenski`, `…/wojownik-sherden`, `…/wojownik-z-khopesh`, `…/wojownik-z-mieczem-i-tarcza`); 9 (rydwany: `rydwan-*`, `konnica`, `jezdziec-chinski`); 9 (łucznicy/procarze/oszczepnicy: `ucznik*`, `oszczepnik*`, `procarz*`); 4 (`falanga`, `wojownik-tyrrenski`, `wojownik-z-maczuga-chaska`, `wojownik-z-toporem`); 3 (`katapulta`, `taran`, `wieza-obleznicza`); 2 (`w-ocznik-sumeryjski`, `wojownik-szekelesz`); 7 pojedynczych. Razem 15+9+9+4+3+2+7 = 49.
- Audyt twierdził „identyczny" boilerplate. Na pinie tożsamość **nie zachodzi** dla 49 jednostek (13 wariantów). Pozostaje wspólny tekst w grupach, więc czy to jest defekt do naprawy, rozstrzyga decyzja produktowa — stąd status NIEROZSTRZYGNIĘTY.
- Żadna linia nie występuje we wszystkich 49 sekcjach (jedyna wspólna to separator `---`). Powtarzają się natomiast generyczne punkty: „Słabsza od strony: masowe dystansowce z tyłu", „W bitwie ręcznej: trzymaj linię, nie rozdzielaj na pojedyncze walki", „**Powiązane:** Rekrutacja · Walka · Wręcz".
- Przykład z audytu (Hastati vs topornik) — **nie potwierdzony dosłownie**: Hastati ma dodatkowy punkt „Bonus vs włócznik: +15%" i nie jest identyczny z sekcją „Wojownik z toporem" (grupa 4 jednostek z Falangą). Nie weryfikowano wartości mocy (57,5 / 32,5).
- Wniosek: twierdzenie „identyczny akapit" jest obalone (13 wariantów). Wspólne bullety w grupach 15/9/9 nadal występują. Status: NIEROZSTRZYGNIĘTY.

## 4. Cywilizacje „Strategia dla gracza" (9/9) — NADAL ISTNIEJE

- `git show edb8fb56:gra/src/data/wikiBundle.json` (pin), `encyklopedia[]` z `category == "Cywilizacje"`: 9 wpisów (`cywilizacje/celtowie`, `…/chinczycy`, `…/egipt`, `…/germanie`, `…/grecy`, `…/inkowie`, `…/rzymianie`, `…/sumer`, `…/zulusi`).
- Linia `**Strategia dla gracza:** dopasuj rozwój do mocnych stron typu — handlowe typy buduj porty i suwak złota; wojskowe — wczesną armię i podbój miast-państw w klastrze.` jest **identyczna we wszystkich 9** wpisach, w polach `wikiM` i `full`: 18 wystąpień, 1 unikalna treść.
- Odtworzenie: `git show edb8fb56:gra/src/data/wikiBundle.json | python3 -c "import sys,re,hashlib; ms=re.findall(r'\*\*Strategia dla gracza:\*\*[^\\\\\"]*', sys.stdin.read()); print(len(ms), len(set(ms)), set(hashlib.md5(m.encode()).hexdigest()[:6] for m in ms))"` → `18 1 {'a7931a'}` (poprzednio podany hash `a1624a` był nieodtwarzalny i jest korektą).
- Nie sprawdzano profilu agresji (audyt: Zulusi 9/9 vs Sumerowie 3/9) — poza zakresem tego punktu.
- Wniosek: NADAL ISTNIEJE.

## Ograniczenia

- Dane wiki pochodzą z `gra/src/data/wikiBundle.json` na pinie edb8fb56, nie z generatora ani z working tree.
- Nie zmieniano `P1-16-EDGE-CASES.md` (poza allowlistą tematu).
- Nie wykonano builda ani uruchomienia gry.
