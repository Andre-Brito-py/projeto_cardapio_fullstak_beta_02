import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import './CustomerCharts.css';

const CustomerCharts = ({ data }) => {
  if (!data) {
    return <div>Carregando dados...</div>;
  }

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
  const GRADIENT_COLORS = {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    tertiary: ['#4facfe', '#00f2fe'],
    quaternary: ['#43e97b', '#38f9d7']
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
      <h3>Análise de Clientes</h3>
      
      <div className="charts-grid">
        <div className="chart-container">
          <h4>Crescimento de Clientes</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#667eea', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#667eea', fontSize: 12, fontWeight: 500 }}
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
                stroke="#667eea" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCustomers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Distribuição de Clientes</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                <linearGradient id="colorNovos" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
                <linearGradient id="colorRecorrentes" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f093fb" />
                  <stop offset="100%" stopColor="#f5576c" />
                </linearGradient>
                <linearGradient id="colorInativos" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
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
  );
};

export default CustomerCharts;