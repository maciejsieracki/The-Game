# 01-operator-recon.md — P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1

STATUS: PASS-WITH-NOTES

TEMAT: P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1

GOAL: Czysty recon (zero implementacji) — ustalić, czy żywy kod
`gra/src/ui/techDiscoveryNotice.ts` (wdrożony w FALI 300 / `R-TRZY-KARTY-WDROZENIE-Q1`,
2026-08-20, PRZED zamknięciem tego recon) nadepnął na rozbieżności źródeł opisane
w §4 notatki `docs/decyzje/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1.md` (12 vs 20
jednostek Brązownictwa; status „Popalnia brązu"), zgodnie z ECHO=A właściciela
(Maciej, 2026-08-21) zapisanym w tej notatce.

## ZMIANY/COMMIT (ZERO KODU)

Zero zmian w `gra/src` i `gra/data`. Jedyna zmiana repo: fast-forward worktree
`git merge --ff-only d9b75cc` (KROK 0 dyspozycji — obiekty gita współdzielone,
bez konfliktu), plus ten raport. Tymczasowy skrypt analityczny NIE w `gra/`:
`/tmp/claude-0/.../scratchpad/check-improvements.js` (poza repo, nie do commitu —
treść i wynik odtworzone poniżej w tym raporcie, więc nie jest potrzebny jako dowód).

## TESTY

Recon, nie implementacja — brak testów automatycznych. Zamiast tego: czytanie
kodu źródło-po-źródle + jeden jednorazowy skrypt Node uruchomiony lokalnie
(nie commitowany do `gra/`) porównujący `gra/data/tech.json` vs
`gra/data/terrain-improvements.json` programowo. Wyniki poniżej.

---

## Krok 1 — co DOKŁADNIE czyta `buildBody()` w `techDiscoveryNotice.ts`

**Sekcja „Jednostki" (linia 319):**

```ts
const units = (unitsData as UnitRow[]).filter(u => u.Tech === tech.Technologia);
```

Kod filtruje **wyłącznie `units.json`** po polu `Tech === tech.Technologia`.
NIE czyta żadnej listy nazw jednostek z `tech.json` (pole „Odblokowuje budynek"
zawierające tekst „Jednostki: ..." jest całkowicie ignorowane przez tę sekcję —
używane tylko w komentarzu deweloperskim w tym samym stringu, nie parsowane).

**Sekcja „Ulepszenia terenu" (linia 322 + 367-370):**

```ts
const improvementNames = list(tech['Odblokowuje ulepszenie terenu']);
...
const improvementsBody = improvementNames.map(name => unlockItemRow({
  icon: improvementIconSvg(name),
  title: name,
})).join('');
```

Kod pokazuje nazwę **wprost z `tech.json`**, BEZ JAKIEGOKOLWIEK sprawdzenia
istnienia w `terrain-improvements.json`. Brak filtra, brak walidacji, brak
try/catch na "nie znaleziono" — nazwa trafia do tytułu karty jako pewnik.

## Krok 2 — czy „Popalnia brązu" faktycznie wyświetla się jako tytuł karty; co robi `improvementIconSvg()`

Potwierdzone programowo (`gra/data/tech.json`, wpis Brązownictwo):
`"Odblokowuje ulepszenie terenu": "Popalnia brązu"`. Po `list()` (split na
`[;,+]`, brak takich znaków w tym stringu) → `improvementNames = ["Popalnia brązu"]`.
Sekcja „Ulepszenia terenu" ma więc `count: 1`, `openDefault: false` (domyślnie
zwinięta, ale realnie ISTNIEJE i pokazuje po rozwinięciu tytuł „Popalnia brązu").

`improvementIconSvg()` (`gra/src/ui/icons/brandAssets.ts:100-103`):

```ts
export function improvementIconSvg(key: string, size: BrandIconSize = 24): string {
  const impId = improvementMap.map[key] ?? improvementMap.map._default ?? 'imp-farm';
  return normalizeSvg(findSvgRaw(`improvements/${impId}.svg`), size);
}
```

Brak dopasowania → **cichy fallback do `_default: "imp-farm"`** (ikona farmy).
Żadnego błędu, żadnej pustej ikony — SVG renderuje się poprawnie, ale przedstawia
zupełnie inny, nietrafiony obiekt (farmę zamiast czegokolwiek związanego z
metalurgią/kopalnią). To dokładnie mechanizm, przed którym ostrzegała notatka:
rozbieżność źródeł przecieka do gracza jako fałszywa informacja — w tym wypadku
nie jako "dziwna infografika" czy pusta ikona, lecz jako **wiarygodnie wyglądająca,
ale fałszywa karta unlocku z błędną ikoną**.

**Odkrycie dodatkowe (szersze niż zakres notatki):** `improvementMap.map` w
`gra/src/ui/icons/brand/improvement-icon-map.json` jest kluczowany po
wewnętrznych identyfikatorach snake_case bez diakrytyków (`"kopalnia_miedzi"`,
`"farma"`, `"fort"`...), a `techDiscoveryNotice.ts` przekazuje **czytelną dla
człowieka nazwę polską z `tech.json`** (`"Kopalnia miedzi"`, `"Popalnia brązu"`,
`"Farma"`...). Sprawdzone programowo: **żadna z testowanych nazw — łącznie z
poprawnymi, istniejącymi ulepszeniami jak „Farma" czy „Kamieniołom" — nie trafia
w klucz mapy.** Wynik: **KAŻDA ikona ulepszenia terenu w tej karcie pokazuje tę
samą domyślną ikonę farmy**, niezależnie od tego, czy dane ulepszenie istnieje
naprawdę, czy jest widmem. To osobny, systemowy bug (zła para klucz/format), nie
tylko dotyczący Brązownictwa — dotyczy WSZYSTKICH kart z sekcją „Ulepszenia
terenu" (potencjalnie ok. 13 technologii, patrz Krok 3). Poprawny wzorzec użycia
istnieje już w kodzie: `gra/src/ui/buildModeHud.ts:127-129` (`impIconHtml`)
wywołuje `improvementIconSvg(key)` z `ImprovementKey` (wewnętrzny identyfikator),
nie z etykietą wyświetlaną graczowi.

## Krok 3 — systemowa skala rozbieżności (wszystkie technologie z niepustym polem)

Skrypt porównał każdą nazwę z `tech.json['Odblokowuje ulepszenie terenu']`
(po rozbiciu na `[;,+]`) z polem `nazwa` każdego wpisu `terrain-improvements.json`.

**20 nazw-instancji w ok. 13 technologiach z niepustym polem.**

**16 spójnych** (nazwa z `tech.json` ma dokładne dopasowanie w `terrain-improvements.json.*.nazwa`):
Obróbka drewna→Tartak, Obróbka drewna→Posterunek (Strażnica), Garncarstwo→Glinianka,
Garncarstwo→Warzelnia soli, Murarstwo→Kamieniołom, Murarstwo→Posterunek (Strażnica),
Rolnictwo→Farma, Rolnictwo→Tarasy uprawne, Łowiectwo→Obóz łowiecki,
Oswojenie zwierząt→Owce, Oswojenie zwierząt→Lama, Gospodarka wodna→Irygacja,
Koło→Droga, Żegluga→Łodzie rybackie, Waluta→Kopalnia złota, Drogi brukowane→Droga brukowana.

**4 rozbieżne**, z dwoma różnymi podkategoriami wagi:

- **Prawdziwe „widma" (brak jakiegokolwiek odpowiadającego rekordu, ta sama
  kategoria co Brązownictwo):**
  - **Brązownictwo → „Popalnia brązu"** — brak dopasowania po `nazwa` I brak
    dopasowania po `tech` z tą nazwą; jedyne dwa realne wpisy z `tech:
    "Brązownictwo"` to Kopalnia miedzi i Kopalnia cyny (zupełnie inne nazwy,
    nie warianty/rename Popalni). Dokładnie przypadek z notatki.
  - **Murarstwo → „Kopalnia"** — generyczna nazwa bez odpowiednika; realne
    ulepszenie Murarstwa to Kamieniołom (już osobno poprawnie wymienione w tym
    samym polu). „Kopalnia" wygląda na zalegający/błędny wpis bez pokrycia w
    `terrain-improvements.json`.
