import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, BarChart3, Package, Settings as SettingsIcon, MapPin, Truck, Store, User } from 'lucide-react';

/* ===================== CONFIG PRODUÇÃO ===================== */
// Taxas de produção para HORA MÁQUINA - TELHAS NORMAIS (metros/hora)
const PRODUCAO_MAQUINAS_PADRAO = {
  TP40: 400,    // Telha normal TP40: 400m/h
  TP25: 300,    // Telha normal TP25: 300m/h
  FORRO: 100,   // Forro normal: 100m/h
};

// Taxas de produção para TELHAS COLADAS (metros/hora)
// Coladas são MAIS LENTAS pois exigem processo de colagem manual
const PRODUCAO_TELHAS_COLADAS = {
  TP40: 90,     // Telha COLADA TP40: apenas 90m/h (mais lenta!)
  TP25: 100,    // Telha COLADA TP25: apenas 100m/h
  FORRO: 70,    // Forro COLADO: apenas 70m/h
};

const MAQUINAS = ['TP40', 'TP25', 'FORRO', 'Colada TP40', 'Colada TP25', 'Colada FORRO'];

const VENDEDORES = [
  'THIAGO MOTA', 'PRISCILA ARAUJO', 'TAIS ARAUJO', 'MARIA JULIA SOARES',
  'CLAUDINEI CRUZ', 'ALEXANDRE', 'JOSE ADRIANO', 'KEVIN SILVA',
  'EROS RODRIGUES', 'DANILO ANDRADE', 'ANSELMO CUNHA', 'FERNANDA TAVARES'
];

const TIPOS_TELHAS = ['SANDUICHE', 'SIMPLES', 'FORRO'];
const TIPOS_EPS = ['30MM', '50MM', 'PIR30MM', 'PIR50MM'];
const TIPOS_FRETE = ['CIF', 'FOB'];

const HORAS_DIA = 8; // 8 horas por dia conforme Excel
const BUFFER_PRAZO_FIXO = 0; // Buffer FIXO de 5 dias (igual ao Excel: =C11+5)
const HORAS_MES_POR_MAQUINA = 800; // Capacidade mensal por máquina

/* ===================== FUNÇÕES AUX ===================== */
const hojeISO = () => new Date().toISOString().split('T')[0];

const calcularDataSugerida = (dataEntradaISO, diasSugeridos) => {
  if (!dataEntradaISO || !diasSugeridos) return { dataSugerida: hojeISO() };
  
  const data = new Date(dataEntradaISO + 'T12:00:00');
  data.setDate(data.getDate() + Math.floor(diasSugeridos));
  
  return {
    dataSugerida: data.toISOString().split('T')[0]
  };
};

const formatarDataBR = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

// Funções para gerenciar localStorage
const STORAGE_KEY = 'mestre-aco-pedidos';
const CONFIG_KEY = 'mestre-aco-config';

const salvarPedidos = (pedidos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
    return true;
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    return false;
  }
};

const carregarPedidos = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return [];
  }
};

const salvarConfig = (metrosPorHora, metrosPorHoraColadas) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ metrosPorHora, metrosPorHoraColadas }));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
};

