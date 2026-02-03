import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, BarChart3, Package, Settings as SettingsIcon, MapPin, Truck, Store, User, AlertTriangle, MinusCircle, Calendar } from 'lucide-react';

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
  'EROS RODRIGUES', 'DANILO ANDRADE', 'ANSELMO CUNHA', 'FERNANDA TAVARES', 'ADEMAR AURELIO'
];

const TIPOS_TELHAS = ['SANDUICHE', 'SIMPLES', 'FORRO'];
const TIPOS_EPS = ['30MM', '50MM', 'PIR30MM', 'PIR50MM'];
const TIPOS_FRETE = ['CIF', 'FOB'];
const TIPOS_PINTURA = ['SEM PINTURA', 'PRÉ PINTADA', 'PÓS PINTADA'];

const HORAS_DIA = 8; // 8 horas por dia conforme Excel
const BUFFER_PRAZO_FIXO = 0; // Buffer FIXO de 5 dias (igual ao Excel: =C11+5)
const HORAS_MES_POR_MAQUINA = 800; // Capacidade mensal por máquina

// Estoque inicial baseado no Excel
const ESTOQUE_INICIAL = [
  { id: '1', material: 'EPS TP 40-30mm', estoqueMinimo: 2000, estoqueAtual: 1750, ultimaAtualizacao: new Date().toISOString() },
  { id: '2', material: 'EPS TP 25-30mm', estoqueMinimo: 1500, estoqueAtual: 1328, ultimaAtualizacao: new Date().toISOString() },
  { id: '3', material: 'EPS TP 40-50mm', estoqueMinimo: 1000, estoqueAtual: 587, ultimaAtualizacao: new Date().toISOString() },
  { id: '4', material: 'EPS Forro - 50mm', estoqueMinimo: 0, estoqueAtual: 510, ultimaAtualizacao: new Date().toISOString() },
  { id: '5', material: 'EPS Forro - 30mm', estoqueMinimo: 1000, estoqueAtual: 420, ultimaAtualizacao: new Date().toISOString() },
  { id: '6', material: 'PIR TP 40-30MM', estoqueMinimo: 1500, estoqueAtual: 1536, ultimaAtualizacao: new Date().toISOString() },
  { id: '7', material: 'PIR TP 40-50MM', estoqueMinimo: 1000, estoqueAtual: 680, ultimaAtualizacao: new Date().toISOString() },
  { id: '8', material: 'PIR TP 25-30MM', estoqueMinimo: 0, estoqueAtual: 48, ultimaAtualizacao: new Date().toISOString(), sobEncomenda: true },
];

