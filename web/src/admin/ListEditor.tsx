import type { ReactNode } from "react";

export function ListEditor<T extends { id: string }>({
  title,
  items,
  onChange,
  renderItem,
  createNew,
  itemLabel,
  minItems,
  maxItems,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  createNew: () => T;
  itemLabel: (item: T, index: number) => string;
  minItems?: number;
  maxItems?: number;
}) {
  function updateAt(index: number, patch: Partial<T>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }
  function removeAt(index: number) {
    if (minItems && items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  }
  function moveUp(index: number) {
    if (index === 0) return;
    const next = items.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }
  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = items.slice();
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    onChange(next);
  }
  function add() {
    if (maxItems && items.length >= maxItems) return;
    onChange([...items, createNew()]);
  }

  return (
    <div className="list-editor">
      <div className="list-editor__header">
        <h4>{title}</h4>
        <button type="button" className="btn btn--secondary btn--sm" onClick={add} disabled={!!maxItems && items.length >= maxItems}>
          + Agregar
        </button>
      </div>
      {items.length === 0 && <p className="state-empty">Sin elementos todavía.</p>}
      {items.map((item, index) => (
        <details key={item.id} className="list-editor__item" open={items.length <= 3}>
          <summary>
            <span>{itemLabel(item, index)}</span>
            <span className="list-editor__item-actions">
              <button type="button" onClick={(e) => { e.preventDefault(); moveUp(index); }} aria-label="Mover arriba">↑</button>
              <button type="button" onClick={(e) => { e.preventDefault(); moveDown(index); }} aria-label="Mover abajo">↓</button>
              <button
                type="button"
                className="danger"
                onClick={(e) => { e.preventDefault(); removeAt(index); }}
                disabled={!!minItems && items.length <= minItems}
                aria-label="Eliminar"
              >
                Eliminar
              </button>
            </span>
          </summary>
          <div className="list-editor__item-body">{renderItem(item, (patch) => updateAt(index, patch))}</div>
        </details>
      ))}
    </div>
  );
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