const carregarConfig = () => {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    if (data) {
      const config = JSON.parse(data);
      return {
        metrosPorHora: config.metrosPorHora || PRODUCAO_MAQUINAS_PADRAO,
        metrosPorHoraColadas: config.metrosPorHoraColadas || PRODUCAO_TELHAS_COLADAS
      };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  return {
    metrosPorHora: PRODUCAO_MAQUINAS_PADRAO,
    metrosPorHoraColadas: PRODUCAO_TELHAS_COLADAS
  };
};

/* ===================== COMPONENTES AUXILIARES ===================== */
const RelatorioRegioes = ({ pedidos = [] }) => {
  const resumo = useMemo(() => {
    const regioes = {};
    pedidos.forEach(p => {
      const reg = p.tipoEntrega === 'RETIRADA' ? 'RETIRADA NA LOJA' : (p.regiao || 'NÃO INFORMADO');
      if (!regioes[reg]) {
        regioes[reg] = { totalPedidos: 0, totalMetros: 0, clientes: new Set() };
      }
      regioes[reg].totalPedidos += 1;
      regioes[reg].totalMetros += parseFloat(p.totalMetros) || 0;
      regioes[reg].clientes.add(p.cliente);
    });
    return Object.entries(regioes).sort((a, b) => b[1].totalMetros - a[1].totalMetros);
  }, [pedidos]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <MapPin className="text-red-500" /> Relatório de Regiões e Logística
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resumo.slice(0, 3).map(([reg, dados], idx) => (
          <div key={reg} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Top {idx + 1} Região</span>
              <MapPin size={16} className="text-blue-500" />
            </div>
            <h4 className="text-lg font-black text-blue-900 truncate">{reg}</h4>
            <p className="text-2xl font-black text-blue-600">{dados.totalMetros.toFixed(2)}m</p>
            <p className="text-xs text-gray-500 font-bold">{dados.totalPedidos} pedidos • {dados.clientes.size} clientes</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-gray-600">Região / Localidade</th>
              <th className="px-6 py-4 text-center font-bold text-gray-600">Qtd Pedidos</th>
              <th className="px-6 py-4 text-center font-bold text-gray-600">Qtd Clientes</th>
              <th className="px-6 py-4 text-right font-bold text-gray-600">Total Metros</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {resumo.map(([reg, dados]) => (
              <tr key={reg} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-blue-900">{reg}</td>
                <td className="px-6 py-4 text-center font-medium">{dados.totalPedidos}</td>
                <td className="px-6 py-4 text-center font-medium">{dados.clientes.size}</td>
                <td className="px-6 py-4 text-right font-black text-blue-600">{dados.totalMetros.toFixed(2)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Settings = ({ metrosPorHora, setMetrosPorHora, metrosPorHoraColadas, setMetrosPorHoraColadas }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
      <SettingsIcon className="text-blue-600" /> Configurações de Produção
    </h2>
    
    {/* Configuração de Telhas NORMAIS */}
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-blue-900 mb-4">Telhas NORMAIS (metros/hora)</h3>
      <p className="text-sm text-gray-500 mb-6 font-medium">Capacidade de produção para telhas sem colagem</p>
      <div className="space-y-4">
        {Object.entries(metrosPorHora).map(([maquina, valor]) => (
          <div key={maquina} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-black text-blue-900">{maquina}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Telha Normal</p>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={valor} 
                onChange={(e) => setMetrosPorHora({...metrosPorHora, [maquina]: parseFloat(e.target.value) || 0})}
                className="w-32 border-gray-200 border rounded-xl px-4 py-2 font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-sm font-bold text-gray-400">m/h</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Configuração de Telhas COLADAS */}
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 border-2">
      <h3 className="text-lg font-bold text-amber-900 mb-4">Telhas COLADAS (metros/hora)</h3>
      <p className="text-sm text-amber-700 mb-6 font-medium">⚠️ Telhas coladas são MAIS LENTAS + <span className="bg-amber-200 px-2 py-1 rounded-lg font-black">5 DIAS FIXOS</span> (40h) para processo de colagem/montagem</p>
      <div className="space-y-4">
        {Object.entries(metrosPorHoraColadas).map(([tipo, valor]) => (
          <div key={tipo} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div>
              <p className="font-black text-amber-900">Colada {tipo}</p>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Com processo de colagem</p>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={valor} 
                onChange={(e) => setMetrosPorHoraColadas({...metrosPorHoraColadas, [tipo]: parseFloat(e.target.value) || 0})}
                className="w-32 border-amber-300 border rounded-xl px-4 py-2 font-black text-amber-700 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="text-sm font-bold text-amber-600">m/h</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Info Box */}
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
      <h4 className="font-black text-blue-900 mb-3 flex items-center gap-2">
        <BarChart3 size={20} /> Como funciona o cálculo:
      </h4>
      <div className="space-y-2 text-sm text-blue-800">
        <p><strong>• Telha NORMAL (ex: TP40):</strong> Usa taxa de 400m/h - apenas hora máquina</p>
        <p><strong>• Telha COLADA (ex: Colada TP40):</strong> Usa taxa de 90m/h + <span className="bg-amber-200 px-2 py-0.5 rounded font-black">5 DIAS FIXOS</span> (40h) para colagem</p>
        <p className="pt-2 border-t border-blue-200 mt-3"><strong>Exemplo Colada:</strong> 100m em TP40 Colada = 1.11h máquina + 40h montagem (colagem) = 41.11h total</p>
        <p className="pt-2 border-t border-blue-200 mt-3"><strong>Fórmula Excel:</strong> Sugestão Prazo = (Tempo Total / 8) + 5 dias buffer</p>
      </div>
    </div>
  </div>
);

const Dashboard = ({ resumoPorMaquina, totalHorasDisponiveis, totalHorasUsadas, saldoHoras }) => {
  const maquinaTotal = totalHorasDisponiveis;
  const montagemTotal = totalHorasDisponiveis;
  const cargaTotal = totalHorasDisponiveis;
  
  const horaMaquinaAlocada = Object.values(resumoPorMaquina).reduce((acc, m) => acc + m.horaMaquina, 0);
  const horaMontagemAlocada = Object.values(resumoPorMaquina).reduce((acc, m) => acc + m.horaMontagem, 0);
  const tempoTotalProducao = horaMaquinaAlocada + horaMontagemAlocada;
  
  const maquinaDisponivel = maquinaTotal - horaMaquinaAlocada;
  const montagemDisponivel = montagemTotal - horaMontagemAlocada;
  const cargaTotalDisponivel = cargaTotal - tempoTotalProducao;
  
  const maquinaSemanal = (maquinaTotal / 20) * 5;
  const montagemSemanal = (montagemTotal / 20) * 5;
  const producaoSemanal = (cargaTotal / 20) * 5;
  
  const diasAlocados = horaMaquinaAlocada / 8;
  const diasMontagem = horaMontagemAlocada / 8;
  const totalDiasProducao = tempoTotalProducao / 8;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 rounded-3xl shadow-lg">
          <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Máquina Total</p>
          <h3 className="text-4xl font-black">{maquinaTotal.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-blue-300">Capacidade mensal</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-500 text-white p-6 rounded-3xl shadow-lg">
          <p className="text-amber-100 text-xs font-black uppercase tracking-widest mb-1">Montagem Total</p>
          <h3 className="text-4xl font-black">{montagemTotal.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-amber-200">Capacidade mensal</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-500 text-white p-6 rounded-3xl shadow-lg">
          <p className="text-purple-100 text-xs font-black uppercase tracking-widest mb-1">Carga Total</p>
          <h3 className="text-4xl font-black">{cargaTotal.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-purple-200">Capacidade mensal</p>
        </div>
      </div>

      {/* Cards Alocadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Hora Máquina Alocada</p>
          <h3 className="text-4xl font-black text-blue-600">{horaMaquinaAlocada.toFixed(2)}h</h3>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all" style={{ width: `${Math.min(100, (horaMaquinaAlocada/maquinaTotal)*100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Hora de Montagem</p>
          <h3 className="text-4xl font-black text-amber-600">{horaMontagemAlocada.toFixed(2)}h</h3>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-600 h-full transition-all" style={{ width: `${Math.min(100, (horaMontagemAlocada/montagemTotal)*100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Tempo Total Produção</p>
          <h3 className="text-4xl font-black text-purple-600">{tempoTotalProducao.toFixed(2)}h</h3>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full transition-all" style={{ width: `${Math.min(100, (tempoTotalProducao/cargaTotal)*100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Cards Disponível */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Máquina Disponível</p>
          <h3 className={`text-4xl font-black ${maquinaDisponivel < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{maquinaDisponivel.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-gray-400 font-bold">{maquinaDisponivel < 0 ? 'Capacidade excedida!' : 'Saldo positivo'}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Montagem Disponível</p>
          <h3 className={`text-4xl font-black ${montagemDisponivel < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{montagemDisponivel.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-gray-400 font-bold">{montagemDisponivel < 0 ? 'Capacidade excedida!' : 'Saldo positivo'}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Carga Total Disponível</p>
          <h3 className={`text-4xl font-black ${cargaTotalDisponivel < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{cargaTotalDisponivel.toFixed(2)}h</h3>
          <p className="text-xs mt-2 text-gray-400 font-bold">{cargaTotalDisponivel < 0 ? 'Capacidade excedida!' : 'Saldo positivo'}</p>
        </div>
      </div>

      {/* Detalhamento por Máquina */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhamento por Máquina</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(resumoPorMaquina).map(([maquina, dados]) => (
            <div key={maquina} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h4 className="text-xl font-black text-blue-900 mb-4 flex justify-between items-center">
                {maquina} <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{dados.pedidos.length} pedidos</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-400 uppercase">Hora Máquina</span>
                    <span className="text-blue-600">{dados.horaMaquina.toFixed(2)}h</span>
                  </div>
                  <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (dados.horaMaquina / dados.capacidade) * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-400 uppercase">Hora Montagem</span>
                    <span className="text-amber-600">{dados.horaMontagem.toFixed(2)}h</span>
                  </div>
                  <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (dados.horaMontagem / dados.capacidade) * 100)}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Total Usado</p>
                    <p className="text-lg font-black text-purple-900">{dados.usadas.toFixed(1)}h</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Saldo</p>
                    <p className={`text-lg font-black ${dados.saldo < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{dados.saldo.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ===================== APP PRINCIPAL ===================== */
const App = () => {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const configInicial = carregarConfig();
  const [metrosPorHora, setMetrosPorHora] = useState(configInicial.metrosPorHora);
  const [metrosPorHoraColadas, setMetrosPorHoraColadas] = useState(configInicial.metrosPorHoraColadas);
  const [showForm, setShowForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [selectedPedidos, setSelectedPedidos] = useState(new Set());

  const [filters, setFilters] = useState({
    cliente: '',
    pedido: '',
    vendedor: '',
    metro: '',
    dataSugerida: ''
  });

  const [formData, setFormData] = useState({
    dataEntrada: hojeISO(),
    pedido: '',
    cliente: '',
    vendedor: VENDEDORES[0],
    tipoTelha: TIPOS_TELHAS[0],
    totalMetros: '',
    maquina: MAQUINAS[0],
    colagem: 'NENHUMA',
    tipoEps: TIPOS_EPS[0],
    tipoFrete: TIPOS_FRETE[0],
    tipoEntrega: 'ENTREGA',
    cep: '',
    regiao: '',
    dataEntregaCliente: '',
    dataPrevistaProducao: '',
    diasSugeridos: '',
    horaMaquina: '',
    horaMontagem: '',
    tempoTotalProducao: ''
  });

  // Carregar pedidos do localStorage na inicialização
  useEffect(() => {
    const pedidosCarregados = carregarPedidos();
    setPedidos(pedidosCarregados);
  }, []);

  // Salvar configurações quando mudarem
  useEffect(() => {
    salvarConfig(metrosPorHora, metrosPorHoraColadas);
  }, [metrosPorHora, metrosPorHoraColadas]);

  // Busca CEP
  useEffect(() => {
    const buscarCep = async () => {
      const cepLimpo = formData.cep.replace(/\D/g, '');
      if (cepLimpo.length === 8 && formData.tipoEntrega === 'ENTREGA') {
        setLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await response.json();
          if (!data.erro) setFormData(prev => ({ ...prev, regiao: `${data.localidade} - ${data.uf}` }));
        } catch (error) { console.error('Erro CEP', error); }
        finally { setLoadingCep(false); }
      }
    };
    const timer = setTimeout(buscarCep, 800);
    return () => clearTimeout(timer);
  }, [formData.cep, formData.tipoEntrega]);


useEffect(() => {
  if (!formData.totalMetros || !formData.dataEntrada) return;

  const metros = Number(formData.totalMetros) || 0;
  const maquinaRaw = (formData.maquina || '').trim();
  const maquina = maquinaRaw.toUpperCase();

  const PRODUCAO_NORMAL = {
    TP40: metrosPorHora.TP40,
    TP25: metrosPorHora.TP25,
    FORRO: metrosPorHora.FORRO,
  };

  const PRODUCAO_COLADA = {
    TP40: metrosPorHoraColadas.TP40,
    TP25: metrosPorHoraColadas.TP25,
    FORRO: metrosPorHoraColadas.FORRO,
  };

  const isColada = maquina.startsWith("COLADA");
  const maquinaBase = isColada ? maquina.replace("COLADA ", "") : maquina;

  const taxa = isColada
    ? PRODUCAO_COLADA[maquinaBase]
    : PRODUCAO_NORMAL[maquinaBase];

  if (!taxa) return;

  const horaMaquina = metros / taxa;
  const horaMontagem = isColada ? 15 : 0; // ✅ 5 dias fixos

  const tempoTotal = horaMaquina + horaMontagem;

  const horasFila = pedidos.reduce((acc, p) => {
    const pMaquina = (p.maquina || '').toUpperCase();
    if (pMaquina === maquina) {
      return acc + (Number(p.tempoTotalProducao) || 0);
    }
    return acc;
  }, 0);

  const diasProducao = Math.ceil((tempoTotal + horasFila) / HORAS_DIA);

  const { dataSugerida } = calcularDataSugerida(formData.dataEntrada, diasProducao);

  setFormData(prev => ({
    ...prev,
    horaMaquina: horaMaquina.toFixed(2),
    horaMontagem: horaMontagem.toFixed(2),
    tempoTotalProducao: tempoTotal.toFixed(2),
    diasSugeridos: diasProducao.toString(),
    dataPrevistaProducao: dataSugerida
  }));
}, [
  formData.totalMetros,
  formData.dataEntrada,
  formData.maquina,
  pedidos,
  metrosPorHora,
  metrosPorHoraColadas
]);




  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pedido || !formData.cliente || !formData.totalMetros) return alert('Preencha os campos obrigatórios.');

    let novosPedidos;
    if (editingPedido) {
      novosPedidos = pedidos.map(p => p.id === editingPedido.id ? { ...formData, id: editingPedido.id } : p);
    } else {
      const novoPedido = { 
        ...formData, 
        id: Date.now().toString(),
        createdAt: new Date().toISOString() 
      };
      novosPedidos = [...pedidos, novoPedido];
    }
    
    setPedidos(novosPedidos);
    salvarPedidos(novosPedidos);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Excluir este pedido?')) {
      const novosPedidos = pedidos.filter(p => p.id !== id);
      setPedidos(novosPedidos);
      salvarPedidos(novosPedidos);
      setSelectedPedidos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedPedidos.size === 0) return;
    if (window.confirm(`Excluir ${selectedPedidos.size} pedidos?`)) {
      const novosPedidos = pedidos.filter(p => !selectedPedidos.has(p.id));
      setPedidos(novosPedidos);
      salvarPedidos(novosPedidos);
      setSelectedPedidos(new Set());
      alert(`${selectedPedidos.size} pedidos excluídos com sucesso.`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPedidos.size === filteredPedidos.length) {
      setSelectedPedidos(new Set());
    } else {
      setSelectedPedidos(new Set(filteredPedidos.map(p => p.id)));
    }
  };

  const toggleSelectPedido = (id) => {
    setSelectedPedidos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const exportarDados = () => {
    const dataToExport = { 
      pedidos, 
      metrosPorHora,
      metrosPorHoraColadas,
      exportDate: new Date().toISOString() 
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mestre-aco-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importarDados = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dados = JSON.parse(event.target.result);
          if (dados.pedidos && Array.isArray(dados.pedidos)) {
            // Adicionar IDs se não existirem
            const pedidosComId = dados.pedidos.map(p => ({
              ...p,
              id: p.id || Date.now().toString() + Math.random()
            }));
            setPedidos(pedidosComId);
            salvarPedidos(pedidosComId);
          }
          if (dados.metrosPorHora) setMetrosPorHora(dados.metrosPorHora);
          if (dados.metrosPorHoraColadas) setMetrosPorHoraColadas(dados.metrosPorHoraColadas);
          alert('Dados importados com sucesso!');
        } catch (error) {
          alert('Erro ao importar arquivo. Verifique o formato.');
        }
      };
      reader.readAsText(file);
    }
  };

  const resetForm = () => {
    setFormData({
      dataEntrada: hojeISO(), pedido: '', cliente: '', vendedor: VENDEDORES[0],
      tipoTelha: TIPOS_TELHAS[0], totalMetros: '', maquina: MAQUINAS[0],
      colagem: 'NENHUMA', tipoEps: TIPOS_EPS[0], tipoFrete: TIPOS_FRETE[0],
      tipoEntrega: 'ENTREGA', cep: '', regiao: '', dataEntregaCliente: '',
      dataPrevistaProducao: '', diasSugeridos: '', horaMaquina: '',
      horaMontagem: '', tempoTotalProducao: ''
    });
    setEditingPedido(null);
    setShowForm(false);
  };

  const handleEdit = (pedido) => {
    setFormData(pedido);
    setEditingPedido(pedido);
    setShowForm(true);
  };

  // Dashboard Stats
  const totalHorasDisponiveisMes = HORAS_MES_POR_MAQUINA * Object.keys(PRODUCAO_MAQUINAS_PADRAO).length;
  const resumoDashboard = useMemo(() => {
    const porMaquina = {};
    Object.keys(PRODUCAO_MAQUINAS_PADRAO).forEach(m => porMaquina[m] = { 
      horaMaquina: 0, 
      horaMontagem: 0,
      horasUsadas: 0, 
      pedidos: [] 
    });
    
    pedidos.forEach(p => {
      const maquinaBase = p.maquina.replace('Colada ', '');
      if (porMaquina[maquinaBase]) {
        const hMaq = parseFloat(p.horaMaquina) || 0;
        const hMont = parseFloat(p.horaMontagem) || 0;
        
        porMaquina[maquinaBase].horaMaquina += hMaq;
        porMaquina[maquinaBase].horaMontagem += hMont;
        porMaquina[maquinaBase].horasUsadas += (hMaq + hMont);
        porMaquina[maquinaBase].pedidos.push(p);
      }
    });
    
    const resultado = {};
    Object.keys(PRODUCAO_MAQUINAS_PADRAO).forEach(m => {
      const capacidade = HORAS_MES_POR_MAQUINA;
      const usadas = porMaquina[m].horasUsadas;
      resultado[m] = { 
        capacidade, 
        usadas, 
        saldo: capacidade - usadas, 
        pedidos: porMaquina[m].pedidos,
        horaMaquina: porMaquina[m].horaMaquina,
        horaMontagem: porMaquina[m].horaMontagem
      };
    });
    return resultado;
  }, [pedidos]);

  const totalHorasUsadas = pedidos.reduce((acc, p) => acc + Number(p.tempoTotalProducao || 0), 0);
  const saldoHoras = totalHorasDisponiveisMes - totalHorasUsadas;

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      const matchCliente = p.cliente.toLowerCase().includes(filters.cliente.toLowerCase());
      const matchPedido = p.pedido.toString().toLowerCase().includes(filters.pedido.toLowerCase());
      const matchVendedor = filters.vendedor === '' || p.vendedor === filters.vendedor;
      const matchMetro = filters.metro === '' || parseFloat(p.totalMetros) >= parseFloat(filters.metro);
      const matchData = filters.dataSugerida === '' || p.dataPrevistaProducao === filters.dataSugerida;
      return matchCliente && matchPedido && matchVendedor && matchMetro && matchData;
    });
  }, [pedidos, filters]);

  const resumo = {
    totalPedidos: pedidos.length,
    totalMetros: pedidos.reduce((acc, p) => acc + (parseFloat(p.totalMetros) || 0), 0).toFixed(2),
    totalHoraMaquina: pedidos.reduce((acc, p) => acc + (parseFloat(p.horaMaquina) || 0), 0).toFixed(2),
    totalHoraMontagem: pedidos.reduce((acc, p) => acc + (parseFloat(p.horaMontagem) || 0), 0).toFixed(2),
    totalProducao: pedidos.reduce((acc, p) => acc + (parseFloat(p.tempoTotalProducao) || 0), 0).toFixed(2)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-inner"><Package className="text-blue-900" size={32} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">MESTRE AÇO SP</h1>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Sistema de Logística Local v10.0</p>
            </div>
          </div>
          <nav className="flex bg-blue-800/50 p-1 rounded-xl backdrop-blur-sm">
            <button onClick={() => setActiveTab('pedidos')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'pedidos' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><Package size={18} /> <span className="font-bold">Pedidos</span></button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><BarChart3 size={18} /> <span className="font-bold">Dashboard</span></button>
            <button onClick={() => setActiveTab('regioes')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'regioes' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><MapPin size={18} /> <span className="font-bold">Regiões</span></button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'config' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><SettingsIcon size={18} /> <span className="font-bold">Config</span></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Carteira de Pedidos</h2>
                {selectedPedidos.size > 0 && (
                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all border border-red-100 font-bold text-sm animate-in fade-in slide-in-from-left-4"
                  >
                    <Trash2 size={16} /> Excluir ({selectedPedidos.size})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md font-bold"><Plus size={20} /> Novo</button>
                <button onClick={exportarDados} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md font-bold"><Download size={20} /> Exportar</button>
                <label className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-colors shadow-md font-bold cursor-pointer">
                  <Upload size={20} /> Importar
                  <input type="file" accept=".json" onChange={importarDados} className="hidden" />
                </label>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Pedidos', value: resumo.totalPedidos, unit: '', color: 'blue' },
                { label: 'Total Metros', value: resumo.totalMetros, unit: 'm', color: 'indigo' },
                { label: 'Horas Máquina', value: resumo.totalHoraMaquina, unit: 'h', color: 'violet' },
                { label: 'Horas Montagem', value: resumo.totalHoraMontagem, unit: 'h', color: 'purple' },
                { label: 'Produção Total', value: resumo.totalProducao, unit: 'h', color: 'blue' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</span>
                  <span className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}{stat.unit}</span>
                </div>
              ))}
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-blue-100 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-blue-900">{editingPedido ? '📝 Editar Pedido' : '🆕 Novo Pedido'}</h3>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Data Entrada</label><input type="date" value={formData.dataEntrada} onChange={(e) => setFormData({ ...formData, dataEntrada: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nº Pedido *</label><input type="text" required value={formData.pedido} onChange={(e) => setFormData({ ...formData, pedido: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: 12345" /></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Cliente *</label><input type="text" required value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nome do cliente" /></div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Vendedor</label>
                    <select value={formData.vendedor} onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-bold text-blue-900">
                      {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo de Entrega</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({...formData, tipoEntrega: 'ENTREGA'})} className={`flex-1 py-2.5 rounded-xl border-2 transition-all font-bold ${formData.tipoEntrega === 'ENTREGA' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>Entrega</button>
                      <button type="button" onClick={() => setFormData({...formData, tipoEntrega: 'RETIRADA', cep: '', regiao: 'RETIRADA NA LOJA'})} className={`flex-1 py-2.5 rounded-xl border-2 transition-all font-bold ${formData.tipoEntrega === 'RETIRADA' ? 'border-amber-600 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400'}`}>Retirada</button>
                    </div>
                  </div>

                  {formData.tipoEntrega === 'ENTREGA' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">CEP</label>
                        {formData.regiao && (
                          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md animate-pulse">
                            {formData.regiao}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={formData.cep} 
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })} 
                          className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                          placeholder="00000-000" 
                        />
                        {loadingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Máquina / Processo</label>
                    <select value={formData.maquina} onChange={(e) => setFormData({ ...formData, maquina: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-bold text-blue-900">
                      {MAQUINAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Total Metros *</label><input type="number" step="0.01" required value={formData.totalMetros} onChange={(e) => setFormData({ ...formData, totalMetros: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0.00" /></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Data Sugerida</label><input type="date" disabled value={formData.dataPrevistaProducao || ''} className="w-full bg-blue-50 border-blue-200 border rounded-xl px-4 py-2.5 font-bold text-blue-700" /></div>
                  
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Hora Máquina</p><p className="text-lg font-black text-blue-900">{formData.horaMaquina || '0.00'}h</p></div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Hora Montagem {formData.maquina?.startsWith('Colada') && <span className="text-amber-600"></span>}</p>
                      <p className="text-lg font-black text-amber-600">{formData.horaMontagem || '0.00'}h</p>
                      {formData.maquina?.startsWith('Colada') && parseFloat(formData.horaMontagem) > 0 && (
                        <p className="text-[8px] text-amber-600 font-bold">= {(parseFloat(formData.horaMontagem) / 8).toFixed(1)} dias</p>
                      )}
                    </div>
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Tempo Total</p><p className="text-lg font-black text-blue-900">{formData.tempoTotalProducao || '0.00'}h</p></div>
                    <div className="text-center border-l-2 border-green-300 bg-white/50 backdrop-blur-sm rounded-lg px-2">
                      <p className="text-[10px] font-bold text-green-600 uppercase">Sugestão Prazo</p>
                      <p className="text-2xl font-black text-green-600">{formData.diasSugeridos || '0.00'}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">dias (total+5 buffer)</p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-600">Cancelar</button>
                    <button type="submit" className="flex items-center gap-2 bg-blue-900 text-white px-8 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-lg font-bold"><Save size={20} /> Salvar</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Filtrar Cliente</label>
                  <input type="text" value={filters.cliente} onChange={(e) => setFilters({...filters, cliente: e.target.value})} className="w-full border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome do cliente..." />
                </div>
                <div className="w-32 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pedido</label>
                  <input type="text" value={filters.pedido} onChange={(e) => setFilters({...filters, pedido: e.target.value})} className="w-full border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nº..." />
                </div>
                <div className="w-48 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vendedor</label>
                  <select value={filters.vendedor} onChange={(e) => setFilters({...filters, vendedor: e.target.value})} className="w-full border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Todos</option>
                    {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="w-32 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mín. Metros</label>
                  <input type="number" value={filters.metro} onChange={(e) => setFilters({...filters, metro: e.target.value})} className="w-full border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                </div>
                <div className="w-40 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data Sugerida</label>
                  <input type="date" value={filters.dataSugerida} onChange={(e) => setFilters({...filters, dataSugerida: e.target.value})} className="w-full border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button onClick={() => setFilters({cliente: '', pedido: '', vendedor: '', metro: '', dataSugerida: ''})} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase">Limpar</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filteredPedidos.length > 0 && selectedPedidos.size === filteredPedidos.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-4 font-bold text-gray-600">Data</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Pedido</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Cliente</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Vendedor</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Máquina</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Metros</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Prazo</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Data Sug.</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPedidos.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-12">
                          <div className="flex flex-col items-center text-gray-400">
                            <Package size={48} className="mb-2 opacity-20" />
                            <p className="text-lg">Nenhum pedido registrado</p>
                            <button onClick={() => setShowForm(true)} className="text-blue-600 font-bold hover:underline mt-1">Clique para começar</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPedidos.map((p) => (
                        <tr key={p.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedPedidos.has(p.id) ? 'bg-blue-50/50' : ''}`}>
                          <td className="px-4 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedPedidos.has(p.id)}
                              onChange={() => toggleSelectPedido(p.id)}
                            />
                          </td>
                          <td className="px-4 py-4 text-gray-500 text-xs">{formatarDataBR(p.dataEntrada)}</td>
                          <td className="px-4 py-4 font-black text-blue-900">{p.pedido}</td>
                          <td className="px-4 py-4 font-medium text-gray-700">{p.cliente}</td>
                          <td className="px-4 py-4 font-bold text-gray-500 text-xs">{p.vendedor}</td>
                          <td className="px-4 py-4">
                            <span className={`font-bold text-xs px-2 py-1 rounded-lg ${p.maquina?.startsWith('Colada') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {p.maquina}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-bold">{parseFloat(p.totalMetros).toFixed(2)}m</td>
                          <td className="px-4 py-4 text-right font-black text-green-700">{parseFloat(p.diasSugeridos || 0).toFixed(1)}d</td>
                          <td className="px-4 py-4 text-right font-bold text-green-700 text-xs">{formatarDataBR(p.dataPrevistaProducao)}</td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={18} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard resumoPorMaquina={resumoDashboard} totalHorasDisponiveis={totalHorasDisponiveisMes} totalHorasUsadas={totalHorasUsadas} saldoHoras={saldoHoras} />
        )}

        {activeTab === 'regioes' && <RelatorioRegioes pedidos={pedidos} />}
        {activeTab === 'config' && <Settings metrosPorHora={metrosPorHora} setMetrosPorHora={setMetrosPorHora} metrosPorHoraColadas={metrosPorHoraColadas} setMetrosPorHoraColadas={setMetrosPorHoraColadas} />}
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Mestre Aço SP - Sistema de Logística Local v10.0
      </footer>
    </div>
  );
};

export default App;