/* ===================== COMPONENTES DE STATUS ===================== */
const StatusDiario = ({ pedidos = [] }) => {
  const [filtroData, setFiltroData] = React.useState(new Date().toISOString().split('T')[0]);
  const [filtroPrazo, setFiltroPrazo] = React.useState('');

  const dadosFiltrados = React.useMemo(() => {
    const filtrados = pedidos.filter(p => {
      const matchData = !filtroData || p.dataEntrada === filtroData;
      const matchPrazo = !filtroPrazo || p.dataPrevistaProducao === filtroPrazo;
      return matchData && matchPrazo;
    });
    
    const resumo = {
      totalPedidos: filtrados.length,
      clientesUnicos: new Set(filtrados.map(p => p.cliente)).size,
      vendedoresUnicos: new Set(filtrados.map(p => p.vendedor)).size,
      pedidos: filtrados
    };

    return resumo;
  }, [pedidos, filtroData, filtroPrazo]);

  const formatarDataBR = (iso) => {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" /> Status Diário
        </h2>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Entrada</label>
            <input 
              type="date" 
              value={filtroData} 
              onChange={(e) => setFiltroData(e.target.value)}
              className="border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prazo Produção</label>
            <input 
              type="date" 
              value={filtroPrazo} 
              onChange={(e) => setFiltroPrazo(e.target.value)}
              className="border-gray-200 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-green-700"
            />
          </div>
          <button 
            onClick={() => { setFiltroData(''); setFiltroPrazo(''); }}
            className="self-end px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><Package className="text-blue-600" size={24} /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Pedidos</p>
            <p className="text-2xl font-black text-blue-900">{dadosFiltrados.totalPedidos}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl"><User className="text-purple-600" size={24} /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Clientes</p>
            <p className="text-2xl font-black text-purple-900">{dadosFiltrados.clientesUnicos}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl"><User className="text-emerald-600" size={24} /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Vendedores</p>
            <p className="text-2xl font-black text-emerald-900">{dadosFiltrados.vendedoresUnicos}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <Package size={20} /> Listagem de Pedidos
          </h3>
          <span className="text-xs font-bold text-gray-400 uppercase">{dadosFiltrados.pedidos.length} resultados encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider">Nº Pedido</th>
                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase tracking-wider">Data Entrada</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase tracking-wider">Prazo Produção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dadosFiltrados.pedidos.length > 0 ? (
                dadosFiltrados.pedidos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-black text-blue-900">{p.pedido}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">{p.vendedor}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{p.cliente}</td>
                    <td className="px-6 py-4 text-center text-gray-500 font-bold text-xs">
                      {formatarDataBR(p.dataEntrada)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-black text-xs">
                        {formatarDataBR(p.dataPrevistaProducao)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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

const formatarDataHoraBR = (isoString) => {
  if (!isoString) return '';
  const data = new Date(isoString);
  return data.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Funções para gerenciar localStorage
const STORAGE_KEY = 'mestre-aco-pedidos';
const CONFIG_KEY = 'mestre-aco-config';
const ESTOQUE_KEY = 'mestre-aco-estoque';

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

const salvarEstoque = (estoque) => {
  try {
    localStorage.setItem(ESTOQUE_KEY, JSON.stringify(estoque));
    return true;
  } catch (error) {
    console.error('Erro ao salvar estoque:', error);
    return false;
  }
};

const carregarEstoque = () => {
  try {
    const data = localStorage.getItem(ESTOQUE_KEY);
    return data ? JSON.parse(data) : ESTOQUE_INICIAL;
  } catch (error) {
    console.error('Erro ao carregar estoque:', error);
    return ESTOQUE_INICIAL;
  }
};

/* ===================== COMPONENTES AUXILIARES ===================== */

const GerenciadorEstoque = ({ estoque, setEstoque, pedidos }) => {
  const [editandoItem, setEditandoItem] = useState(null);
  const [formEstoque, setFormEstoque] = useState({
    material: '',
    estoqueMinimo: '',
    estoqueAtual: '',
    sobEncomenda: false
  });

  // Calcular estoque considerando consumo dos pedidos
  const estoqueComConsumo = useMemo(() => {
    return estoque.map(item => {
      // Somar consumo de todos os pedidos para este material
      const consumoTotal = pedidos.reduce((acc, pedido) => {
        if (!pedido.materiais) return acc;
        const consumoMaterial = pedido.materiais.find(m => m.materialId === item.id);
        return acc + (consumoMaterial ? parseFloat(consumoMaterial.quantidade) || 0 : 0);
      }, 0);

      const estoqueDisponivel = item.estoqueAtual - consumoTotal;

      return {
        ...item,
        consumoTotal,
        estoqueDisponivel
      };
    });
  }, [estoque, pedidos]);

  const handleSubmitEstoque = (e) => {
    e.preventDefault();
    
    if (!formEstoque.material || !formEstoque.estoqueAtual) {
      return alert('Preencha os campos obrigatórios');
    }

    let novoEstoque;
    if (editandoItem) {
      novoEstoque = estoque.map(item => 
        item.id === editandoItem.id 
          ? { 
              ...item, 
              material: formEstoque.material,
              estoqueMinimo: formEstoque.sobEncomenda ? 0 : parseFloat(formEstoque.estoqueMinimo) || 0,
              estoqueAtual: parseFloat(formEstoque.estoqueAtual) || 0,
              sobEncomenda: formEstoque.sobEncomenda,
              ultimaAtualizacao: new Date().toISOString()
            }
          : item
      );
    } else {
      const novoItem = {
        id: Date.now().toString(),
        material: formEstoque.material,
        estoqueMinimo: formEstoque.sobEncomenda ? 0 : parseFloat(formEstoque.estoqueMinimo) || 0,
        estoqueAtual: parseFloat(formEstoque.estoqueAtual) || 0,
        sobEncomenda: formEstoque.sobEncomenda,
        ultimaAtualizacao: new Date().toISOString()
      };
      novoEstoque = [...estoque, novoItem];
    }

    setEstoque(novoEstoque);
    salvarEstoque(novoEstoque);
    resetFormEstoque();
  };

  const resetFormEstoque = () => {
    setFormEstoque({
      material: '',
      estoqueMinimo: '',
      estoqueAtual: '',
      sobEncomenda: false
    });
    setEditandoItem(null);
  };

  const handleEditarEstoque = (item) => {
    setFormEstoque({
      material: item.material,
      estoqueMinimo: item.estoqueMinimo.toString(),
      estoqueAtual: item.estoqueAtual.toString(),
      sobEncomenda: item.sobEncomenda || false
    });
    setEditandoItem(item);
  };

  const handleExcluirEstoque = (id) => {
    // Verificar se há pedidos usando este material
    const pedidosComMaterial = pedidos.filter(p => 
      p.materiais && p.materiais.some(m => m.materialId === id)
    );

    if (pedidosComMaterial.length > 0) {
      return alert(`Não é possível excluir este material. Ele está sendo usado em ${pedidosComMaterial.length} pedido(s).`);
    }

    if (window.confirm('Deseja excluir este item do estoque?')) {
      const novoEstoque = estoque.filter(item => item.id !== id);
      setEstoque(novoEstoque);
      salvarEstoque(novoEstoque);
    }
  };

  const calcularComplemento = (item) => {
    if (item.sobEncomenda || item.estoqueMinimo === 0) return '-';
    const complemento = item.estoqueMinimo - item.estoqueDisponivel;
    return complemento > 0 ? complemento : 0;
  };

  const getNivelEstoque = (item) => {
    if (item.sobEncomenda) return 'sob-encomenda';
    if (item.estoqueMinimo === 0) return 'sem-minimo';
    
    const percentual = (item.estoqueDisponivel / item.estoqueMinimo) * 100;
    if (percentual >= 80) return 'ok';
    if (percentual >= 50) return 'atencao';
    return 'critico';
  };

  const resumoEstoque = useMemo(() => {
    const criticos = estoqueComConsumo.filter(item => {
      if (item.sobEncomenda || item.estoqueMinimo === 0) return false;
      return item.estoqueDisponivel < item.estoqueMinimo * 0.5;
    });

    const atencao = estoqueComConsumo.filter(item => {
      if (item.sobEncomenda || item.estoqueMinimo === 0) return false;
      const percentual = (item.estoqueDisponivel / item.estoqueMinimo) * 100;
      return percentual >= 50 && percentual < 80;
    });

    const consumoTotal = estoqueComConsumo.reduce((acc, item) => acc + item.consumoTotal, 0);

    return { 
      criticos: criticos.length, 
      atencao: atencao.length, 
      total: estoque.length,
      consumoTotal
    };
  }, [estoqueComConsumo, estoque.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Package className="text-purple-600" /> Controle de Estoque PIR/EPS
      </h2>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest">Críticos</span>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{resumoEstoque.criticos}</p>
          <p className="text-xs text-red-600 font-bold">Abaixo de 50% do mínimo</p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Atenção</span>
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600">{resumoEstoque.atencao}</p>
          <p className="text-xs text-amber-600 font-bold">Entre 50% e 80% do mínimo</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Total Itens</span>
            <Package size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-black text-blue-600">{resumoEstoque.total}</p>
          <p className="text-xs text-blue-600 font-bold">Itens cadastrados</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Consumo Total</span>
            <MinusCircle size={20} className="text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-600">{resumoEstoque.consumoTotal.toFixed(2)}</p>
          <p className="text-xs text-purple-600 font-bold">m² alocados em pedidos</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-purple-900 mb-4">
          {editandoItem ? '📝 Editar Item' : '➕ Adicionar/Atualizar Item'}
        </h3>
        <form onSubmit={handleSubmitEstoque} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Material *</label>
            <input 
              type="text"
              required
              value={formEstoque.material}
              onChange={(e) => setFormEstoque({...formEstoque, material: e.target.value})}
              className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Ex: EPS TP 40-30mm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Estoque Mínimo (m²)</label>
            <input 
              type="number"
              value={formEstoque.estoqueMinimo}
              onChange={(e) => setFormEstoque({...formEstoque, estoqueMinimo: e.target.value})}
              disabled={formEstoque.sobEncomenda}
              className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Estoque Atual (m²) *</label>
            <input 
              type="number"
              required
              value={formEstoque.estoqueAtual}
              onChange={(e) => setFormEstoque({...formEstoque, estoqueAtual: e.target.value})}
              className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Sob Encomenda</label>
            <div className="flex items-center gap-2 h-[42px]">
              <input 
                type="checkbox"
                checked={formEstoque.sobEncomenda}
                onChange={(e) => setFormEstoque({...formEstoque, sobEncomenda: e.target.checked, estoqueMinimo: e.target.checked ? '0' : formEstoque.estoqueMinimo})}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-bold text-gray-600">Sim</span>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t">
            {editandoItem && (
              <button 
                type="button"
                onClick={resetFormEstoque}
                className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-600"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit"
              className="flex items-center gap-2 bg-purple-600 text-white px-8 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-md font-bold"
            >
              <Save size={20} /> {editandoItem ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Estoque */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-600">Material</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Estoque Mínimo</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Estoque Físico</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Consumo Pedidos</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Estoque Disponível</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Solicitar</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Status</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Última Atualização</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {estoqueComConsumo.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col items-center text-gray-400">
                      <Package size={48} className="mb-2 opacity-20" />
                      <p className="text-lg">Nenhum item no estoque</p>
                    </div>
                  </td>
                </tr>
              ) : (
                estoqueComConsumo.map((item) => {
                  const nivel = getNivelEstoque(item);
                  const complemento = calcularComplemento(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-purple-900">{item.material}</td>
                      <td className="px-6 py-4 text-center font-medium">
                        {item.sobEncomenda ? (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">
                            SOB ENCOMENDA
                          </span>
                        ) : item.estoqueMinimo === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          `${item.estoqueMinimo} m²`
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-blue-600">{item.estoqueAtual} m²</td>
                      <td className="px-6 py-4 text-center font-black text-red-600">
                        {item.consumoTotal > 0 ? `${item.consumoTotal.toFixed(2)} m²` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-black text-lg ${item.estoqueDisponivel < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.estoqueDisponivel.toFixed(2)} m²
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof complemento === 'number' && complemento > 0 ? (
                          <span className="font-black text-red-600">{complemento.toFixed(2)} m²</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {nivel === 'critico' && (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">
                            CRÍTICO
                          </span>
                        )}
                        {nivel === 'atencao' && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">
                            ATENÇÃO
                          </span>
                        )}
                        {nivel === 'ok' && (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                            OK
                          </span>
                        )}
                        {(nivel === 'sob-encomenda' || nivel === 'sem-minimo') && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">
                        {formatarDataHoraBR(item.ultimaAtualizacao)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditarEstoque(item)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleExcluirEstoque(item.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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

const Dashboard = ({ resumo }) => {
  const { porMaquina, porPintura } = resumo;
  const totalPedidos = Object.values(porPintura).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" /> Dashboard de Produção
        </h2>
      </div>

      {/* Gráfico de Pintura */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
          <Package size={20} className="text-blue-600" /> Distribuição por Tipo de Pintura
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(porPintura).map(([tipo, qtd]) => {
            const porcentagem = totalPedidos > 0 ? (qtd / totalPedidos) * 100 : 0;
            const cores = {
              'SEM PINTURA': 'bg-gray-400',
              'PRÉ PINTADA': 'bg-blue-500',
              'PÓS PINTADA': 'bg-purple-500'
            };
            return (
              <div key={tipo} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tipo}</p>
                    <p className="text-2xl font-black text-blue-900">{qtd} <span className="text-sm font-bold text-gray-400">pedidos</span></p>
                  </div>
                  <span className="text-sm font-black text-blue-600">{porcentagem.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div 
                    className={`${cores[tipo] || 'bg-blue-500'} h-full transition-all duration-1000`} 
                    style={{ width: `${porcentagem}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h3 className="text-lg font-bold text-blue-900 mt-8 mb-2 flex items-center gap-2">
        <SettingsIcon size={20} className="text-blue-600" /> Detalhamento por Máquina
      </h3>

      {/* Detalhamento por Máquina */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(porMaquina).map(([maquina, dados]) => (
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
              <p className="text-[11px] text-gray-500 mt-1 text-right">
  {Math.ceil((dados.horaMaquina || 0) / HORAS_DIA)} dias usados •{" "}
  {Math.max(0, Math.floor(dados.diasDisponiveis))} dias disponíveis
</p>

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
              <div className="grid grid-cols-2 gap-2 pt-2">
  <div className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
    <p className="text-[10px] font-black text-blue-400 uppercase">Dias Totais</p>
    <p className="text-lg font-black text-blue-900">
      {dados.diasTotais.toFixed(1)}
    </p>
  </div>

  <div className="bg-emerald-50 p-3 rounded-2xl text-center border border-emerald-100">
    <p className="text-[10px] font-black text-emerald-400 uppercase">Dias Disponíveis</p>
    <p className={`text-lg font-black ${dados.diasDisponiveis < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
      {dados.diasDisponiveis.toFixed(1)}
    </p>
  </div>
</div>

              <div className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase">Capacidade</p>
                <p className="text-lg font-black text-blue-900">{dados.capacidade.toFixed(0)}h</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ===================== APP PRINCIPAL ===================== */
const App = () => {
  const [activeTab, setActiveTab] = useState('status-diario');
  const [pedidos, setPedidos] = useState([]);
  const configInicial = carregarConfig();
  const [metrosPorHora, setMetrosPorHora] = useState(configInicial.metrosPorHora);
  const [metrosPorHoraColadas, setMetrosPorHoraColadas] = useState(configInicial.metrosPorHoraColadas);
  const [estoque, setEstoque] = useState([]);
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
    tipoPintura: TIPOS_PINTURA[0],
    tipoEntrega: 'ENTREGA',
    cep: '',
    regiao: '',
    dataEntregaCliente: '',
    dataPrevistaProducao: '',
    diasSugeridos: '',
    horaMaquina: '',
    horaMontagem: '',
    tempoTotalProducao: '',
    materiais: [] // Array de {materialId, materialNome, quantidade}
  });

  // Estado para gerenciar materiais no formulário
  const [materiaisForm, setMateriaisForm] = useState([]);

  // Carregar pedidos e estoque do localStorage na inicialização
  useEffect(() => {
    const pedidosCarregados = carregarPedidos();
    setPedidos(pedidosCarregados);
    
    const estoqueCarregado = carregarEstoque();
    setEstoque(estoqueCarregado);
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
    if (!formData.dataEntrada) return;

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
    const horaMontagem = isColada ? 15 : 0;

    const tempoTotal = horaMaquina + horaMontagem;

    const horasFila = pedidos.reduce((acc, p) => {
      const pMaquina = (p.maquina || '').toUpperCase();
      if (pMaquina === maquina) {
        return acc + (Number(p.tempoTotalProducao) || 0);
      }
      return acc;
    }, 0);

    let diasProducao = Math.ceil((tempoTotal + horasFila) / HORAS_DIA);
    
    // Acréscimo de 5 dias para PÓS PINTADA
    if (formData.tipoPintura === 'PÓS PINTADA') {
      diasProducao += 5;
    }

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
    formData.tipoPintura,
    pedidos,
    metrosPorHora,
    metrosPorHoraColadas
  ]);

  const adicionarMaterial = () => {
    if (estoque.length === 0) {
      return alert('Cadastre materiais no estoque primeiro!');
    }
    setMateriaisForm([...materiaisForm, { materialId: '', materialNome: '', quantidade: '' }]);
  };

  const removerMaterial = (index) => {
    setMateriaisForm(materiaisForm.filter((_, i) => i !== index));
  };

  const atualizarMaterial = (index, campo, valor) => {
    const novos = [...materiaisForm];
    if (campo === 'materialId') {
      const material = estoque.find(e => e.id === valor);
      novos[index] = {
        ...novos[index],
        materialId: valor,
        materialNome: material ? material.material : ''
      };
    } else {
      novos[index][campo] = valor;
    }
    setMateriaisForm(novos);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pedido || !formData.cliente || !formData.totalMetros) {
      return alert('Preencha os campos obrigatórios.');
    }

    // Validar materiais
    const materiaisValidos = materiaisForm.filter(m => m.materialId && m.quantidade);

    let novosPedidos;
    const dadosPedido = {
      ...formData,
      materiais: materiaisValidos
    };

    if (editingPedido) {
      novosPedidos = pedidos.map(p => p.id === editingPedido.id ? { ...dadosPedido, id: editingPedido.id } : p);
    } else {
      const novoPedido = { 
        ...dadosPedido, 
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
      estoque,
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
            const pedidosComId = dados.pedidos.map(p => ({
              ...p,
              id: p.id || Date.now().toString() + Math.random()
            }));
            setPedidos(pedidosComId);
            salvarPedidos(pedidosComId);
          }
          if (dados.metrosPorHora) setMetrosPorHora(dados.metrosPorHora);
          if (dados.metrosPorHoraColadas) setMetrosPorHoraColadas(dados.metrosPorHoraColadas);
          if (dados.estoque && Array.isArray(dados.estoque)) {
            setEstoque(dados.estoque);
            salvarEstoque(dados.estoque);
          }
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
      tipoPintura: TIPOS_PINTURA[0],
      tipoEntrega: 'ENTREGA', cep: '', regiao: '', dataEntregaCliente: '',
      dataPrevistaProducao: '', diasSugeridos: '', horaMaquina: '',
      horaMontagem: '', tempoTotalProducao: '', materiais: []
    });
    setMateriaisForm([]);
    setEditingPedido(null);
    setShowForm(false);
  };

  const handleEdit = (pedido) => {
    setFormData(pedido);
    setMateriaisForm(pedido.materiais || []);
    setEditingPedido(pedido);
    setShowForm(true);
  };

  // Dashboard Stats
  const resumoDashboard = useMemo(() => {
    const porMaquina = {};
    Object.keys(PRODUCAO_MAQUINAS_PADRAO).forEach(m => porMaquina[m] = { 
      horaMaquina: 0, 
      horaMontagem: 0,
      horasUsadas: 0, 
      pedidos: [] 
    });
    
	    const porPintura = {};
	    TIPOS_PINTURA.forEach(p => porPintura[p] = 0);

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
	      
	      const pintura = p.tipoPintura || 'SEM PINTURA';
	      if (porPintura.hasOwnProperty(pintura)) {
	        porPintura[pintura] += 1;
	      }
	    });
    
const resultado = {};
Object.keys(PRODUCAO_MAQUINAS_PADRAO).forEach(m => {
  const capacidadeHoras = HORAS_MES_POR_MAQUINA; // ex: 800h/mês
  const usadasHoras = porMaquina[m].horasUsadas;

  const diasTotais = capacidadeHoras / HORAS_DIA;     // ex: 800 / 8 = 100 dias
  const diasUsados = usadasHoras / HORAS_DIA;
  const diasDisponiveis = diasTotais - diasUsados;

  resultado[m] = { 
    capacidade: capacidadeHoras, 
    usadas: usadasHoras, 
    saldo: capacidadeHoras - usadasHoras, 
    pedidos: porMaquina[m].pedidos,
    horaMaquina: porMaquina[m].horaMaquina,
    horaMontagem: porMaquina[m].horaMontagem,

	    // 👇 NOVOS CAMPOS
	    diasTotais,
	    diasDisponiveis,
	    diasUsados
	  };
	});
	
	    return { porMaquina: resultado, porPintura };
	  }, [pedidos]);

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
              <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Sistema de Logística Local v12.0</p>
            </div>
          </div>
          <nav className="flex bg-blue-800/50 p-1 rounded-xl backdrop-blur-sm flex-wrap">
            <button onClick={() => setActiveTab('status-diario')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'status-diario' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><BarChart3 size={18} /> <span className="font-bold">Status Diário</span></button>
            <button onClick={() => setActiveTab('pedidos')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'pedidos' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><Package size={18} /> <span className="font-bold">Pedidos</span></button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><BarChart3 size={18} /> <span className="font-bold">Dashboard</span></button>
            <button onClick={() => setActiveTab('estoque')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'estoque' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><Package size={18} /> <span className="font-bold">Estoque</span></button>
            <button onClick={() => setActiveTab('regioes')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'regioes' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><MapPin size={18} /> <span className="font-bold">Regiões</span></button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'config' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><SettingsIcon size={18} /> <span className="font-bold">Config</span></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'status-diario' && <StatusDiario pedidos={pedidos} />}
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

	                    <div className="space-y-1">
	                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo de Pintura</label>
	                      <select value={formData.tipoPintura} onChange={(e) => setFormData({ ...formData, tipoPintura: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-bold text-blue-900">
	                        {TIPOS_PINTURA.map(p => <option key={p} value={p}>{p}</option>)}
	                      </select>
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
                  </div>

                  {/* Seção de Materiais */}
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-purple-900">📦 Consumo de Materiais (PIR/EPS)</h4>
                      <button 
                        type="button"
                        onClick={adicionarMaterial}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm"
                      >
                        <Plus size={16} /> Adicionar Material
                      </button>
                    </div>

                    {materiaisForm.length === 0 ? (
                      <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-8 text-center">
                        <Package size={48} className="mx-auto mb-2 text-purple-300" />
                        <p className="text-purple-600 font-bold">Nenhum material adicionado</p>
                        <p className="text-purple-500 text-sm">Clique em "Adicionar Material" para incluir consumo de estoque</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {materiaisForm.map((mat, index) => (
                          <div key={index} className="flex gap-3 items-end bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="flex-1 space-y-1">
                              <label className="text-xs font-bold text-purple-600 uppercase ml-1">Material</label>
                              <select 
                                value={mat.materialId}
                                onChange={(e) => atualizarMaterial(index, 'materialId', e.target.value)}
                                className="w-full border-purple-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold text-purple-900"
                              >
                                <option value="">Selecione...</option>
                                {estoque.map(e => (
                                  <option key={e.id} value={e.id}>{e.material}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-48 space-y-1">
                              <label className="text-xs font-bold text-purple-600 uppercase ml-1">Quantidade (m²)</label>
                              <input 
                                type="number"
                                step="0.01"
                                value={mat.quantidade}
                                onChange={(e) => atualizarMaterial(index, 'quantidade', e.target.value)}
                                className="w-full border-purple-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="0.00"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removerMaterial(index)}
                              className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
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
                      <p className="text-[8px] text-gray-400 font-bold uppercase">
                        dias (total+5 buffer{formData.tipoPintura === 'PÓS PINTADA' ? ' + 5 pintura' : ''})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
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
                      <th className="px-4 py-4 font-bold text-gray-600 text-center">Materiais</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Prazo</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Data Sug.</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPedidos.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center py-12">
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
                          <td className="px-4 py-4 text-center">
                            {p.materiais && p.materiais.length > 0 ? (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">
                                {p.materiais.length} item{p.materiais.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
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
          <Dashboard resumo={resumoDashboard} />
        )}

        {activeTab === 'estoque' && (
          <GerenciadorEstoque estoque={estoque} setEstoque={setEstoque} pedidos={pedidos} />
        )}

        {activeTab === 'regioes' && <RelatorioRegioes pedidos={pedidos} />}
        {activeTab === 'config' && <Settings metrosPorHora={metrosPorHora} setMetrosPorHora={setMetrosPorHora} metrosPorHoraColadas={metrosPorHoraColadas} setMetrosPorHoraColadas={setMetrosPorHoraColadas} />}
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Mestre Aço SP - Sistema de Logística Local v12.0
      </footer>
    </div>
  );
};

export default App;
