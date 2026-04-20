export function padDex(id: number): string {
  return `#${id.toString().padStart(4, "0")}`;
}

export function titleCase(slug: string): string {
  return slug
    .split(/[-_ ]+/)
    .map((word) => (word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(" ");
}
