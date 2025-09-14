import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './CustomerCharts.css';

const CustomerCharts = ({ data }) => {
  if (!data) {
    return <div>Carregando dados...</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
      
      <div className="chart-container">
        <h4>Clientes por Mês</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="customers" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h4>Distribuição de Clientes</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerCharts;