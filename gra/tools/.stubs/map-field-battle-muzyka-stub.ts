// Stub prywatny dla map-field-battle-test.cjs — realny audio/muzyka-antyczna.ts
// ciągnie audio/filePlayer.ts, który używa `import.meta.glob` (Vite-only); pod
// esbuildem/Node `import.meta.glob` nie istnieje, więc sama ewaluacja modułu
// rzuca TypeError zanim jakikolwiek test zdąży cokolwiek sprawdzić. Ciągnięty
// WYŁĄCZNIE transytywnie (mapFieldBattle.ts -> setMood(), zmiana nastroju
// muzyki przy starcie/końcu bitwy) — poza zakresem tej bramki, która mierzy
// logikę bitwy na mapie (rostery, walidację, plan), nie audio.
export function setMood(_mood: 'mapa' | 'bitwa'): void {}
