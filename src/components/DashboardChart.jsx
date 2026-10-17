// src/components/DashboardChart.jsx

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
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
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiBarChart2,
  FiTrendingUp,
  FiEyeOff,
  FiEye,
  FiClock,
  FiCalendar,
  FiGrid,
  FiShoppingCart,
  FiDollarSign,
  FiZap,
  FiRefreshCw,
  FiAlertCircle,
  FiInbox,
} from "react-icons/fi";
import api from "../services/api";

/* ------------------------------------------------------------------ */
/* India time (IST) helpers                                            */
/* ------------------------------------------------------------------ */

const IST = "Asia/Kolkata";
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (n) => String(n).padStart(2, "0");

const istFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

// Calendar parts of any moment, as seen in India
const getISTParts = (date) => {
  const parts = {};
  istFormatter.formatToParts(date).forEach(({ type, value }) => {
    if (type !== "literal") parts[type] = Number(value);
  });
  return parts; // { year, month, day, hour }
};

const dayKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const formatHour = (h) => {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
};

/**
 * Builds the empty timeline for the selected period, based on the
 * current date and time in India.
 *  - daily   : every hour of today (12 AM until the current hour)
 *  - weekly  : the last 7 days, labelled Sun, Mon, Tue...
 *  - monthly : the last 30 days, labelled like "17 Oct"
 */
const buildTimeline = (period, now) => {
  const p = getISTParts(now);
  const today = dayKey(p.year, p.month, p.day);

  if (period === "daily") {
    return Array.from({ length: p.hour + 1 }, (_, h) => ({
      key: `${today}-${pad(h)}`,
      label: formatHour(h),
      fullLabel: `Today, ${formatHour(h)} IST`,
      orders: 0,
      revenue: 0,
    }));
  }

  const count = period === "weekly" ? 7 : 30;
  const base = Date.UTC(p.year, p.month - 1, p.day);

  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(base - (count - 1 - i) * 86400000);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const d = dt.getUTCDate();
    const weekday = dt.getUTCDay();
    const isToday = i === count - 1;

    return {
      key: dayKey(y, m, d),
      label:
        period === "weekly"
          ? DAY_SHORT[weekday]
          : `${d} ${MONTH_SHORT[m - 1]}`,
      fullLabel: `${isToday ? "Today, " : ""}${DAY_FULL[weekday]}, ${d} ${
        MONTH_SHORT[m - 1]
      }`,
      orders: 0,
      revenue: 0,
    };
  });
};

// Try to read a real date out of a row returned by the API
const getRowDate = (row) => {
  const candidates = [row?.date, row?.createdAt, row?.day, row?._id, row?.label];

  for (const value of candidates) {
    if (value == null) continue;
    if (typeof value === "object" && value.date) {
      const nested = new Date(value.date);
      if (!Number.isNaN(nested.getTime())) return nested;
      continue;
    }
    if (typeof value !== "string" && typeof value !== "number") continue;
    // Plain "YYYY-MM-DD" is treated as an India calendar day
    const text = String(value);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? new Date(`${text}T00:00:00+05:30`)
      : new Date(value);
    if (!Number.isNaN(date.getTime()) && /\d{4}|\d{10,}/.test(text)) {
      return date;
    }
  }
  return null;
};

// Put the API rows into the India-time timeline
const mergeIntoTimeline = (rows, period, now) => {
  const timeline = buildTimeline(period, now);
  const lookup = new Map(timeline.map((slot) => [slot.key, slot]));
  let matched = 0;

  rows.forEach((row) => {
    const date = getRowDate(row);
    if (!date) return;

    const p = getISTParts(date);
    const key =
      period === "daily"
        ? `${dayKey(p.year, p.month, p.day)}-${pad(p.hour)}`
        : dayKey(p.year, p.month, p.day);

    const slot = lookup.get(key);
    if (!slot) return;

    slot.orders += Number(row.orders) || 0;
    slot.revenue += Number(row.revenue) || 0;
    matched += 1;
  });

  // Rows without readable dates: show them exactly as the API sent them
  if (rows.length > 0 && matched === 0) {
    return rows.map((row, index) => ({
      key: `raw-${index}`,
      label: row.label ?? String(index + 1),
      fullLabel: row.label ?? String(index + 1),
      orders: Number(row.orders) || 0,
      revenue: Number(row.revenue) || 0,
    }));
  }

  return timeline;
};

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const periods = [
  { value: "daily", label: "Today", icon: FiClock },
  { value: "weekly", label: "Weekly", icon: FiCalendar },
  { value: "monthly", label: "Monthly", icon: FiGrid },
];

