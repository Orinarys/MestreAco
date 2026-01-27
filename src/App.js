import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, BarChart3, Package, Settings as SettingsIcon, MapPin, Truck, Store, User, Cloud, CloudOff } from 'lucide-react';

// --- INTEGRAÇÃO FIREBASE ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLACFkCeqneQDa24La1PHj92rFYXgTdk4",
  authDomain: "mestreaco.firebaseapp.com",
  projectId: "mestreaco",
  storageBucket: "mestreaco.firebasestorage.app",
  messagingSenderId: "995644947049",
  appId: "1:995644947049:web:35ca0d0bbebcf4a23000f8",
  measurementId: "G-06718TM4QL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ---------------------------

/* ===================== CONFIG PRODUÇÃO ===================== */
const PRODUCAO_MAQUINAS_PADRAO = {
  TP40: 400,
  TP25: 300,
  FORRO: 100,
};

const COLAGEM_PRODUCAO = {
  TP40_30: 90,
  TP25_50: 100,
  FORRO_PIR30: 70,
};

const MAQUINAS = ['TP40', 'TP25', 'FORRO'];
const VENDEDORES = [
  'THIAGO MOTA', 'PRISCILA ARAUJO', 'TAIS ARAUJO', 'MARIA JULIA SOARES',
  'CLAUDINEI CRUZ', 'ALEXANDRE', 'JOSE ADRIANO', 'KEVIN SILVA',
  'EROS RODRIGUES', 'DANILO ANDRADE', 'ANSELMO CUNHA', 'FERNANDA TAVARES'
];

const TIPOS_TELHAS = ['TP40', 'TP25', 'FORRO'];
const TIPOS_EPS = ['EPS', 'PIR', 'PU'];
const TIPOS_FRETE = ['CIF', 'FOB'];

const HORAS_DIA = 10;
const INICIO_JORNADA = 7;
const DIAS_UTEIS_MES = 22;

/* ===================== FUNÇÕES AUX ===================== */
const hojeISO = () => new Date().toISOString().split('T')[0];

const calcularDataSugerida = (dataEntradaISO, tempoTotalHoras) => {
  if (!dataEntradaISO || !tempoTotalHoras) return hojeISO();
  const diasSugeridos = tempoTotalHoras / 2.03; 
  const data = new Date(dataEntradaISO + 'T12:00:00');
  data.setDate(data.getDate() + Math.floor(diasSugeridos));
  return {
    dataSugerida: data.toISOString().split('T')[0],
    diasSugeridos: diasSugeridos.toFixed(2)
  };
};

const formatarDataBR = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
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

