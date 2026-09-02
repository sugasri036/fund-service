import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function NavChart({ data }) {

  const chartData = data.map(item => ({
    date: item.navDate,
    nav: item.nav
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>

      <ResponsiveContainer width="100%" height="100%">

        <LineChart data={chartData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis domain={["auto", "auto"]} />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="nav"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

export default NavChart;