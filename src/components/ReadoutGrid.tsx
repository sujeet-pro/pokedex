type Item = { label: string; value: string | number; unit?: string };
type Props = { items: Item[] };

export function ReadoutGrid({ items }: Props) {
  return (
    <dl className="readouts">
      {items.map((it) => (
        <div key={it.label}>
          <dt>{it.label}</dt>
          <dd>
            {it.value}
            {it.unit ? <small> {it.unit}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