const periodHint = {
  daily: "Hourly orders for today (India time)",
  weekly: "Last 7 days by weekday (India time)",
  monthly: "Last 30 days (India time)",
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const clockFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

const CustomTooltip = ({ active, payload, showRevenue }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <FiCalendar size={13} className="text-slate-400" />
        {point.fullLabel || point.label}
      </p>

      <p className="flex items-center gap-2 text-sm text-indigo-600">
        <FiShoppingCart size={13} />
        Orders: <span className="font-bold">{point.orders}</span>
      </p>

      {showRevenue && (
        <p className="mt-1 flex items-center gap-2 text-sm text-emerald-600">
          <FiDollarSign size={13} />
          Revenue: <span className="font-bold">{currency(point.revenue)}</span>
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const DashboardChart = () => {
  const [period, setPeriod] = useState("weekly");
  const [chartType, setChartType] = useState("line");
  const [showRevenue, setShowRevenue] = useState(true);
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

  // Keep the India time (and the timeline) up to date every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadChart = async () => {
      try {
        setLoading(true);
        setError("");

        // This endpoint must be implemented in your backend.
        // The timezone is sent so the server can group by India time too.
        const response = await api.get(
          `/admin/dashboard/chart?period=${period}&timezone=${encodeURIComponent(
            IST
          )}`
        );

        const data = response.data?.data ?? response.data;

        if (!cancelled) {
          setRawRows(Array.isArray(data) ? data : data?.chartData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Unable to load sales performance."
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
  }, [period, reloadKey]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Timeline follows India time; re-built when the hour/day changes
  const hourStamp = Math.floor(now.getTime() / 3600000);
  const chartData = useMemo(
    () => mergeIntoTimeline(rawRows, period, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawRows, period, hourStamp]
  );

  const summary = useMemo(() => {
    const totalOrders = chartData.reduce((sum, row) => sum + row.orders, 0);
    const totalRevenue = chartData.reduce((sum, row) => sum + row.revenue, 0);
    const peak = chartData.reduce(
      (best, row) => (row.orders > (best?.orders ?? -1) ? row : best),
      null
    );

    return {
      totalOrders,
      totalRevenue,
      peakLabel: peak && peak.orders > 0 ? peak.label : "—",
    };
  }, [chartData]);

  const hasData = chartData.some((row) => row.orders > 0 || row.revenue > 0);

  const chartProps = {
    data: chartData,
    margin: { top: 8, right: 12, left: 0, bottom: 4 },
  };

  const renderAxes = () => (
    <>
      <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" vertical={false} />

      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: "#64748b" }}
        axisLine={{ stroke: "#e5e7eb" }}
        tickLine={false}
        interval={period === "weekly" ? 0 : "preserveStartEnd"}
        minTickGap={period === "weekly" ? 0 : 24}
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
        cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
        content={<CustomTooltip showRevenue={showRevenue} />}
      />

      <Legend
        verticalAlign="top"
        align="center"
        iconType="circle"
        wrapperStyle={{
          fontSize: "12px",
          color: "#64748b",
          paddingBottom: "12px",
        }}
      />
    </>
  );

  const summaryCards = [
    {
      icon: FiShoppingCart,
      label: "Total orders",
      value: summary.totalOrders.toLocaleString("en-IN"),
      tint: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: FiDollarSign,
      label: "Total revenue",
      value: currency(summary.totalRevenue),
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: FiZap,
      label: "Busiest slot",
      value: summary.peakLabel,
      tint: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section
      data-aos="fade-up"
      className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <style>{`
        @keyframes dcPing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .dc-ping { animation: dcPing 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dc-ping { animation: none; }
        }
      `}</style>

      {/* Chart header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <FiBarChart2 size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sales Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {periodHint[period]}
            </p>
          </div>
        </div>

        <div
          data-aos="fade-left"
          data-aos-delay="100"
          className="flex flex-wrap items-center gap-2"
        >
          {/* Live India time */}
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="dc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <FiClock size={13} />
            {clockFormatter.format(now)} IST
            <span className="hidden text-emerald-600/70 sm:inline">
              · {dateFormatter.format(now)}
            </span>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div
        data-aos="fade-up"
        data-aos-delay="100"
        className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-6"
      >
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          {periods.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition duration-300 sm:text-sm ${
                period === value
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setChartType((current) => (current === "line" ? "bar" : "line"))
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 active:scale-95 sm:text-sm"
        >
          {chartType === "line" ? (
            <FiBarChart2 size={15} />
          ) : (
            <FiTrendingUp size={15} />
          )}
          {chartType === "line" ? "Bar Chart" : "Line Chart"}
        </button>

        <button
          type="button"
          onClick={() => setShowRevenue((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 active:scale-95 sm:text-sm"
        >
          {showRevenue ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          {showRevenue ? "Hide Revenue" : "Show Revenue"}
        </button>
      </div>

      {/* Summary tiles */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 px-5 pt-5 sm:grid-cols-3 sm:px-6">
          {summaryCards.map(({ icon: Icon, label, value, tint }, index) => (
            <div
              key={label}
              data-aos="zoom-in"
              data-aos-delay={index * 100}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${tint}`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="truncate text-base font-bold text-slate-800">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart body */}
      <div className="px-3 pb-5 pt-5 sm:px-5 sm:pt-6">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center sm:h-[400px]">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading sales performance...
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            data-aos="zoom-in"
            className="flex h-[320px] flex-col items-center justify-center px-4 text-center sm:h-[400px]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiAlertCircle size={26} />
            </span>
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
            <p className="mt-2 text-xs text-slate-500">
              Check that the dashboard chart API endpoint is configured.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white transition hover:bg-indigo-700"
            >
              <FiRefreshCw
                size={14}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              Retry
            </button>
          </div>
        ) : !hasData ? (
          <div
            data-aos="zoom-in"
            className="flex h-[320px] flex-col items-center justify-center text-center sm:h-[400px]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiInbox size={26} />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-600">
              No sales data available for this period.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div
            key={`${period}-${chartType}`}
            data-aos="fade-up"
            className="h-[320px] w-full sm:h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <ComposedChart {...chartProps}>
                  <defs>
                    <linearGradient id="dcOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dcRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  {renderAxes()}

                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    fill="url(#dcOrders)"
                    stroke="none"
                    legendType="none"
                    animationDuration={900}
                  />

                  {showRevenue && (
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      fill="url(#dcRevenue)"
                      stroke="none"
                      legendType="none"
                      animationDuration={900}
                    />
                  )}

                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#5145ff"
                    strokeWidth={2.5}
                    dot={{
                      r: 3.5,
                      fill: "#ffffff",
                      stroke: "#5145ff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6 }}
                    animationDuration={900}
                  />

                  {showRevenue && (
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#00c389"
                      strokeWidth={2.5}
                      dot={{
                        r: 3.5,
                        fill: "#ffffff",
                        stroke: "#00c389",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 6 }}
                      animationDuration={900}
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
                    radius={[6, 6, 0, 0]}
                    maxBarSize={period === "weekly" ? 36 : 22}
                    animationDuration={900}
                  />

                  {showRevenue && (
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#00c389"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={period === "weekly" ? 36 : 22}
                      animationDuration={900}
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