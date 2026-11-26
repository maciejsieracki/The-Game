# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand = main po FALI 916)
## Tropy
- gra/src/ui/interHumanDiplomacyHud.ts (okno dyplomacji między fotelami; użycie w main.ts), gra/src/game/diplomacy-peace-proposal-timing.ts: peaceProposalTurnsLeft(turnsAtWar), turyWojnyLabel(n) (odmiana tura/tury/tur), PEACE_PROPOSAL_MIN_WAR_TURNS=10 — GOTOWE helpery tego samego licznika dla AI (R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1); znajdź, jak okno dyplomacji z AI pokazuje „dostępne za N …” i zrób to samo dla pary człowiek↔człowiek.
- Bramka w main.ts humanPeaceRejectReason (FALA 916, peaceProposalIsTooEarly) — licznik musi używać tego samego źródła prawdy (turnsAtWar pary), nie własnej liczby.
## Zadanie
1. W interHumanDiplomacyHud.ts (lub w widoku okna dyplomacji hotseat, którego używa main.ts) pokaż przy przyciskach/opcji „Pokój”/„Rozejm”/oferta trybutu, gdy para jest w wojnie i turnsAtWar < 10: etykietę „Dostępne za N tur” (odmiana wg turyWojnyLabel) i zablokuj/wyszarz akcję spójnie z bramką; po upływie N etykieta znika. Gdy para nie jest w wojnie — bez zmian.
2. Dane: HUD wymaga turnsAtWar dla pary (jak dla AI); jeśli brak w danych HUD, dodaj w wąskim miejscu main.ts, które buduje dane okna hotseat.
3. Testy: nowy gra/tools/hotseat-peace-counter-ui-test.cjs (rdzeń: funkcja etykiety/ stanu przycisku czysta, testowana na przypadkach N=10,5,1,0, brak wojny); mutacje czerwone; istniejące hotseat-etap6d-*, hotseat-peace-protection-test, diplo-human-peace-no-war zielone. Zrzut z żywego Chromium jeśli dostępny (NIE ZMIERZONO z powodem jeśli nie).
## Allowlista
gra/src/ui/interHumanDiplomacyHud.ts, gra/src/main.ts (tylko dane okna hotseat), gra/src/game/diplomacy-peace-proposal-timing.ts (tylko jeśli potrzebny wspólny helper), nowy gra/tools/hotseat-peace-counter-ui-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana reguł (tylko etykieta), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp po bramkach.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d-podetap-b/d/e testy; nowy test z mutacją czerwoną. Zacommituj i zwróć SHA.
## Binarne kryterium
Licznik „Dostępne za N tur” w oknie hotseat spójny z bramką (to samo źródło), test z mutacją czerwoną, bramki zielone.
