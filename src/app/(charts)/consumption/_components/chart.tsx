"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useClientState, useDebugger } from "@/app/_lib/hooks";

import ConsumptionTooltip from "./tooltip";
import ConsumptionLegend from "./legend";
import ConsumptionTick from "./tick";

export default function ConsumptionChart() {
  const consumption = useClientState("consumption");
  const user = useClientState("user")!;
  const users = useClientState("users");

  const filteredConsumptionData = useMemo(
    () =>
      consumption.filter((x) =>
        user.categoriesHiddenFromConsumption.every(
          (cid) => cid !== x.categoryId,
        ),
      ),
    [consumption, user.categoriesHiddenFromConsumption],
  );

  useDebugger({ filteredConsumptionData });

  return (
    <div className=" h-full w-full">
      <ResponsiveContainer>
        <BarChart data={filteredConsumptionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="categoryId"
            tick={ConsumptionTick}
            type="category"
            allowDuplicatedCategory={false}
            height={100}
          />
          <YAxis />
          <Tooltip content={ConsumptionTooltip} />
          <Legend content={ConsumptionLegend} />
          {users.map(({ id, name, color }) => (
            <Bar dataKey={id} name={name!} key={id} stackId="a" fill={color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
