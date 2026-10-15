// src/components/DashboardChart.jsx

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FiBarChart2,
  FiEyeOff,
  FiEye,
} from "react-icons/fi";
import api from "../services/api";

const periods = ["daily", "weekly", "monthly"];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPeriod = (period) =>
  period.charAt(0).toUpperCase() + period.slice(1);

const CustomTooltip = ({ active, payload, label, showRevenue }) => {
  if (!active || !payload?.length) return null;

  const orders = payload.find((item) => item.dataKey === "orders");
  const revenue = payload.find((item) => item.dataKey === "revenue");

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>

      {orders && (
        <p className="text-sm text-indigo-600">
          Orders: {orders.value}
        </p>
      )}

      {showRevenue && revenue && (
        <p className="mt-1 text-sm text-emerald-600">
          Revenue: {currency(revenue.value)}
        </p>
      )}
    </div>
  );
};

const DashboardChart = () => {
  const [period, setPeriod] = useState("daily");
  const [chartType, setChartType] = useState("line");
  const [showRevenue, setShowRevenue] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadChart = async () => {
      try {
        setLoading(true);
        setError("");

        // This endpoint must be implemented in your backend.
        const response = await api.get(
          `/admin/dashboard/chart?period=${period}`
        );

        const data = response.data?.data ?? response.data;

        if (!cancelled) {
          setChartData(Array.isArray(data) ? data : data?.chartData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load sales performance."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const chartProps = {
    data: chartData,
    margin: { top: 8, right: 12, left: 0, bottom: 4 },
  };

  const renderAxes = () => (
    <>
      <CartesianGrid
        stroke="#e5e7eb"
        strokeDasharray="0"
        vertical
        horizontal
      />

      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: "#64748b" }}
        axisLine={{ stroke: "#e5e7eb" }}
        tickLine={false}
        minTickGap={20}
      />

      <YAxis
        yAxisId="orders"
        orientation="left"
        allowDecimals={false}
        tick={{ fontSize: 10, fill: "#525252" }}
        axisLine={false}
        tickLine={false}
        label={{
          value: "Orders",
          angle: -90,
          position: "insideLeft",
          fill: "#64748b",
          fontSize: 11,
        }}
      />

      {showRevenue && (
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tickFormatter={(value) =>
            value === 0 ? "₹0" : `₹${value.toLocaleString("en-IN")}`
          }
          tick={{ fontSize: 10, fill: "#525252" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Revenue (₹)",
            angle: 90,
            position: "insideRight",
            fill: "#64748b",
            fontSize: 11,
          }}
        />
      )}

      <Tooltip
        content={<CustomTooltip showRevenue={showRevenue} />}
      />

      <Legend
        verticalAlign="top"
        align="center"
        iconType="rect"
        wrapperStyle={{
          fontSize: "12px",
          color: "#64748b",
          paddingBottom: "12px",
        }}
      />
    </>
  );

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Chart header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FiBarChart2 size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sales Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Order volume and revenue trends
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  period === item
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {formatPeriod(item)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setChartType((current) =>
                current === "line" ? "bar" : "line"
              )
            }
            className="rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:text-sm"
          >
            {chartType === "line" ? "Bar Chart" : "Line Chart"}
          </button>

          <button
            type="button"
            onClick={() => setShowRevenue((current) => !current)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:text-sm"
          >
            {showRevenue ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            {showRevenue ? "Hide Revenue" : "Show Revenue"}
          </button>
        </div>
      </div>

      {/* Chart body */}
      <div className="px-3 pb-5 pt-5 sm:px-5 sm:pt-6">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center sm:h-[400px]">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading sales performance...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[320px] flex-col items-center justify-center px-4 text-center sm:h-[400px]">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-2 text-xs text-slate-500">
              Check that the dashboard chart API endpoint is configured.
            </p>
            <button
              type="button"
              onClick={() => setPeriod((current) => current)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-500 sm:h-[400px]">
            No sales data available for this period.
          </div>
        ) : (
          <div className="h-[320px] w-full sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <ComposedChart {...chartProps}>
                  {renderAxes()}

                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    fill="#4f46e5"
                    fillOpacity={0.12}
                    stroke="none"
                    legendType="none"
                  />

                  {showRevenue && (
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#10b981"
                      fillOpacity={0.10}
                      stroke="none"
                      legendType="none"
                    />
                  )}

                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#5145ff"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#ffffff",
                      stroke: "#5145ff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5 }}
                  />

                  {showRevenue && (
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#00c389"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "#ffffff",
                        stroke: "#00c389",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </ComposedChart>
              ) : (
                <BarChart {...chartProps}>
                  {renderAxes()}

                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    name="Orders"
                    fill="#5145ff"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />

                  {showRevenue && (
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#00c389"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardChart;