const Dashboard = ({ resumoPorMaquina, totalHorasDisponiveis, totalHorasUsadas, saldoHoras }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-900 text-white p-6 rounded-3xl shadow-lg">
        <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Capacidade Total</p>
        <h3 className="text-4xl font-black">{totalHorasDisponiveis}h</h3>
        <p className="text-xs mt-2 text-blue-300">Mês atual (3 máquinas)</p>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Horas Alocadas</p>
        <h3 className="text-4xl font-black text-blue-600">{totalHorasUsadas.toFixed(1)}h</h3>
        <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
          <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (totalHorasUsadas/totalHorasDisponiveis)*100)}%` }}></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Saldo Disponível</p>
        <h3 className={`text-4xl font-black ${saldoHoras < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{saldoHoras.toFixed(1)}h</h3>
        <p className="text-xs mt-2 text-gray-400 font-bold">{saldoHoras < 0 ? 'Capacidade excedida!' : 'Dentro do limite'}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(resumoPorMaquina).map(([maquina, dados]) => (
        <div key={maquina} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-black text-blue-900 mb-4 flex justify-between items-center">
            {maquina} <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{dados.pedidos.length} pedidos</span>
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-400 uppercase">Ocupação</span>
                <span className="text-blue-600">{((dados.usadas / dados.capacidade) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (dados.usadas / dados.capacidade) * 100)}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Usado</p>
                <p className="text-lg font-black text-blue-900">{dados.usadas.toFixed(1)}h</p>
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
);

/* ===================== APP PRINCIPAL ===================== */
const App = () => {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [metrosPorHora, setMetrosPorHora] = useState(PRODUCAO_MAQUINAS_PADRAO);
  const [isOnline, setIsOnline] = useState(false);

  const [editingPedido, setEditingPedido] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

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

  // --- SINCRONIZAÇÃO FIREBASE ---
  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("dataEntrada", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setPedidos(docs);
      setIsOnline(true);
    }, (error) => {
      console.error("Erro no Firebase:", error);
      setIsOnline(false);
    });
    return () => unsubscribe();
  }, []);

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

  // Cálculo de Métricas
  useEffect(() => {
    if (formData.totalMetros && formData.dataEntrada) {
      const metros = parseFloat(formData.totalMetros) || 0;
      const prodHora = metrosPorHora[formData.maquina] || 0;
      const hMaquina = prodHora > 0 ? metros / prodHora : 0;
      const chaveColagem = `${formData.tipoTelha}_${formData.tipoEps.replace('MM', '')}`;
      const prodColagem = COLAGEM_PRODUCAO[chaveColagem] || COLAGEM_PRODUCAO['TP40_30'];
      const hMontagem = prodColagem > 0 ? metros / prodColagem : 0;
      const tempoTotal = hMaquina + hMontagem;
      const { dataSugerida, diasSugeridos } = calcularDataSugerida(formData.dataEntrada, tempoTotal);

      setFormData(prev => ({
        ...prev,
        horaMaquina: hMaquina.toFixed(2),
        horaMontagem: hMontagem.toFixed(2),
        tempoTotalProducao: tempoTotal.toFixed(2),
        dataPrevistaProducao: dataSugerida,
        diasSugeridos: diasSugeridos
      }));
    }
  }, [formData.totalMetros, formData.dataEntrada, formData.maquina, formData.tipoTelha, formData.tipoEps, metrosPorHora]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pedido || !formData.cliente || !formData.totalMetros) return alert('Preencha os campos obrigatórios.');

    try {
      if (editingPedido) {
        const docRef = doc(db, "pedidos", editingPedido.id);
        await updateDoc(docRef, { ...formData });
      } else {
        await addDoc(collection(db, "pedidos"), { ...formData, createdAt: new Date().toISOString() });
      }
      resetForm();
    } catch (error) {
      alert("Erro ao salvar no Firebase: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este pedido permanentemente da nuvem?')) {
      try {
        await deleteDoc(doc(db, "pedidos", id));
      } catch (error) { alert("Erro ao excluir: " + error.message); }
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
  const totalHorasDisponiveisMes = HORAS_DIA * DIAS_UTEIS_MES * MAQUINAS.length;
  const resumoDashboard = useMemo(() => {
    const porMaquina = {};
    MAQUINAS.forEach(m => porMaquina[m] = { horasUsadas: 0, pedidos: [] });
    pedidos.forEach(p => {
      if (porMaquina[p.maquina]) {
        porMaquina[p.maquina].horasUsadas += Number(p.tempoTotalProducao || 0);
        porMaquina[p.maquina].pedidos.push(p);
      }
    });
    const resultado = {};
    MAQUINAS.forEach(m => {
      const capacidade = HORAS_DIA * DIAS_UTEIS_MES;
      const usadas = porMaquina[m].horasUsadas;
      resultado[m] = { capacidade, usadas, saldo: capacidade - usadas, pedidos: porMaquina[m].pedidos };
    });
    return resultado;
  }, [pedidos]);

  const totalHorasUsadas = pedidos.reduce((acc, p) => acc + Number(p.tempoTotalProducao || 0), 0);
  const saldoHoras = totalHorasDisponiveisMes - totalHorasUsadas;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-inner"><Package className="text-blue-900" size={32} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">MESTRE AÇO SP</h1>
              <div className="flex items-center gap-2">
                <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Logística Cloud v6.0</p>
                {isOnline ? <Cloud size={14} className="text-emerald-400" /> : <CloudOff size={14} className="text-red-400" />}
              </div>
            </div>
          </div>
          <nav className="flex bg-blue-800/50 p-1 rounded-xl backdrop-blur-sm">
            <button onClick={() => setActiveTab('pedidos')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'pedidos' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><Package size={18} /> <span className="font-bold">Pedidos</span></button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><BarChart3 size={18} /> <span className="font-bold">Dashboard</span></button>
            <button onClick={() => setActiveTab('regioes')} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'regioes' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:bg-blue-700/50'}`}><MapPin size={18} /> <span className="font-bold">Regiões</span></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Carteira de Pedidos (Nuvem)</h2>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md font-bold"><Plus size={20} /> Novo Pedido</button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-blue-100 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-blue-900">{editingPedido ? '📝 Editar Pedido' : '🆕 Novo Pedido'}</h3>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
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
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">CEP</label>
                      <input type="text" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="00000-000" />
                    </div>
                  )}

                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Máquina</label><select value={formData.maquina} onChange={(e) => setFormData({ ...formData, maquina: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white">{MAQUINAS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Total Metros *</label><input type="number" step="0.01" required value={formData.totalMetros} onChange={(e) => setFormData({ ...formData, totalMetros: e.target.value })} className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0.00" /></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Data Sugerida</label><input type="date" disabled value={formData.dataPrevistaProducao || ''} className="w-full bg-blue-50 border-blue-200 border rounded-xl px-4 py-2.5 font-bold text-blue-700" /></div>
                  
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Hora Máquina</p><p className="text-lg font-black text-blue-900">{formData.horaMaquina || '0.00'}</p></div>
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Hora Montagem</p><p className="text-lg font-black text-blue-900">{formData.horaMontagem || '0.00'}</p></div>
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Tempo Total</p><p className="text-lg font-black text-blue-900">{formData.tempoTotalProducao || '0.00'}</p></div>
                    <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Sugestão Prazo</p><p className="text-lg font-black text-green-600">{formData.diasSugeridos || '0.00'} dias</p></div>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-600">Cancelar</button>
                    <button type="submit" className="flex items-center gap-2 bg-blue-900 text-white px-8 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-lg font-bold"><Save size={20} /> Salvar na Nuvem</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-4 font-bold text-gray-600">Pedido</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Cliente</th>
                      <th className="px-4 py-4 font-bold text-gray-600">Vendedor</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Metros</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-right">Data Sugerida</th>
                      <th className="px-4 py-4 font-bold text-gray-600 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pedidos.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-4 font-black text-blue-900">{p.pedido}</td>
                        <td className="px-4 py-4 font-medium text-gray-700">{p.cliente}</td>
                        <td className="px-4 py-4 font-bold text-gray-500 text-xs">{p.vendedor}</td>
                        <td className="px-4 py-4 text-right font-bold">{parseFloat(p.totalMetros).toFixed(2)}m</td>
                        <td className="px-4 py-4 text-right font-bold text-green-700">{formatarDataBR(p.dataPrevistaProducao)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Mestre Aço SP - Sistema de Logística Cloud
      </footer>
    </div>
  );
};

export default App;
