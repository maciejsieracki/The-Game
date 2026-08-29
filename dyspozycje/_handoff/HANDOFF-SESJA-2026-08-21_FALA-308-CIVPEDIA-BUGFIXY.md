# HANDOFF SESJI — 2026-08-21 · FALA 306→309 · korekta rejestru + krytyczny regres karty CivPedia + T4 (migracja + runda 2)

**Dla następnego agenta (dowolna sesja — lokalna, chmurowa).**
**Czytaj najpierw ten plik**, potem `dyspozycje/PYTANIA-OTWARTE.md` (indeks operacyjny na
górze) · `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (indeks bieżący na górze) · `dyspozycje/WERSJE.md`
(FALA 309 na górze sekcji ROBOCZA).

**Aktualizacja (ta sama sesja, po pierwotnym zapisie tego pliku):** T4 runda 2 (§2f) dostała
PASS od Evaluatora i Final Control (niezależnie, 197/197 testów, mutation-test potwierdzony,
`git merge-tree` bez konfliktów) i została zmergowana do `main` + zdeployowana jako **FALA 309**.
Sekcja „Do zrobienia natychmiast" w §5 poniżej jest już NIEAKTUALNA co do tego punktu — patrz
§1 i §2f dla aktualnego stanu.

**Cel tego dokumentu:** konsolidacja tego, co w tej sesji ZNALEZIONE i NAPRAWIONE, żeby żaden
kolejny agent nie odkrywał tego od nowa ani nie dispatchował ponownie tematów już zamkniętych.
Rejestr i PYTANIA-OTWARTE.md mają pełny, szczegółowy dowód per temat — ten plik jest ich
skróconym, chronologicznym lustrem.

---

## 1. Stan gry (ROBOCZA)

| Pole | Wartość |
|---|---|
| **AKTUALNA FALA** | **309** |
| **md5** | `809a36e9c554fd0bfa58d63a4b155e8f` (stempel `809a36e9`) |
| **Commit deploy** | `ed6dc9f2` na `main` |
| **Poprzednia fala** | FALA 308 `e4317354` — **ZASTĄPIONA** (→ 809a36e9, FALA 309, samo T4 poniżej); FALA 307 `6c1433ef` — **ZASTĄPIONA/WYCOFANA** wcześniej (patrz §3, regres krytyczny) |
| **Branch pracy** | `main` bezpośrednio — ta sesja integruje każdy zweryfikowany temat wprost do `main` i pushuje, bez osobnych branchy integracyjnych |

---

## 2. Co ZROBIONE w tej sesji (chronologicznie)

### 2a. Korekta 3 wpisów rejestru fałszywie oznaczonych jako otwarte/w toku

Właściciel zażądał explicite: przed dispatchem jakiejkolwiek nowej pracy sprawdzić, czy 4
wskazane, pozornie zaległe tematy nie są już zaimplementowane/zdeployowane przez innych agentów.
Weryfikacja kodem+testami+`WERSJE.md` (nie zgadywanie) pokazała, że **3 z 4 są już gotowe**:

| ID | Stary (fałszywy) status | Rzeczywisty stan, zweryfikowany | Dowód |
|---|---|---|---|
| `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` | „gotowy do dispatchu" | **ZDEPLOYOWANE FALA 298** (`4322f5aa`) | `gra/src/game/forced-war-stone.ts`, `forced-war-stone-test.cjs` 32/32 + guard 18/18, dziś ponownie zielone |
| `P-PRACA-BUDYNKI-ULEPSZENIA-SPLIT-50-Q1` | „osobna gałąź, bez merge" (z 2026-08-17) | **DUPLIKAT/ZASTĄPIONY** — ten sam kontrakt wdrożony 2× pod innymi ID (`P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1` FALA 293, `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` FALA 302), dalsza praca idzie przez `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` (aktywny temat tej sesji, patrz §5) | `splitEmpirePracaBudget()` w `gra/src/game/production.ts:1898` |
| `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1` | „implementacja w toku" | **ZDEPLOYOWANE**, zgodne z NAJNOWSZYM ECHO (1B/2A/3B/8B/9A/10B) | `diplomacy-barbarian-cooperation-test.cjs` 10/10 |
| `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` | 4 otwarte pytania w §4 | **3 z 4 zamknięte** (rozwiązane przy okazji `R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`/T3); pytanie 1 (12 vs 20 jednostek) to **realny, dziś działający bug** — wydzielony jako nowy temat `R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` | patrz §2b |

**Wniosek dla przyszłych sesji:** nie ufaj samej etykiecie statusu w rejestrze bez daty korekty
— sprawdź kod, testy i `WERSJE.md` zanim zaczniesz nowy dispatch na pozornie otwarty temat.

### 2b. `R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` — nowy temat, ZINTEGROWANY

Znalezisko Evaluatora przy reconie powyżej: `techTreeView.ts` i `sciencePicker.ts` czytały listę
jednostek odblokowywanych przez technologię z osadzonego, nieaktualnego tekstu "Jednostki: ..."
w polu `tech.json`'s „Odblokowuje budynek" (np. 12 zamiast realnych 20 dla Brązownictwa), zamiast
z `units.json`'s pola `Tech` — dokładnie ten sam problem, który `technologyAdapter.ts` T3 już
poprawnie rozwiązał. Dodatkowo `sciencePicker.ts` dzielił string wyłącznie po przecinku (nie po
średniku), myląc fragmenty listy jednostek z budynkami.

**Naprawa:** nowy współdzielony `gra/src/ui/techUnlockParse.ts` (`parseUnlockBuildings()` +
`unitsUnlockedByTech()`), używany przez oba miejsca. Operator→Evaluator→Final Control PASS,
zweryfikowane na żywym DOM. **Zintegrowane do `main`, czekało na połączenie z krytyczną naprawą
poniżej w jednym deployu (FALA 308)** — teraz już zdeployowane.

### 2c. KRYTYCZNY REGRES — `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` (najważniejsze znalezisko sesji)

Właściciel zgłosił na żywo (FALA 307, stempel `6c1433ef`): w karcie odkrycia technologii
przyciski „Rozpocznij badanie" i „Otwórz drzewo" **nie reagowały na klik nigdzie w grze** —
realny blocker uniemożliwiający rozpoczęcie badań.

- **Przyczyna:** `.entity-card` nie miało własnego `position` (domyślnie `static`), więc w
  kolejności malowania CSS stacking-context (CSS2.1 Appendix E) renderowało się PRZED
  sąsiadującym `.tdn-back` (tło, `position:fixed`, własny stacking context) — tło przechwytywało
  wszystkie kliknięcia na karcie mimo poprawnego DOM i poprawnie podłączonych listenerów.
  **jsdom dawał fałszywie zielony wynik** — `button.click()`/`dispatchEvent` w jsdom omija
  prawdziwy hit-testing (`elementFromPoint`) całkowicie.
- **Naprawa:** jedna linia — `position:relative` na `.entity-card` w
  `techDiscoveryNotice.ts::ensureEntityCardOverrideStyles()`.
- **Weryfikacja:** realną przeglądarką (Playwright/Chromium, `elementFromPoint`+
  `page.mouse.click()`), niezależnie przez Operatora, Evaluatora I Final Control (każdy pisał
  WŁASNY harness). **Test mutacyjny:** usunięcie fixu odtwarza regres (6/12 FAIL), przywrócenie
  daje 12/12 PASS — potwierdza, że nowe testy faktycznie łapią ten bug.
- **Reakcja procesowa:** natychmiastowy emergency-rollback samej paczki ROBOCZA (nie kodu w
  `main`) do FALA 306, zanim jeszcze przyczyna była znana — środek bezpieczeństwa. Po znalezieniu
  i zweryfikowaniu poprawki, redeploy skonsolidowany jako **FALA 308** razem z 3 innymi gotowymi
  poprawkami (§2b, §2d, §2e).

**Kluczowy wniosek metodologiczny tej sesji (zapisz w pamięci na przyszłość):** żaden test oparty
WYŁĄCZNIE o jsdom nie wykryje (a) kolizji stacking-context CSS (przechwytywanie kliknięć przez
element z innym `position`) ani (b) braku/nieobecności reguł CSS (padding/tło/display) —
jsdom's `getComputedStyle`/`getBoundingClientRect` nie odzwierciedlają prawdziwej geometrii
layoutu. **Playwright + prawdziwy headless Chromium jest od teraz obowiązkowym wzorcem** dla
każdego twierdzenia o zachowaniu UI/kliknięć/layoutu CSS, szczególnie dla dalszych migracji
kart CivPedia (T5-T7b, patrz §5). Fallback ścieżki binarki: `/opt/pw-browsers/chromium-1194/
chrome-linux/chrome` z `--no-sandbox`, gdy domyślny `chromium.launch()` zawodzi w środowisku.

### 2d. `R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1` — ZINTEGROWANE

Zgłoszenie właściciela (zrzuty ekranu): pasek ostrzegawczy „⚠ N kart wymaga decyzji" nachodził
na przycisk „Wykonaj" w dolnym pasku, a po wykonaniu decyzji zostawiał pusty, wyszarzony
„duch" przycisku „Wykonaj" (nakładający się problem widoczności/pozycjonowania).

**Przyczyna:** `.et-hint`/`.et-tooltip` (pasek ostrzegawczy) były dziećmi `.et-wrap` (który
owija WYŁĄCZNIE przycisk końca tury) — `position:absolute` liczyło się względem złego kontekstu
pozycjonowania i nakładało na zawsze-obecny (disabled gdy brak blokady) przycisk „Wykonaj" tuż
nad nim.

**Naprawa:** oba elementy przeniesione, żeby być bezpośrednimi dziećmi `.civ-bottom-bar`
(`position:fixed`, prawdziwy kontekst pozycjonowania), przed `.wykonaj` w markupie. Sama formuła
CSS `bottom:calc(100% + HUD_GAP_PX)` NIE zmieniona — zmienił się tylko rodzic DOM, więc teraz
liczy się od góry całego stosu przycisków zamiast tylko sub-wrappera przycisku końca tury.

Zweryfikowane realną przeglądarką (Playwright/Chromium) — zrzuty ekranu pixel-for-pixel
potwierdzają nakładanie na starym kodzie i czyste rozdzielenie po naprawie. Operator→Evaluator→
Final Control PASS, 33/33 nowy test + zero regresji.

### 2e. `R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1` — ZINTEGROWANE

Zgłoszenie właściciela: poprzedni sposób wybierania badań z listy w hubie nauki (klik wiersza =
od razu do kolejki) przestał działać po T3 — klik na technologię (np. „Łowiectwo") otwierał
kartę podglądu zamiast dodawać do kolejki, a przyciski „Rozpocznij badanie"/„Otwórz drzewo" w
tej karcie nie reagowały (to samo zjawisko co §2c, ale zgłoszone najpierw na tej ścieżce UI).

**Naprawa:** `scienceHubHud.ts::buildEntryRow()` — klik odblokowanego wiersza (`!lockedRow &&
canEnqueue`) woła teraz `config.onSelectTech(e.id)` bezpośrednio przez nową `rowActivate()`,
przywracając stare zachowanie „klik = enqueue". Klik zablokowanego wiersza nadal otwiera podgląd
(`act()`). Mała ikonka „ⓘ" zastąpiona wyraźnie podpisanym przyciskiem tekstowym `<button
class="sh-card-btn">Karta</button>` w nowym `.sh-item-side` (prawa strona wiersza), z
`stopPropagation()`, nadal wołającym `act()`. **`techTreeView.ts` świadomie NIE zmieniony** —
inny, uzasadniony model interakcji (klik węzła zawsze otwiera kartę; start badania z jej
wnętrza przez `tryStartResearch`).

Zweryfikowane realnym DOM/klikiem — 13/13 asercji. Operator→Evaluator→Final Control PASS.

### 2f. CivPedia T4 (migracja karty jednostki na mapie) — runda 2: brakujący CSS odznak

Evaluator T4 (runda 1) znalazł w żywej przeglądarce: sekcja „Statusy" karty jednostki
(`unitAdapter.ts`, `options.statusLines` z `main.ts` — flagi garnizon/ufortyfikowanie/sentry/
auto-eksploracja) renderuje wiele odznak (`section.badges`) przez `entityCards/renderer.ts`, ale
klasy `.entity-card-badges`/`.entity-card-badge` **nie miały żadnej reguły CSS w repo od T1** —
luka niewidoczna, dopóki żadna karta nie renderowała ≥2 odznak na raz (karta technologii T3 zawsze
renderowała dokładnie jedną). Odznaki sklejały się w jeden nieczytelny ciąg tekstu.

**Naprawa (orkiestrator, mały dobrze zrozumiany zakres):** dodane brakujące reguły
`.entity-card-badges{display:flex;flex-wrap:wrap;gap:6px}` +
`.entity-card-badge{padding:1px 8px;border-radius:999px;background:...}` w `renderer.ts`, wzorem
już istniejącego `.entity-card-row-badge`. Nowy permanentny test
`gra/tools/unit-info-card-badges-real-render-test.cjs` (Playwright/real Chromium, mierzy
prawdziwą geometrię DOM przez `getBoundingClientRect`/`getComputedStyle`, nie tylko obecność klas
w markupie) — **19/19 PASS** po korekcie dwóch błędów w samym teście (liczba odznak: prawidłowo
4 nie 3 — domyślna odznaka adaptera + 3 przekazane `statusLines`; geometria: właściwy test braku
nakładania prostokątów zamiast założenia jednego wiersza, bo `flex-wrap:wrap` legalnie zawija
odznaki do nowego wiersza).

Commit `54c3bb1c` na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`. **Evaluator +
Final Control PASS niezależnie** (dwóch osobnych agentów, każdy z własnym izolowanym
`git worktree`, własnym mutation-testem i własnym `git merge-tree` sprawdzeniem — zero
konfliktów). Final Control skorygował jeden drobny błąd w raporcie Evaluatora (twierdzenie o
„0 commitów różnicy" względem `main` było już nieaktualne o 1 czysto-dokumentacyjny commit —
bez wpływu na bezpieczeństwo merge'a). **Zmergowane do `main` (merge commit, `git worktree`
zbędny — merge bezpośrednio w głównym worktree, wzorem wszystkich wcześniejszych integracji tej
sesji) i zdeployowane jako FALA 309** (`ed6dc9f2`), po niezależnej re-weryfikacji orkiestratora
na scalonym stanie: `tsc` 0, 6 bramek CivPedia zielonych (197/197) + 5 bramek referencyjnych z
`R-PROC-AUTOBOT.md` §Bramki (`logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
33/33, `unit-replace-test` 13/13, `combat-test` 6/6).

---

## 3. Proces tej sesji — AutoBot jak zwykle w tym repo, plus jedna nowa dyscyplina

Operator/Evaluator/Final Control = Sonnet 5 (worktree izolowany per agent), effort medium
(Operator) / high (Evaluator, Final Control). Orkiestrator merguje bezpośrednio do `main` po
Final Control PASS, bez osobnych branchy integracyjnych tej sesji.

**Nowa dyscyplina wymuszona błędem własnym orkiestratora (patrz §4):** nigdy `git checkout
<branch-tematu>` bezpośrednio w GŁÓWNYM worktree, chyba że branch jest znany jako
at-or-ahead względem aktualnego `main`. Zawsze izolowany `git worktree add <tmp> <branch>` do
ręcznej pracy na potencjalnie nieaktualnym branchu, potem `git worktree remove`.

---

## 4. Problemy / pułapki sesji (żeby nie powtórzyć)

1. **Stacking-context CSS jako klasa błędu niewykrywalna przez jsdom** (§2c) — najważniejsza
   lekcja tej sesji, patrz wniosek metodologiczny tam.
2. **Brakujące reguły CSS też niewykrywalne przez jsdom** (§2f) — `getComputedStyle`/
   `getBoundingClientRect` w jsdom nie liczą prawdziwego layoutu.
3. **Rejestr może kłamać bez daty korekty** (§2a) — trzy tematy oznaczone jako otwarte były
   faktycznie gotowe/zdeployowane od dawna pod tym samym LUB innym ID. Zawsze zweryfikuj kodem
   przed dispatchem.
4. **Własny błąd orkiestratora: `git checkout` nieaktualnego brancha w głównym worktree.** Po
   usunięciu worktree T4 orkiestrator wykonał `git checkout autobot/R-FEATURE-KARTY-
   ENCYKLOPEDIA-CIVPEDIA-Q1` wprost w `/home/user/The-Game`, nie wiedząc, że branch odgałęził
   się sprzed krytycznej naprawy FALA 308 — po cichu cofnęło to pliki robocze do starego stanu
   (złapane przez zmianę `gra-robocza/ROBOCZA-MANIFEST.json` na dysku). Żaden commit nie
   powstał na złym branchu — czysto lokalny stan plików. Naprawione `git checkout main`.
   **Reguła na przyszłość w §3.**
5. **Orkiestrator nie certyfikuje własnego kodu.** Fix CSS z §2f został napisany bezpośrednio
   przez orkiestratora (mały, dobrze zrozumiany zakres) — mimo to przechodzi przez pełny,
   niezależny Evaluator+Final Control przed merge do `main`, dokładnie jak każdy kod Operatora.

---

## 5. Start następnej sesji (checklist)

```bash
git fetch origin main
git log --oneline -5 origin/main
git fetch origin autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1
```

1. ~~Do zrobienia natychmiast: sprawdź wynik Workflow Evaluator+Final Control dla T4 runda 2~~ —
   **ZROBIONE w tej samej sesji**: PASS obustronny, zmergowane do `main`, zdeployowane FALA 309
   (patrz §1, §2f). Nic do kontynuacji na tym konkretnym punkcie.
2. **Do zrobienia teraz:** sprawdź status `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` (Wątki C/E/F) — dispatchowany
   wcześniej tej samej sesji, worktree `.claude/worktrees/wf_f89d7fbb-50a-1` na branchu
   `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`, commit lokalny `e21bc639` — sprawdź czy
   Workflow zakończył się (notyfikacja mogła przyjść), zanim dispatchujesz cokolwiek nowego na
   ten temat.
3. Kontynuacja migracji kart CivPedia (`R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`, plan pełny w
   `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/05-architektura-plan.md`):
   T5 (karta budynku w panelu miasta, nowe tryby `inline`/`hover`) → T6 (karta jednostki w
   panelu miasta/rekrutacji — WYSOKIE RYZYKO, dwie dziś różne implementacje karty do pogodzenia)
   → T7a (recon: czy istnieje lista ulepszeń terenu w panelu miasta?) → T7b (nowa karta ulepszeń
   terenu, 3 miejsca wywołania) → T8 (kategoria technologii w CivPedii) → T9 (mostek gra-id dla
   niejednoznacznych slugów) → T10 (pełne wzajemne linkowanie). **Każda z tych migracji wymaga
   realnej weryfikacji Playwright/Chromium, nie tylko jsdom — patrz §2c/§2f.**
4. Playtest FALA 308 nie był fizycznie sprawdzany w przeglądarce przez gracza w tej sesji (tylko
   przez Playwright/Chromium w harnessach testowych) — warto potwierdzić na żywo: hub badań
   klik-wiersza=enqueue, karta odkrycia technologii przyciski działają, pasek „Wykonaj" nie
   nachodzi.

---

## 6. Kotwice plików

- `dyspozycje/PYTANIA-OTWARTE.md` — indeks operacyjny na górze pliku ma zwięzły status każdego
  tematu tej sesji z dowodem; pełna historia dużo niżej.
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — „Indeks bieżący" na górze pliku, to samo w lustrzanym
  formacie.
- `dyspozycje/WERSJE.md` — FALA 306/307(WYCOFANA)/308, sekcja „AWARIA — ROLLBACK FALA 307 → 306"
  z pełną narracją emergency-rollbacku.
- `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/` — pełny ślad T1-T4 migracji
  kart CivPedia, w tym `05-architektura-plan.md` z planem T5-T10.