- **Dryf nazwy, ale rekord realnie istnieje (mniejsza waga — dane są, etykieta
  w `tech.json` jest nieaktualna):**
  - **Oswojenie zwierząt → „Bydło"** — rekord o kluczu `bydlo` istnieje z
    `tech: "Oswojenie zwierząt"`, ale jego pole `nazwa` to dziś **„Trzoda"**
    (zmienione niezależnie od `tech.json`, który nie został zaktualizowany).
  - **Wojskowość → „Fort / umocnienia"** — rekord `fort` istnieje z
    `tech: "Wojskowość"`, `nazwa: "Fort"`; `tech.json` dopisuje kosmetyczny
    dopisek „/ umocnienia", którego `terrain-improvements.json` nie ma.

**Dodatkowa obserwacja poza zakresem pytania (kierunek odwrotny, do wiadomości):**
`Hutnictwo żelaza` ma `"Odblokowuje ulepszenie terenu": null` w `tech.json`, mimo
że `terrain-improvements.json` ma realny wpis `kopalnia_zelaza` z `tech:
"Hutnictwo żelaza"`. Tu problem jest odwrotny: `tech.json` NIE deklaruje
istniejącego ulepszenia (więc karta tej technologii nie pokaże sekcji wcale —
brak fałszywej informacji, ale brak też prawdziwej). Nie liczone do 20
instancji powyżej (pole puste), zgłaszane tylko informacyjnie.

