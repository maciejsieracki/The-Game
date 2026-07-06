/** Normalizacja etykiet PL z kreatora (Mały, Duży, Ogromny…) do ASCII slug. */
export function normPlMenuLabel(label: string): string {
  return label.toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/[ó]/g, 'o')
    .replace(/[ąà]/g, 'a')
    .replace(/[ę]/g, 'e')
    .replace(/[żź]/g, 'z')
    .replace(/[^a-z0-9]/g, '');
}
