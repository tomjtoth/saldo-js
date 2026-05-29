"use client";

import { useClientState } from "@/app/_lib/hooks";
import { XAxisTickContentProps } from "recharts";

export default function ConsumptionTick({
  x,
  y,
  payload,
}: XAxisTickContentProps) {
  const categoriesO1 = useClientState("categories[id]");
  const { name } = categoriesO1[payload.value as number];

  return (
    <text
      x={x}
      y={y}
      fill="#666"
      textAnchor="end"
      dy={-6}
      transform={`rotate(-75, ${x}, ${y})`}
    >
      {name}
    </text>
  );
}
