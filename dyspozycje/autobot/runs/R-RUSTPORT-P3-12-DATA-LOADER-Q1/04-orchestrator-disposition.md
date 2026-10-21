STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-12-DATA-LOADER-Q1
Final Control: DECISION_REQUIRED tylko dla zarzutu 5 (błąd kształtu bez pełnej ścieżki serde; dispatch zakazuje nowych zależności,
a `serde_path_to_error` byłby zależnością). Orkiestrator: to NIE decyzja produktowa. `LoadError::ShapeMismatch` niesie nazwę pliku,
line/column i komunikat serde_json z nazwą pola — wystarcza do diagnozy; nowa zależność bez realnego zysku odrzucona. Rozstrzygnięte: akceptacja
line/column. Pozostałe 10 zarzutów ODDAL przez Final Control (loader: 29 plików, 7 wariantów błędu pokrytych, makro `data_table!`
generuje listę/DataSet/load_all z jednej tabeli).
INTEGRACJA: rebase na a9441bd9 (po P3.11), `cargo test --offline` EXIT=0, 292 passed, 0 failed (278 + 14). Wypchnięte na `rust-port/parity-v2`.
Uwaga: temat ma `loader` tylko dla struktur z `Deserialize`; round-trip/Serialize → P3.15. RUNDY: 2/5. DEPLOY: NIE.
