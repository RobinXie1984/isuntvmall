export function reviewSelectionKey(item: { id: string; revision: number }): string {
  return `${item.id}:${item.revision}`;
}
