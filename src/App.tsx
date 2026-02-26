import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShoppingBasket, 
  History as HistoryIcon, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  List, 
  Settings, 
  Check,
  Trash2,
  Calendar,
  Store,
  X,
  Camera,
  Tag,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Category = 'MANAV' | 'SÜT' | 'ET' | 'KİLER' | 'DİĞER';

interface GroceryItem {
  id: string;
  name: string;
  category: Category;
  market: string;
  quantity: number;
  completed: boolean;
}

interface HistoryItem {
  name: string;
  market: string;
}

interface HistoryTrip {
  id: string;
  store: string;
  date: string;
  itemCount: number;
  detailedItems: HistoryItem[];
}

interface ReceiptPhoto {
  id: string;
  date: string;
  imageUrl: string;
}

export default function App() {
  const [view, setView] = useState<'list' | 'history' | 'receipts' | 'settings'>('list');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [history, setHistory] = useState<HistoryTrip[]>([]);
  const [markets, setMarkets] = useState(['Genel', 'Migros', 'BİM', 'A101', 'Şok', 'Kasap']);
  const [receipts, setReceipts] = useState<ReceiptPhoto[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [newItemName, setNewItemName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('Genel');
  const [newMarketName, setNewMarketName] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const activeItems = useMemo(() => items.filter(i => !i.completed), [items]);
  const completedItems = useMemo(() => items.filter(i => i.completed), [items]);
  const categories = useMemo(() => Array.from(new Set(activeItems.map(i => i.category))).sort(), [activeItems]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([{ id: Date.now().toString(), name: newItemName, category: 'DİĞER', market: selectedMarket, quantity: 1, completed: false }, ...items]);
    setNewItemName('');
  };

  const finishShopping = () => {
    if (completedItems.length === 0) return;
    const newTrip: HistoryTrip = {
      id: Date.now().toString(),
      store: new Set(completedItems.map(i => i.market)).size > 1 ? "Çoklu Market" : completedItems[0].market,
      date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      itemCount: completedItems.length,
      detailedItems: completedItems.map(i => ({ name: i.name, market: i.market }))
    };
    setHistory([newTrip, ...history]);
    setItems(items.filter(i => !i.completed));
    setView('history');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex justify-center transition-colors duration-300">
      <div className="w-full max-w-md relative flex flex-col h-screen overflow-hidden border-x border-black/5 dark:border-white/5 shadow-2xl">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-inherit/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="text-[var(--primary-color)]" size={28} />
              <h1 className="text-2xl font-bold tracking-tight">
                {view === 'list' ? 'Listem' : view === 'history' ? 'Geçmiş' : view === 'receipts' ? 'Fişlerim' : 'Ayarlar'}
              </h1>
            </div>
            <div className="opacity-60 text-sm font-medium flex items-center gap-1">
              <Calendar size={14} className="text-[var(--primary-color)]" /> {today}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 px-6">
          <AnimatePresence mode="wait">
            
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <form onSubmit={addItem} className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-color)]" size={20} />
                    <input 
                      type="text" value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Ürün adı..."
                      className="w-full h-14 pl-12 pr-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none outline-none focus:ring-1 focus:ring-primary/30 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <select 
                      value={selectedMarket}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      className="h-14 px-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none outline-none text-xs font-bold text-[var(--primary-color)] appearance-none min-w-[90px] dark:text-[#13ec5b]"
                    >
                      {markets.map(m => <option key={m} value={m} className="bg-[#1a241d] text-[#f1f5f9]">{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                </form>

                {categories.map(cat => (
                  <section key={cat} className="mt-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{cat}</h2>
                    <div className="space-y-3">
                      {activeItems.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="flex items-center justify-between card-bg p-4 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, completed: true} : i))} className="w-6 h-6 rounded-full border-2 border-primary/30 transition-colors" />
                            <div>
                              <p className="font-semibold text-sm">{item.name}</p>
                              <p className="text-[9px] text-[var(--primary-color)] font-bold flex items-center gap-1 uppercase tracking-wider"><Store size={9} /> {item.market}</p>
                            </div>
                          </div>
                          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="opacity-30 hover:text-red-500 hover:opacity-100 transition-all"><X size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {completedItems.length > 0 && (
                  <section className="mt-10 pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} className="flex items-center gap-2 opacity-40 text-[10px] font-black uppercase tracking-wider">
                        ALINANLAR ({completedItems.length}) {isCompletedExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                      <button onClick={finishShopping} className="bg-[#13ec5b] dark:bg-[#13ec5b] text-black px-4 py-1.5 rounded-xl text-[10px] font-black hover:scale-105 transition-transform shadow-lg shadow-primary/20">ALIŞVERİŞİ BİTİR</button>
                    </div>
                    {isCompletedExpanded && (
                      <div className="space-y-2 opacity-60">
                        {completedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, completed: false} : i))} className="w-5 h-5 rounded-full bg-[#13ec5b] flex items-center justify-center text-black"><Check size={12} strokeWidth={4}/></button>
                              <span className="line-through text-xs font-medium">{item.name}</span>
                            </div>
                            <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="opacity-40"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            )}

            {view === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
                {history.map(trip => (
                  <div key={trip.id} className="card-bg rounded-2xl overflow-hidden transition-all">
                    <div onClick={() => setExpandedHistoryId(expandedHistoryId === trip.id ? null : trip.id)} className="p-5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-[var(--primary-color)]"><Store size={14} /><span className="text-xs font-black uppercase tracking-widest">{trip.store}</span></div>
                        {expandedHistoryId === trip.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{trip.itemCount} Ürün Alındı</h3>
                      <p className="text-[10px] opacity-40 font-bold">{trip.date}</p>
                    </div>
                    <AnimatePresence>
                      {expandedHistoryId === trip.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 px-5 py-4 overflow-hidden">
                          <div className="space-y-3">
                            {trip.detailedItems.map((detail, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs font-medium">
                                <div className="flex items-center gap-2"><Tag size={12} className="text-[var(--primary-color)] opacity-50" /><span>{detail.name}</span></div>
                                <span className="text-[9px] bg-primary/10 text-[var(--primary-color)] px-2 py-0.5 rounded-md font-bold uppercase">{detail.market}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}

            {view === 'receipts' && (
              <motion.div key="receipts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-[var(--primary-color)] bg-primary/5">
                  <Camera size={32} /> <span className="text-xs font-black">FİŞ EKLE</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setReceipts([{ id: Date.now().toString(), date: new Date().toLocaleString('tr-TR'), imageUrl: reader.result as string }, ...receipts]);
                    reader.readAsDataURL(file);
                  }
                }} accept="image/*" className="hidden" />
                <div className="grid grid-cols-2 gap-4">
                  {receipts.map(r => (
                    <div key={r.id} className="card-bg rounded-2xl overflow-hidden group relative">
                      <img src={r.imageUrl} className="h-40 w-full object-cover opacity-80" alt="Fiş" />
                      <button onClick={() => setReceipts(receipts.filter(x => x.id !== r.id))} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-2">
                <section>
                  <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Görünüm</h2>
                  <div className="card-bg p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon size={20} className="text-[#13ec5b]" /> : <Sun size={20} className="text-orange-500" />}
                      <span className="text-sm font-bold">{isDarkMode ? 'Karanlık Mod' : 'Açık Mod'}</span>
                    </div>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[#13ec5b]' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${isDarkMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Market Yönetimi</h2>
                  <div className="flex gap-2 mb-4">
                    <input type="text" value={newMarketName} onChange={(e) => setNewMarketName(e.target.value)} placeholder="Yeni market..." className="flex-1 h-12 px-4 bg-black/5 dark:bg-white/5 rounded-xl border-none outline-none text-sm" />
                    <button onClick={() => { if(newMarketName.trim()) { setMarkets([...markets, newMarketName]); setNewMarketName(''); } }} className="bg-[#13ec5b] text-black px-4 rounded-xl font-black text-xs">EKLE</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {markets.map(m => (
                      <div key={m} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold">{m}</span>
                        {m !== 'Genel' && <button onClick={() => setMarkets(markets.filter(item => item !== m))} className="opacity-30 hover:text-red-500 hover:opacity-100"><X size={14}/></button>}
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <nav className="absolute bottom-0 left-0 right-0 bg-inherit/40 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pb-10 pt-4 px-6 flex justify-around">
          <NavButton active={view === 'list'} icon={<List size={22}/>} label="LİSTE" onClick={() => setView('list')} />
          <NavButton active={view === 'receipts'} icon={<Camera size={22}/>} label="FİŞLER" onClick={() => setView('receipts')} />
          <NavButton active={view === 'history'} icon={<HistoryIcon size={22}/>} label="GEÇMİŞ" onClick={() => setView('history')} />
          <NavButton active={view === 'settings'} icon={<Settings size={22}/>} label="AYARLAR" onClick={() => setView('settings')} />
        </nav>
      </div>
    </div>
  );
}

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[var(--primary-color)] scale-110' : 'opacity-40 hover:opacity-70'}`}>
    {icon}
    <span className="text-[8px] font-black tracking-widest">{label}</span>
  </button>
);