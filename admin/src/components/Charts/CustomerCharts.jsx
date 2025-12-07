import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import './CustomerCharts.css';

const CustomerCharts = ({ data }) => {
  if (!data) {
    return <div>Carregando dados...</div>;
  }

  // Paleta Premium Laranja
  const COLORS = ['#ff6b35', '#f97316', '#fb923c', '#fdba74'];
  const GRADIENT_COLORS = {
    primary: ['#ff6b35', '#f97316'], // Laranja Fire
    secondary: ['#f97316', '#ea580c'], // Laranja Sunset
    tertiary: ['#ff9a56', '#ff6a00'], // Laranja Warm
    quaternary: ['#fbb040', '#f7931e'] // Laranja Sunrise
  };

  const chartData = [
    { name: 'Jan', customers: 65 },
    { name: 'Fev', customers: 59 },
    { name: 'Mar', customers: 80 },
    { name: 'Abr', customers: 81 },
    { name: 'Mai', customers: 56 },
    { name: 'Jun', customers: 55 },
  ];

  const pieData = [
    { name: 'Novos', value: 400 },
    { name: 'Recorrentes', value: 300 },
    { name: 'Inativos', value: 200 },
  ];

  return (
    <div className="customer-charts">
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Análise de Clientes</h3>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Crescimento de Clientes</h4>
          </div>
          <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#f97316', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#f97316', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="#ff6b35"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCustomers)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Distribuição de Clientes</h4>
          </div>
          <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                <linearGradient id="colorNovos" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff6b35" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="colorRecorrentes" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="colorInativos" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#fdba74" />
                </linearGradient>
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                <Cell fill="url(#colorNovos)" />
                <Cell fill="url(#colorRecorrentes)" />
                <Cell fill="url(#colorInativos)" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              />
              </PieChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCharts;
