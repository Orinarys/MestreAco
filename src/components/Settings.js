import React from 'react';

const Settings = ({ metrosPorHora, setMetrosPorHora }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Metros por Hora (Produtividade)</h3>
        <p className="text-sm text-gray-600 mb-4">Configure a produtividade para cada tipo de EPS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrosPorHora).map(([tipo, metros]) => (
            <div key={tipo} className="bg-gray-50 p-3 rounded border">
              <label className="block text-sm font-medium mb-1 text-gray-700">{tipo}</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={metros} 
                  onChange={(e) => setMetrosPorHora({...metrosPorHora, [tipo]: parseFloat(e.target.value) || 0})} 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                <span className="text-sm text-gray-500 font-medium">m/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Como usar o Sistema
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Pedidos:</strong> Gerencie todos os pedidos de telhas na aba principal.</li>
          <li>• <strong>Cálculo Automático:</strong> As horas de máquina e montagem são calculadas com base nos metros e produtividade configurada.</li>
          <li>• <strong>Dashboard:</strong> Visualize o desempenho da equipe e a distribuição da produção.</li>
          <li>• <strong>Exportar/Importar:</strong> Realize backups periódicos dos seus dados usando os botões de exportação.</li>
          <li>• <strong>Armazenamento:</strong> Os dados são salvos localmente no seu navegador.</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
