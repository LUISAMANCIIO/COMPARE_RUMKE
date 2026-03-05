
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { INITIAL_PARAMETERS, REFERENCE_TABLE } from './constants';
import { AnalysisRow } from './types';
import { findClosestReference, isWithinRange, parseInput } from './utils/calculations';
import { 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Microscope,
  Info,
  Download,
  User,
  Hash,
  Clock,
  ChevronRight,
  FlaskConical
} from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const App: React.FC = () => {
  const [rows, setRows] = useState<AnalysisRow[]>(
    INITIAL_PARAMETERS.map(p => ({
      id: p.toLowerCase(),
      parameter: p,
      analyst1: '',
      analyst2: '',
      difference: 0,
      referenceRangeStr: '-',
      isApproved: null
    }))
  );

  const [sampleProtocol, setSampleProtocol] = useState('');
  const [analyst1Name, setAnalyst1Name] = useState('');
  const [analyst2Name, setAnalyst2Name] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR') + ' ' + 
                       now.toLocaleTimeString('pt-BR', { 
                         hour: '2-digit', 
                         minute: '2-digit', 
                         second: '2-digit' 
                       });
      setCurrentDateTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totals = useMemo(() => {
    const a1 = rows.reduce((acc, row) => acc + (typeof row.analyst1 === 'number' ? row.analyst1 : 0), 0);
    const a2 = rows.reduce((acc, row) => acc + (typeof row.analyst2 === 'number' ? row.analyst2 : 0), 0);
    return { a1, a2 };
  }, [rows]);

  const handleInputChange = (id: string, field: 'analyst1' | 'analyst2', value: string) => {
    const numericValue = parseInput(value);
    
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: numericValue };
        
        if (typeof updatedRow.analyst1 === 'number' && typeof updatedRow.analyst2 === 'number') {
          updatedRow.difference = Math.abs(updatedRow.analyst1 - updatedRow.analyst2);
          const ref = findClosestReference(updatedRow.analyst1);
          updatedRow.referenceRangeStr = ref.rawLabel;
          updatedRow.isApproved = isWithinRange(updatedRow.analyst2, ref.min, ref.max);
        } else {
          updatedRow.difference = 0;
          updatedRow.referenceRangeStr = '-';
          updatedRow.isApproved = null;
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const resetAll = () => {
    if(!confirm("Deseja limpar todos os dados da análise?")) return;
    setRows(INITIAL_PARAMETERS.map(p => ({
      id: p.toLowerCase(),
      parameter: p,
      analyst1: '',
      analyst2: '',
      difference: 0,
      referenceRangeStr: '-',
      isApproved: null
    })));
    setSampleProtocol('');
    setAnalyst1Name('');
    setAnalyst2Name('');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(input => {
            const span = clonedDoc.createElement('span');
            span.innerText = input.value || ' ';
            span.className = input.className;
            span.style.display = 'flex';
            span.style.alignItems = 'center';
            span.style.justifyContent = 'center';
            span.style.height = '42px';
            span.style.background = '#f0f7ff';
            span.style.color = '#1e40af';
            span.style.border = '1px solid #dbeafe';
            span.style.borderRadius = '8px';
            span.style.fontWeight = '700';
            
            if (input.parentNode) {
              input.parentNode.replaceChild(span, input);
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`SystemRumke_${sampleProtocol || 'Resultado'}.pdf`);
    } catch (error) {
      console.error("Erro PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isGlobalSuccess = rows.every(r => r.isApproved !== false) && totals.a1 === 100 && totals.a2 === 100;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-12 text-slate-700 font-sans">
      {/* Header com Azul Suave e Branco */}
      <header className="bg-white/90 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">System<span className="text-blue-500">Rumke</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-blue-600/70 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
               <Clock className="w-3.5 h-3.5" />
               {currentDateTime}
             </div>
             <button onClick={resetAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Reiniciar">
               <RotateCcw className="w-5 h-5" />
             </button>
             <button 
               onClick={handleExportPDF} 
               disabled={isExporting} 
               className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
             >
               <Download className="w-4 h-4" /> {isExporting ? 'Processando...' : 'Exportar PDF'}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Área Central (Exportada no PDF) */}
        <div className="lg:col-span-9 space-y-6" ref={reportRef}>
          
          {/* Card de Identificação - Branco Clean */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Microscope className="w-24 h-24 text-blue-100" />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> Dados do Protocolo
              </h3>
              <div className="text-[10px] font-bold text-slate-300">
                {currentDateTime}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Protocolo
                </label>
                <input 
                  type="text" 
                  value={sampleProtocol}
                  onChange={(e) => setSampleProtocol(e.target.value)}
                  placeholder="---"
                  className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none font-bold text-blue-900 text-sm text-center transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Analista 01
                </label>
                <input 
                  type="text" 
                  value={analyst1Name}
                  onChange={(e) => setAnalyst1Name(e.target.value)}
                  placeholder="Analista A"
                  className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none font-semibold text-slate-700 text-sm text-center transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Analista 02
                </label>
                <input 
                  type="text" 
                  value={analyst2Name}
                  onChange={(e) => setAnalyst2Name(e.target.value)}
                  placeholder="Analista B"
                  className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none font-semibold text-slate-700 text-sm text-center transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card da Tabela - Estilo Lab Soft */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Painel Hematológico</span>
              </div>
              <div className="flex gap-3">
                <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${totals.a1 === 100 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-400'}`}>A1: {totals.a1}%</div>
                <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${totals.a2 === 100 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-400'}`}>A2: {totals.a2}%</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                    <th className="px-6 py-5">Parâmetros</th>
                    <th className="px-4 py-5 text-center">Analista 01</th>
                    <th className="px-4 py-5 text-center">Analista 02</th>
                    <th className="px-4 py-5 text-center">Dif.</th>
                    <th className="px-4 py-5 text-center">Referência (A1)</th>
                    <th className="px-4 py-5 text-center">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-600 text-sm">{row.parameter}</td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number" 
                          value={row.analyst1} 
                          onChange={(e) => handleInputChange(row.id, 'analyst1', e.target.value)} 
                          className="w-16 h-10 bg-blue-50/50 text-blue-900 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none font-bold text-center text-base" 
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number" 
                          value={row.analyst2} 
                          onChange={(e) => handleInputChange(row.id, 'analyst2', e.target.value)} 
                          className="w-16 h-10 bg-blue-50/50 text-blue-900 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none font-bold text-center text-base" 
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-blue-300">{row.difference || '0'}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-black ${row.isApproved === false ? 'text-red-400' : 'text-slate-400'}`}>
                          {row.referenceRangeStr}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center items-center">
                          {row.isApproved === true && (
                            <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
                            </div>
                          )}
                          {row.isApproved === false && (
                            <div className="bg-red-50 text-red-500 text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-red-100">
                              <AlertCircle className="w-3.5 h-3.5" /> Reprovado
                            </div>
                          )}
                          {row.isApproved === null && (
                            <span className="text-slate-200 text-[9px] font-bold uppercase tracking-widest italic">--</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-600 text-white font-bold border-t-2 border-white">
                    <td className="px-6 py-6 text-[10px] uppercase tracking-widest opacity-80">Soma de Controle</td>
                    <td className={`px-4 py-6 text-center text-2xl font-black ${totals.a1 === 100 ? 'text-white' : 'text-blue-200'}`}>{totals.a1}%</td>
                    <td className={`px-4 py-6 text-center text-2xl font-black ${totals.a2 === 100 ? 'text-white' : 'text-blue-200'}`}>{totals.a2}%</td>
                    <td colSpan={3} className="px-6 py-6 text-right">
                      {isGlobalSuccess ? (
                        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-xs font-bold border border-white/20">
                          <CheckCircle2 className="w-4 h-4" /> Validado
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest text-blue-100 font-black">Aguardando fechamento de 100%</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Rümke (Não sai no PDF) */}
        <div className="lg:col-span-3 space-y-6 print:hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5">
            <h3 className="text-[10px] font-black text-slate-400 mb-5 uppercase tracking-widest border-b border-blue-50 pb-3 flex items-center justify-between">
              Tabela Rümke <ChevronRight className="w-3 h-3" />
            </h3>
            
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {REFERENCE_TABLE.map((ref) => {
                const isActive = rows.some(r => r.analyst1 === ref.baseValue);
                return (
                  <div 
                    key={ref.baseValue} 
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border transition-all ${
                      isActive 
                      ? 'bg-blue-50 text-blue-600 font-bold border-blue-200' 
                      : 'text-slate-500 bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-6">{ref.baseValue}</span>
                    <span className="opacity-60 text-[10px] font-mono">{ref.rawLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
             <div className="flex flex-col gap-3">
               <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center">
                 <Info className="w-5 h-5 text-blue-400" />
               </div>
               <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Regra de Validação</h4>
               <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                 O sistema utiliza a base do Analista 01 como âncora para definir o desvio padrão aceitável do Analista 02.
               </p>
             </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.4em] print:hidden">
        Laboratorios Reunidos da Amazônia
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 10px; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        table { border-spacing: 0; width: 100%; table-layout: fixed; }
        td, th { text-align: center !important; vertical-align: middle !important; }
        td:first-child, th:first-child { text-align: left !important; width: 180px !important; }
        input { text-align: center !important; }
      `}</style>
    </div>
  );
};

export default App;
