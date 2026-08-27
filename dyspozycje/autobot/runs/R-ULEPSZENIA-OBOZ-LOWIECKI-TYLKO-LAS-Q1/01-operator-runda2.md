# 01 — OPERATOR (runda 2)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las (gracz, automat, AI). Runda 2 domyka P7 —
wyrąb lasu spod obozu; ECHO właściciela 2026-08-27 wariant A: obóz znika, praca NIE wraca,
tartak NIE znika.
MODEL+EFFORT: Opus 5, effort **high**
RUNDY: 2/5
WORKTREE: /home/user/wt-op3-lowiecki, gałąź `autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`
(baza 4fc004b3 = HEAD po Final Control rundy 1)
DEPLOY-PUSH: NIE WYKONANO

## 1. Poprawka — dokładnie jedna

`gra/src/map/improvement-build.ts`, `stripImprovementsWhenForestRemoved`. Było pustym
przelotem (`return [...layers]`) mimo docstringa. Teraz filtruje po jawnym zbiorze:

```ts
const FOREST_DEPENDENT_IMPROVEMENT_KEYS = new Set<string>(['oboz_lowiecki']);
export function stripImprovementsWhenForestRemoved(layers: readonly string[]): string[] {
  return layers.filter(key => !FOREST_DEPENDENT_IMPROVEMENT_KEYS.has(key));
}
```

Zbiór, nie `if`, z komentarzem wypisującym **świadomie wykluczone** klucze — kolejny leśny
wpis dopisuje się w jednym miejscu, a wykluczenia nie giną przy następnej edycji.

`gra/src/main.ts` **NIETKNIĘTY** — hooki `:11892` (gracz, `finalizeHexClearing`) i `:28904`
(AI) już wołały tę funkcję. Potwierdzone diffem, nie deklaracją (§3 niżej).

`gra/data/terrain-improvements.json` — dopisane jedno zdanie do pola `warunek` wpisu
`oboz_lowiecki` (wariant A, praca nie wraca, tartak zostaje). Nic więcej w tym pliku.

## 2. Czy INNE ulepszenia zależą od nakładki Las — odpowiedź z dowodem

Inwentaryzacja: wszystkie 13 wystąpień `Nakladka.Las` w `improvement-build.ts` + `qualifies()`
klucz po kluczu. Ulepszenia, dla których Las jest warunkiem budowy, to **dokładnie cztery**:

| klucz | zależność od Las | decyzja | uzasadnienie |
|---|---|---|---|
| `oboz_lowiecki` | konieczna i wystarczająca (`:808`) | **USUWANY** | ECHO wariant A |
| `tartak` | konieczna (`:798`, `TARTAK_TERENY`) | **ZOSTAJE** | kanon wprost w docstringu; istniejąca asercja `tools/map-improvement-qualify-test.cjs:221` „tartak stays when forest removed (kanon)" |
| `farma` | **warunkowa** — tylko na Wzgórzach (`isFarmBaseTerrain :177`) | **ZOSTAJE** | zmierzone: `isFarmBaseTerrain(Wzgorza,Las)=true`, `(Wzgorza,Brak)=false`, `(Rownina/Laka,Brak)=true`. Czyli farma na wzgórzu po wyrębie faktycznie przestaje kwalifikować — ale kasowanie cudzej farmy to **osobna decyzja właściciela** (kryt. 6 rundy 1: „migracja kasująca cudze ulepszenia"), a kanon już ją trzyma tą samą asercją co tartak. Zgłaszam jako **osobne znalezisko do rejestru**, nie naprawiam w tym temacie. |
| `wyrab` | konieczna (`:793`) | n/d | akcja, nigdy trwała warstwa heksa |

`glinianka` (czwarty klucz z `FOREST_COEXIST_IMPROVEMENT_KEYS`) **nie** zależy od Las —
jej warunkiem jest `hexHasClayDeposit(hex)`. Reszta ulepszeń albo jest na lesie zabroniona,
albo Las jej nie dotyczy. **Poza P7 nic więcej nie znika — powiedziane wprost, z dowodem.**

## 3. Zakres / allowlista

`git diff --stat 4fc004b3..HEAD`: `01-operator-runda2.md` · `gra/data/terrain-improvements.json`
(1 linia, pole `warunek`) · `gra/src/map/improvement-build.ts` (+25/-1) ·
`gra/tools/oboz-lowiecki-las-test.cjs` (+197). **Wszystko w allowliście rundy 2.**
`main.ts`, `ai.ts`, `auto-improvements.ts`, `hexContextTooltip.ts`, `WERSJE.md`,
`gra-robocza/**` — NIETKNIĘTE. Zero kolizji z `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
i `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`. `git diff --check` czysty.

## 4. DOWÓD = POMIAR, nie odczyt kodu (reguła anty-halucynacyjna a/b/c)

Nowa sekcja `(8) P7` w bramce tematu, +20 asercji. Heksy pochodzą z `generateMap`
(nie z ręki), sekwencja wyrębu **przepisana 1:1 z main.ts**, a odczytywane są warstwy heksa:
`placedImprovements` **oraz** pola `hex.ulepszenia`/`hex.improvementKey`/`hex.ulepszenie`
(to one jadą do zapisu i renderu).

**Ścieżka gracza i ścieżka AI mają OSOBNE transkrypcje** — `wyrabAI()` celowo NIE woła
`wyrabGracza()`, więc asercja AI nie jest wnioskiem z asercji gracza (reguła b).

| asercja | mapa/heks | wynik |
|---|---|---|
| P7-A1/A2 istotność: obóz legalny + wyrąb dostępny przed cięciem | seed 42, `11,17` las na wzgórzu | OK |
| **P7-A4/A5 GRACZ: po wyrębie obóz ZNIKA** (`placed=null`, `hex.ulepszenia=null`) | seed 42 | **OK** |
| P7-A6 na heksie po wyrębie nowego obozu nie postawisz | seed 42 | OK |
| **P7-B3/B4 AI: po wyrębie obóz ZNIKA** (main.ts:28903-28904) | seed 1337, `10,17` | **OK** |
| **P7-C2/C3 TARTAK NIE ZNIKA** (`placed=["tartak"]`) | seed 2026, `10,18` | **OK** |
| P7-D1 heks mieszany `[tartak,oboz,droga]` → `[tartak,droga]` | seed 7 | OK |
| P7-E1/E2/E3 farma/glinianka/droga/fort/kamieniolom/irygacja ZOSTAJĄ | — | OK |

## 5. Mutacje — asercje faktycznie czerwienieją (reguła d)

**M-R2-1 — cofnięcie poprawki** (`return [...layers]`, stan rundy 1):
bramka tematu **86 pass / 5 FAIL** — czerwienieją P7-A4, P7-A5, **P7-B3, P7-B4** (ścieżka AI
niezależnie od gracza) i P7-D1. Zwracane warstwy: `["oboz_lowiecki"]`.

**M-R2-2 — filtr za szeroki** (`['oboz_lowiecki','tartak','farma']`):
bramka tematu **86 pass / 5 FAIL** — czerwienieją P7-C2, P7-C3, P7-D1, P7-E1, P7-E2.
Dodatkowo pęka kanon: `map-improvement-qualify-test` **111 pass / 1 fail**
(„tartak stays when forest removed"). Asercja tartaka **nie jest tautologią**.

Obie mutacje cofnięte, drzewo czyste (`git status --porcelain` puste przed bramkami).

## 6. Bramki — wszystkie MOJĄ ręką, po cofnięciu mutacji

| bramka | runda 1 | **runda 2** |
|---|---|---|
| `tsc --noEmit` | 0 | **0** |
| `logic-test` | 213/213 | **213/213** |
| `tech-tree-test` | 19/0 | **19/0** |
| `research-test` | 33/33 | **33/33** |
| `unit-replace-test` | 13/13 | **13/13** |
| `combat-test` | 6/6 | **6/6** |
| `auto-improvements-test` | 45/0 | **45/0** |
| `map-improvement-qualify-test` (kanon) | 112/0 | **112/0** |
| **bramka tematu** `oboz-lowiecki-las-test` | 71/0 | **91 pass / 0 fail** (≥71 ✔) |
| **sonda Evaluatora** `oboz-lowiecki-evaluator-probe` | 87/**1** | **88 pass / 0 fail** ✔ |
| **sonda FC** `oboz-lowiecki-fc-balans` | 4/**1** | **5 pass / 0 fail** ✔ |
| build (C-001, `--outDir /tmp/civ-dist-operator-r2`) | — | ✓ built in 31.71s |

Sonda FC, sekwencja wyrębu na 200 heksach z lasem: „obóz ZOSTAŁ poza lasem na: **0**"
(runda 1: 200/200). Oba znaleziska Evaluatora i Final Control są zamknięte.

Pomiar AI 40 tur (informacyjnie, 3 ziarna): `oboz_lowiecki=99 pastwiska=56` — **identycznie**
jak w rundzie 1 przed i po. Poprawka nie rusza zachowania AI, zgodnie z oczekiwaniem
(dotyczy wyrębu, nie wyboru ulepszenia). Skarga „zamiast owcy buduje obóz" nadal
nierozwiązana tym tematem — wagi AI, osobny temat.

## 7. Znaleziska do rejestru (poza allowlistą, NIE naprawiane tutaj)

1. **Farma na Wzgórzu po wyrębie lasu.** `isFarmBaseTerrain(Wzgorza, Brak) = false`, ale farma
   zostaje na heksie — stan „istnieje, choć nie da się jej tam postawić". Ten sam wzorzec co
   P7, inny klucz i **inna decyzja właściciela** (kasowanie farmy ≠ kasowanie obozu).
   Wymaga pytania ABC, nie decyzji Operatora.
2. **Wagi AI** (obóz vs pastwisko) — potwierdzone trzecim pomiarem, osobny temat.
3. `createQualifier` w izolacji: **BRAK DOWODU** (stan z rundy 1, niezmieniony) — gate commitu
   `computeImprovementBuildImpact` maskuje gate panelu. Obrona w głąb, nie luka.

## 8. Raport terminalny

ZMIANY/COMMIT: `61cb7d01` (szkielet) · `fabd40d0` (poprawka + `warunek`) · `86f8021a`
(bramka tematu +20 asercji P7) · niniejszy commit raportu. Gałąź
`autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`, wypchnięta na `origin` po każdym kroku.
TESTY: §6 — komplet zielony; bramka tematu 91/0, sonda Evaluatora 88/0, sonda FC 5/0.
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: Evaluator, runda 2.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie na gałąź tematu; brak integracji, brak `main`).
