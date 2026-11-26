# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
W grze NIE ma dziś żadnej akcji wyburzania budynków (grep „wyburz|demolish” w gra/src trafia tylko mur w bitwie). Budynki: gra/data/buildings.json (poziomy do maksPoziom; koszt per poziom w danych), panel miasta: gra/src/ui/cityPanel.ts; logika budowy i stan budynków miasta w gra/src/main.ts i gra/src/game/ (MINTORPHAN: gra/src/game/mennica-orphan.ts, hook applyProductionCompleted). Odpowiedź 22C: „zwrot połowy surowców”.
## Zadanie
1. Znajdź, jak stan budynków miasta i ich koszty są trzymane (poziomy!) oraz jak zwraca się/odejmuje surowce. Zdefiniuj regułę zwrotu: połowa (zaokrąglenie w dół) SUROWCÓW z kosztu budynku — dla budynku na poziomie N suma kosztów poziomów 1..N faktycznie poniesionych (jeśli dane nie pozwalają — połowa kosztu bieżącego poziomu; opisz wybór w raporcie). Pieniądz i Praca NIE są zwracane (22C mówi o surowcach); zapisz to jawnie.
2. Czysta funkcja logiki (nowy gra/src/game/building-demolish.ts): demolishBuilding(state, cityId, buildingId) → {removed, refund}; zwrot trafia do skarbca/zapasu tam, skąd pobierany jest koszt budowy. Wyburzenie usuwa budynek (wszystkie poziomy) i jego efekty od następnej tury; nie rusza budynków w kolejce produkcji (kolejka zostaje). Mennica: zawsze wolno; po wyburzeniu Mennicy w stolicy bonus znika (resolver stolicy bez zmian).
3. Wyjątki: jeśli sensowne jest wyłączenie wyburzania dla budynków strukturalnych (centrum miasta/Ratusz, cuda, mury w trakcie oblężenia/bitwy) — NIE rozstrzygaj sam: zwróć DECISION_REQUIRED z listą takich budynków i jednym zdaniem skutku dla gry per wariant; do czasu decyzji zablokuj wyburzanie TYLKO tych budynków, które na pewno nie są zwykłymi budynkami miasta.
4. UI: przycisk „Wyburz” przy budynku w cityPanel.ts + potwierdzenie z podglądem zwrotu (ile surowców wróci); po potwierdzeniu odświeżenie panelu i HUD; hotseat — działa dla aktywnego gracza. AI NIE wyburza (zero zmian zachowania AI).
5. Zapis/wczytanie: brak nowego stanu (budynek po prostu nie istnieje); zapis przed zmianą bit-w-bit bez zmian.
6. Testy: logika (czysta funkcja: zwrot 50%, poziomy, Mennica, budynek nieistniejący, zapas surowców zwiększony), źródłowy test okablowania UI→logika, mutacja czerwona (zwrot 100%/0, brak usunięcia budynku); Mennica: wyburz → bonus znika → odtwórz stolicę.
## Allowlista
gra/src/game/building-demolish.ts (nowy), gra/src/main.ts (tylko okablowanie akcji), gra/src/ui/cityPanel.ts (+ ewentualnie pliki UI wskazane przez grep), nowe testy gra/tools/building-demolish-*-test.cjs, dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/**, docs/obieg/ (jedna sekcja opisu akcji jeśli istnieje dokument budynków).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana balansu kosztów budynków, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela (DECISION_REQUIRED).
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; mint-capital-only-test; mint-orphan-test; testy tematu z mutacją czerwoną. Zacommituj i zwróć SHA. Live w przeglądarce (zrzut panelu z przyciskiem i potwierdzeniem) jeśli Chromium stabilny; w przeciwnym razie NIE ZMIERZONO z wypisaniem.
## Binarne kryterium
Wyburzenie działa na wszystkich zwykłych budynkach, zwraca 50% surowców, Mennica wg reguł właściciela, AI bez zmian, testy z mutacją czerwoną, bramki zielone.

---
# DODATEK RUNDA 2 (Operator HAIKU 5.5) — WERYFIKACJA NA ŻYWO przed deployem (granica §9 pkt 6a)
BAZA: args.cand = b8d28d17fad563e90003370e743dc1f958cc6293 (FC tip r1; kod 3a00fd6ca43e0cb0c61693ed8e3740009b90f699; refs/keep/WYBURZ-fc).
## Powód
FC r1: PASS-WITH-NOTES; blokada: brak zrzutu z żywego Chromium (panel miasta z przyciskiem „Wyburz” i potwierdzeniem) — wymagany przed deployem; NIE ZMIERZONO.
## Zadanie
1. Zbuduj grę z kandydata poza repo (node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; NIE npm run build) i uruchom w pre-zainstalowanym Chromium (/opt/pw-browsers/chromium; playwright require z node_modules; NIE instaluj Playwright; Chromium bywa niestabilny — ponów start do 3 razy; headless, --no-sandbox).
2. Przejdź: nowa gra → utwórz/otwórz miasto z budynkiem (użyj haka civTest, jeśli istnieje, do nadania budynku i surowców) → panel miasta → przycisk „Wyburz” → okno potwierdzenia z podglądem zwrotu → potwierdź → budynek znika z listy, surowce rosną o połowę kosztu (w dół). Zrzuty (deviceScaleFactor 1): panel z przyciskiem, okno potwierdzenia, panel po wyburzeniu; zapisz pod dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/zrzuty/ + odczyt liczb przed/po (surowce, lista budynków) w JSON.
3. Sprawdź Mennicę: wyburz Mennicę w stolicy → bonus Mennicy znika (odczyt z ekonomii) .
4. Jeśli znajdziesz błąd UI/logiki — popraw minimalnie z testem; kosmetykę nie ruszaj. Błąd Chromium (SIGSEGV) ≠ błąd gry — opisz.
5. Bramki ogólne uruchom po zmianie (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, building-demolish-test, mint-*).
## Decyzja właściciela o wyjątkach (Pałac/cuda/mury w oblężeniu) — JESZCZE NIE PODJĘTA; NIE blokuj niczego w kodzie, NIE rozstrzygaj.
## Allowlista/zakazy jak r1 + katalog zrzuty/. Operator Haiku; nie pytaj właściciela.

---
# DODATEK RUNDA 3 (Operator HAIKU 5.5) — ZAKAZ WYBURZANIA PODCZAS OBLĘŻENIA (odp. 28a właściciela)
BAZA: args.cand = b837c8ac393666f17b1dbc74b6adde1f39ef3589 (FC tip r2; refs/keep/WYBURZ-fc2; kod gra/ = 3a00fd6ca). r2: FC PASS-WITH-NOTES, live w Chromium wykonany (zrzuty w runs/…/zrzuty/).
## Decyzja właściciela (28a)
Wyburzanie bez wyjątków dla Pałacu, cudów i murów (nic nie jest niewyburzalne), ALE wyburzeń nie można prowadzić podczas oblężenia miasta.
## Zadanie
1. Ustal istniejące w grze pojęcie „oblężenia/oblężone miasto” (m.in. gra/src/game/ai-siege-relief.ts — odsiecz obleganego miasta AI; szukaj też stanu oblężenia w main.ts/cityPanel.ts). Zapisz definicję użytą w grze (np. armia wroga w zasięgu miasta). Jeśli gra NIE ma jednoznacznej definicji oblężenia po stronie gracza — NIE wymyślaj; zwróć DECISION_REQUIRED z jedną propozycją definicji per wariant (A wróg przy sąsiednich polach miasta; B bitwa o miasto w tej turze; C obie) i jednym zdaniem skutku dla gracza.
2. Zaimplementuj blokadę: demolishBuilding odmawia z powodem 'siege' gdy miasto jest oblężone; przycisk „Wyburz” w cityPanel.ts jest nieaktywny/ukryty z komunikatem „Nie można wyburzać podczas oblężenia”; dotyczy też Mennicy i Pałacu (żadnych wyjątków poza oblężeniem). Hotseat: sprawdzanie oblężenia dla właściciela miasta.
3. Testy: logika (oblężone → odmowa, nieoblężone → wyburzenie 50%), okablowanie UI, mutacja czerwona (brak sprawdzenia oblężenia; sprawdzenie odwrócone), regresja 36/0 istniejącego testu building-demolish.
4. Live w Chromium (jeśli stabilny): stan oblężenia (hak civTest lub ustawienie wroga przy mieście) → przycisk zablokowany + komunikat; zrzut. W razie niestabilności: NIE ZMIERZONO z opisem.
## Zasada podpisu commitów (dotyczy WSZYSTKICH ról)
NIGDY nie używaj --no-gpg-sign ani nie zmieniaj konfiguracji podpisu. Jeśli /tmp/code-sign nie istnieje lub podpis nie działa — status INFRA z opisem, bez obejścia. (W r2 operator użył --no-gpg-sign podczas awarii środowiska; tego nie powtarzać.)
## Allowlista/zakazy/bramki jak r1; Operator Haiku; nie pytaj właściciela.