**Wniosek kroku 3:** Brązownictwo/„Popalnia brązu" NIE jest odosobnionym
przypadkiem — to systemowa rozbieżność dotykająca **4 z ok. 20 zadeklarowanych
instancji (20%)**, z czego **2 to prawdziwe widma** (Brązownictwo, Murarstwo) i
**2 to dryf nazwy przy istniejących danych** (Oswojenie zwierząt, Wojskowość).
Do tego DOCHODZI osobny, szerszy, zawsze-aktywny bug ikon (Krok 2) dotykający
wszystkich ~13 technologii z tą sekcją, niezależnie od spójności nazwy.

## Krok 4 — czy problem 12 vs 20 jednostek dotyczy żywego kodu

**Nie dotyczy.** Potwierdzone w Kroku 1 i programowo: `techDiscoveryNotice.ts`
czyta jednostki WYŁĄCZNIE z `units.json` przez filtr `u.Tech ===
tech.Technologia` — dla Brązownictwa daje to dokładnie **20 rekordów**,
identycznych z listą 20 z notatki (Włócznik, Wojownik z mieczem i tarczą, Impi,
Wojownik z toporem, Wojownik z khopesh, Włócznik sumeryjski, Wojownik mykeński,
Wojownik Sherden, Halabardnik Shang, Taran okuty, Wieża oblężnicza, Wojownik
tyrreński, Wojownik szekelesz, Strażnik bram Harappy, Piechota induska, Piechota
hetycka, Gwardia Ishtar, Wojownik babiloński, Wojownik fenicki, Gwardzista z
champi). Lista 12 nazw zapisana w `tech.json` (`"Odblokowuje budynek"`, tekst
„Jednostki: ...") jest przez tę funkcję całkowicie pomijana — nie jest parsowana,
nie wpływa na renderowaną kartę. Kod korzysta z jedynego, spójnego źródła
(`units.json`) — rozbieżność 12 vs 20 z notatki jest więc **nieaktualna dla
żywego kodu karty odkrycia** (choć nadal opisuje realną niespójność WEWNĄTRZ
`tech.json` samego w sobie — pole tekstowe nie zgadza się z `units.json` — co
może mylić kogoś czytającego wyłącznie `tech.json`, ale nie ma wpływu na to, co
widzi gracz w tej karcie).

## BLOKADY

Brak blokad wykonania recon. Do rozstrzygnięcia (nie blokują tego raportu, ale
blokują DALSZE wdrożenie zgodnie z ECHO=A):

1. Czy „Popalnia brązu" i „Kopalnia" (Murarstwo) mają zniknąć z `tech.json` (bo
   nie mają pokrycia), czy dostać nowe wpisy w `terrain-improvements.json`.
2. Czy „Bydło"→„Trzoda" i „Fort / umocnienia"→„Fort" mają być zsynchronizowane
   tekstowo w `tech.json` (proste poprawki nazw, dane już istnieją).
3. Jak naprawić dopasowanie klucz/ikona w `improvementIconSvg()` — dziś karta
   NIGDY nie trafia w prawdziwą ikonę ulepszenia terenu, bo przekazuje etykietę
   gracza zamiast wewnętrznego `ImprovementKey` (wzorzec poprawnego użycia już
   istnieje w `buildModeHud.ts`). To wymaga albo mapy nazwa→ImprovementKey, albo
   przekazania klucza wewnętrznego zamiast etykiety w `techDiscoveryNotice.ts`.

## NASTĘPNY KROK

**(b) Realny bug w żywym kodzie — potrzebny osobny dispatch naprawczy.** Nie
jest to "niedotyczące" — recon wykazał DWA osobne, potwierdzone bugi, oba
aktywne dziś w `main` (FALA 300):

- **Bug A (widmowe nazwy ulepszeń, konkretne, wąskie):** karta pokazuje
  nieistniejące ulepszenie terenu jako realny tytuł dla **2 technologii**:
  **Brązownictwo** („Popalnia brązu") i **Murarstwo** („Kopalnia"). Dodatkowo
  **2 technologie** mają nieaktualną etykietę przy istniejących danych:
  **Oswojenie zwierząt** („Bydło" zamiast „Trzoda") i **Wojskowość** („Fort /
  umocnienia" zamiast „Fort"). Naprawa: zsynchronizować `tech.json` z
  `terrain-improvements.json` (usunąć/dodać/przemianować pole „Odblokowuje
  ulepszenie terenu"), NIE zmieniać logiki `techDiscoveryNotice.ts`.
- **Bug B (zła ikona dla WSZYSTKICH ulepszeń terenu, szerokie, systemowe):**
  `improvementIconSvg()` w `techDiscoveryNotice.ts` (linia 368) dostaje etykietę
  czytelną dla gracza zamiast `ImprovementKey`, więc KAŻDA ikona w sekcji
  „Ulepszenia terenu" pokazuje domyślną ikonę farmy — dotyczy ok. 13
  technologii z niepustym polem, nie tylko rozbieżnych. Naprawa: w
  `techDiscoveryNotice.ts` zmapować nazwę na `ImprovementKey` (potrzebna
  albo nowa mapa nazwa→klucz, albo zmiana źródła danych sekcji na iterację po
  `terrain-improvements.json` filtrowanym po `tech`, analogicznie do sekcji
  budynków/jednostek).

Rekomendowany dispatch naprawczy: nowy temat (np.
`R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`) z allowlistą ograniczoną do:
`gra/data/tech.json` (pola „Odblokowuje ulepszenie terenu" dla 4 wskazanych
technologii) + `gra/src/ui/techDiscoveryNotice.ts` (dopasowanie ikony, Bug B) —
bez ruszania `gra/data/terrain-improvements.json` (jest źródłem poprawnym,
zgodnie z B1-tech-MACIEJ-2026-06-29.md), zgodnie z pełnym obiegiem AutoBot
(Operator → Evaluator → Final Control → integracja orkiestratora).

## DEPLOY/PUSH: NIE WYKONANO
