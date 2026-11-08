# Integracja — R-PROC-AUTOBOT-KANBAN-RETIRED-Q1

**Etap:** 9/11. Zatwierdzony przez Final Control zakres dokumentacji został zintegrowany na `main` w commicie `dac5bcc44e6c97685f6b97247734f3265ff23c05`.

Zakres obejmuje aktywny kanon procesu bez wymogu Kanbanu, regułę Cursor, skill, instrukcję edycji, README procesu i skalę 1–11, C-063 w playbooku/JSON oraz wspólny tracker tematów. Zachowano historyczne materiały bez ich kasowania. Nie zmieniono kodu gry.

**Weryfikacja integracyjna:** process docs audit PASS; generator dry-run 63/63 bez różnic; `git diff --check` PASS. Etap 10 jest `N/A` dla deployu gry: zmiana dotyczy wyłącznie zasad/rejestru procesu i nie zmienia buildu Roboczej. Potwierdzenie N/A zostanie utrwalone w `80-robocza-deploy.md`; push/readback pozostaje etapem 11.
