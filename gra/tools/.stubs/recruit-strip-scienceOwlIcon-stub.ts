// Stub prywatny dla recruit-resource-strip-real-render-test.cjs — cityPanel.ts
// importuje scienceOwlIconHtml gdzie indziej w pliku (nagłówek Nauka), poza
// zakresem tego tematu; realny moduł ciągnie .svg?raw (esbuild w Node go nie
// obsługuje). appendRecruitMilitaryResourceStrip nigdy jej nie woła.
export function scienceOwlIconHtml(_size?: number): string { return ''; }
export function scienceOwlIconSized(_size?: number): string { return ''; }
