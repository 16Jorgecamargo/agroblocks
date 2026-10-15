import { useEffect, useId, useRef } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { CellRef } from "@/game/missions/goals";
import type { Cell, GameState } from "@/game/world/types";
import { describeCell, FACING_LABELS } from "@/render/cellDescription";
import { registerCellLocator } from "@/render/cellLocator";
import { ERROR_SHAKE } from "@/motion/presets";
import { SPRINGS } from "@/motion/springs";
import "./Grid2D.css";

interface Grid2DProps {
  state: GameState;
  highlightCells: CellRef[];
  failed: boolean;
}

const PLOT_GLYPHS: Record<Cell["plot"], string> = {
  untilled: "",
  tilled: "≡",
  seeded: "•",
  growing: "🌱",
  mature: "🍅",
  harvested: "✂",
};

const TERRAIN_GLYPHS: Record<Exclude<Cell["terrain"], "soil">, string> = {
  obstacle: "⛰",
  blocked: "✕",
  reservoir: "💧",
  seedDepot: "📦",
};

const FACING_ROTATION = { N: 0, E: 90, S: 180, W: 270 };

export function Grid2D({ state, highlightCells, failed }: Grid2DProps) {
  const highlighted = new Set(highlightCells.map(([x, y]) => `${x},${y}`));
  const gridRef = useRef<HTMLDivElement>(null);
  const layoutId = useId();

  useEffect(() => {
    return registerCellLocator((x, y) => {
      const cell = gridRef.current?.querySelector<HTMLElement>(
        `[data-cell="${x},${y}"]`,
      );
      if (!cell) return null;
      const rect = cell.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  }, []);

  return (
    <LayoutGroup id={layoutId}>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Mapa da fazenda"
        className="grid2d"
        style={{
          gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))`,
        }}
      >
        {state.cells.map((row, y) => (
          <div role="row" key={y} className="grid2d__row">
            {row.map((cell, x) => {
              const hasRobot = state.robot.x === x && state.robot.y === y;
              const isGoal = highlighted.has(`${x},${y}`);
              const parts = [
                `coluna ${x + 1}, linha ${y + 1}: ${describeCell(cell)}`,
              ];
              if (isGoal) parts.push("objetivo");
              if (hasRobot)
                parts.push(
                  `robô virado para ${FACING_LABELS[state.robot.facing]}`,
                );
              const glyph =
                cell.terrain === "soil"
                  ? PLOT_GLYPHS[cell.plot]
                  : TERRAIN_GLYPHS[cell.terrain];
              return (
                <div
                  role="gridcell"
                  key={x}
                  data-cell={`${x},${y}`}
                  aria-label={parts.join(", ")}
                  className={[
                    "grid2d__cell",
                    `grid2d__cell--${cell.terrain}`,
                    cell.terrain === "soil" ? `grid2d__cell--${cell.plot}` : "",
                    cell.moisture === "wet" ? "grid2d__cell--wet" : "",
                    isGoal ? "grid2d__cell--goal" : "",
                  ].join(" ")}
                >
                  <motion.span
                    key={`${cell.plot}-${cell.moisture}`}
                    className="grid2d__glyph"
                    aria-hidden="true"
                    initial={{ scale: 0.3 }}
                    animate={{ scale: 1 }}
                    transition={SPRINGS.bounce}
                  >
                    {glyph}
                  </motion.span>
                  {cell.moisture === "wet" && cell.terrain === "soil" && (
                    <span className="grid2d__drop" aria-hidden="true">
                      💧
                    </span>
                  )}
                  {hasRobot && (
                    <motion.span
                      layoutId="grid2d-robot"
                      className={`grid2d__robot${failed ? " grid2d__robot--failed" : ""}`}
                      aria-hidden="true"
                      animate={
                        failed
                          ? {
                              rotate: FACING_ROTATION[state.robot.facing],
                              ...ERROR_SHAKE.keyframes,
                            }
                          : { rotate: FACING_ROTATION[state.robot.facing] }
                      }
                      transition={failed ? ERROR_SHAKE.options : SPRINGS.snap}
                    >
                      ▲
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </LayoutGroup>
  );
}
