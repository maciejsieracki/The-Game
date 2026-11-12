# ZASADA MODELI AUTOBOT (CLAUDE.md, stała zasada 2) — czytaj PRZED każdym startem Workflow
- Operator = HAIKU 5.5 domyślnie (poprawki, testy, dokumentacja, REPIN z gotową tabelą, parametry, małe UI).
- Operator = SONNET tylko z PISEMNYM UZASADNIENIEM w dispatchu i w args.sonnetWhy (temat obiektywnie trudny: duży diff, wiele ścieżek, balans AI, kod Rust > 1 partii) albo po 2 nieudanych rundach Haiku.
- Operator = OPUS 5.5 (wszystkie etapy) tylko dla pamięci/GPU/grafiki Rust.
- Obrona = HAIKU. Evaluator = SONNET. Final Control = SONNET.
- args.opModel ustawiaj ŚWIADOMIE per temat; nie kopiuj z poprzedniego wywołania.
- Skrypt WEB-NEW.js wymusza: Sonnet na Operatorze bez args.sonnetWhy = błąd; Obrona zawsze Haiku (poza Opus).
- Etykiety agentów w oknie Background tasks zawierają etap i model.
