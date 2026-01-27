import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const Dashboard = ({
  resumoPorMaquina = {},
  totalHorasDisponiveis = 0,
  totalHorasUsadas = 0,
  saldoHoras = 0
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Clock /> Dashboard de Capacidade
      </h2>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center">
          <p className="text-xs uppercase font-bold text-gray-400 mb-1">Horas Disponíveis (Total)</p>
          <p className="text-3xl font-black text-blue-700">
            {(Number(totalHorasDisponiveis) || 0).toFixed(2)}h
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center">
          <p className="text-xs uppercase font-bold text-gray-400 mb-1">Horas Usadas (Total)</p>
          <p className="text-3xl font-black text-indigo-700">
            {(Number(totalHorasUsadas) || 0).toFixed(2)}h
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center">
          <p className="text-xs uppercase font-bold text-gray-400 mb-1">Saldo Geral</p>
          <p
            className={`text-3xl font-black ${
              Number(saldoHoras) < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {(Number(saldoHoras) || 0).toFixed(2)}h
          </p>
        </div>
      </div>

      {/* Máquinas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(resumoPorMaquina || {}).map(([maquina, dados]) => {
          const capacidade = Number(dados?.capacidade) || 0;
          const usadas = Number(dados?.usadas) || 0;
          const saldo = Number(dados?.saldo) || 0;
          const pedidos = Array.isArray(dados?.pedidos) ? dados.pedidos : [];

          const ultrapassou = saldo < 0;

          return (
            <div
              key={maquina}
              className={`bg-white rounded-2xl shadow border-2 ${
                ultrapassou ? 'border-red-200' : 'border-gray-100'
              } p-5 space-y-4`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-blue-900">{maquina}</h3>
                {ultrapassou && <AlertTriangle className="text-red-500" size={20} />}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-bold">Capacidade</p>
                  <p className="font-black text-gray-700">{capacidade.toFixed(2)}h</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400 font-bold">Usadas</p>
                  <p className="font-black text-indigo-700">{usadas.toFixed(2)}h</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400 font-bold">Disponível</p>
                  <p className={`font-black ${saldo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {saldo.toFixed(2)}h
                  </p>
                </div>
              </div>

              {/* Pedidos */}
              <div>
                <p className="text-xs uppercase font-bold text-gray-400 mb-2">Pedidos nesta máquina</p>
                {pedidos.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhum pedido</p>
                ) : (
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {pedidos.map((p, i) => (
                      <li
                        key={p?.id || i}
                        className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <span className="font-bold text-blue-900">{p?.pedido || '—'}</span>
                        <span className="text-gray-600">{Number(p?.tempoTotalProducao || 0)}h</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
