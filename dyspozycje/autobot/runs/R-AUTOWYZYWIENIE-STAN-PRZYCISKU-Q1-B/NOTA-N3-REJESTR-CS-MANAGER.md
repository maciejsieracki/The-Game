# NOTA N3 — wpis GOTOWY DO PRZENIESIENIA do `dyspozycje/REJESTR-PROSB-I-ZADAN.md`

Powstała w Obronie rundy 1 tematu `R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B` (zarzut 3
Evaluatora). **Nie wpisuję jej sam do rejestru** — `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
nie jest w allowliście `00-dispatch.md` (allowlista dopuszcza wyłącznie pliki UI
przełącznika, ich arkusz, nową bramkę i katalog runu). §14 wymaga wpisu do rejestru;
zakaz poszerzania allowlisty w biegu wymaga, żeby zrobił to orkiestrator. Poniższy blok
jest do skopiowania bez zmian.

---

**ID:** `R-ZARZADCA-AUTOMATYCZNY-STAN-PRZYCISKU-Q1`
**STATUS:** OTWARTE
**DOMAIN:** GAME · temat WIZUALNY (§9 poz. 6b — wymaga zrzutów z żywego Chromium)
**`[related_to]`** `R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B` (C-057)

**Zgłoszenie źródłowe (właściciel, ta sama wiadomość co temat wyżywienia):** „Inne przyciski:
po prostu ten przycisk się świeci, gdy jest aktywny, a gdy jest odznaczony, jest nieaktywny."

**Defekt.** Przycisk `cs-manager` „Zarządca automatyczny" w NAGŁÓWKU panelu miasta
(`gra/src/ui/cityPanel.ts:9871`) jest **trwałym przełącznikiem stanu**, nie akcją: stan czyta
`cfg.isAutoManageEnabled?.(city.id)` (`cityPanel.ts:11493-11501`), źródło
`main.ts:6598 autoManageCities`. Ma dokładnie tę samą wadę, którą naprawia
`R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B`: **WŁ dostaje `.active`, WYŁ wraca do gołego `.hbtn`** —
czyli wygląda identycznie jak zwykły, w pełni klikalny przycisk. Brakuje drugiej strony pary.

**Dlaczego pilne.** Po wdrożeniu tematu wyżywienia właściciel zobaczy w tym samym panelu dwie
różne konwencje obok siebie: poprawną w treści zakładki i wadliwą w nagłówku.

**Dlaczego NIE naprawiono w temacie wyżywienia.** C-025 — zakres = tylko zgłoszony błąd; GOAL
dispatchu mówi wprost o „przełączniku wyżywienia". `cs-manager` nie ma z wyżywieniem nic
wspólnego, więc naprawa tutaj byłaby „przy okazji".

**Szacowany koszt.** Bardzo mały. Reguła CSS `.civ-cs .hbtn.off` (+`:hover`) **już istnieje**
w arkuszu po tym temacie — wystarczy w gałęzi `else` (`cityPanel.ts:11498-11500`) dodać
`manager.classList.add('off')` / `data-stan`, symetrycznie do `classList.remove('active')`,
plus asercja różnicy stanów w bramce (wzór gotowy: bloki (C2)/(D)/(E) w
`gra/tools/autowyzywienie-stan-przycisku-test.cjs`).

**Sąsiedni przycisk SPRAWDZONY, poza zakresem.** `cs-artview` („Widok artystyczny",
`cityPanel.ts:9872`, wpięcie `cityPanel.ts:11504`) woła tylko `cfg.onArtView?.(city.id)` — nie
czyta żadnego stanu, więc jest jednorazową akcją i tej wady NIE ma.
