/**
 * Row-major masonry grid.
 *
 * CSS `columns-*` masonry fills each column top-to-bottom before moving right,
 * so the curated order (left-to-right in the /edit CMS) reads vertically on the
 * live site. This component distributes items round-robin across columns
 * (item i → column i % count), so order reads left-to-right across each row —
 * matching the editor — while every column still stacks natural-height images
 * with no cropping or gaps.
 */

import { useEffect, useState, type ReactNode } from "react";

export interface MasonryColumns {
  base: number;
  sm?: number;
  lg?: number;
  xl?: number;
}

function computeCount(cfg: MasonryColumns): number {
  if (typeof window === "undefined") return cfg.base;
  if (cfg.xl && window.matchMedia("(min-width: 1280px)").matches) return cfg.xl;
  if (cfg.lg && window.matchMedia("(min-width: 1024px)").matches) return cfg.lg;
  if (cfg.sm && window.matchMedia("(min-width: 640px)").matches) return cfg.sm;
  return cfg.base;
}

function useResponsiveColumns(cfg: MasonryColumns): number {
  const [count, setCount] = useState(() => computeCount(cfg));

  useEffect(() => {
    const onResize = () => setCount(computeCount(cfg));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cfg.base, cfg.sm, cfg.lg, cfg.xl]);

  return count;
}

export default function MasonryGrid<T>({
  items,
  columns,
  renderItem,
}: {
  items: T[];
  columns: MasonryColumns;
  /** index is the item's position in the ORIGINAL array (for lightbox etc.) */
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const count = useResponsiveColumns(columns);

  const cols: Array<Array<{ item: T; index: number }>> = Array.from(
    { length: count },
    () => []
  );
  items.forEach((item, index) => {
    cols[index % count].push({ item, index });
  });

  return (
    <div className="flex gap-4 items-start">
      {cols.map((col, ci) => (
        <div key={ci} className="flex-1 min-w-0 flex flex-col gap-4">
          {col.map(({ item, index }) => (
            <div key={index}>{renderItem(item, index)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
