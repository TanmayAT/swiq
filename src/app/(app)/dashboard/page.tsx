'use client';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, ArrowUpRight, ArrowDownRight, Clock, ChevronRight } from 'lucide-react';

interface Analytics {
  todayRevenue: number; todayOrders: number; totalRevenue: number; totalOrders: number;
  repeatCustomers: number; totalCustomers: number; avgOrder: number;
  hourly: { hour: string; revenue: number; orders: number }[];
  weekly: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}

const W: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
const TH: React.CSSProperties = { textAlign: 'left', padding: '10px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5', whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '11px 18px', fontSize: 12, color: '#374151', borderBottom: '1px solid #f0fdf4', verticalAlign: 'middle' };
const PIE_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#ea580c', '#ca8a04'];

const TT = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 14px', fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#9ca3af', marginBottom: 3 }}>{label}</div>
      <div style={{ color: '#16a34a', fontWeight: 700 }}>₹{payload[0].value.toLocaleString('en-IN')}</div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [chartMode, setChartMode] = useState<'weekly' | 'hourly'>('weekly');
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setData); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading dashboard…</div>
    </div>
  );

  const kpis = [
    { label: "Today's Revenue", value: `₹${data.todayRevenue.toLocaleString('en-IN')}`, sub: `${data.todayOrders} orders`, up: true,  pct: '+12%', icon: TrendingUp,  color: '#16a34a', bg: '#dcfce7' },
    { label: 'Total Revenue',   value: `₹${data.totalRevenue.toLocaleString('en-IN')}`,  sub: 'All time',         up: true,  pct: '+8.3%', icon: TrendingUp,  color: '#2563eb', bg: '#dbeafe' },
    { label: 'Repeat Customers',value: `${data.repeatCustomers}`,                         sub: `of ${data.totalCustomers}`,   up: true,  pct: '+5',    icon: Users,       color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Avg Order Value', value: `₹${data.avgOrder}`,                               sub: 'Per transaction', up: false, pct: '-2%',   icon: ShoppingBag, color: '#ea580c', bg: '#ffedd5' },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData: any[] = chartMode === 'weekly' ? data.weekly : data.hourly;
  const chartKey = chartMode === 'weekly' ? 'date' : 'hour';
  const pieData = data.topItems.map((it, i) => ({ name: it.name, value: it.revenue, color: PIE_COLORS[i] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        .dash-kpi   { grid-template-columns: repeat(4, 1fr); }
        .dash-row1  { grid-template-columns: 1fr 300px; }
        .dash-row2  { grid-template-columns: 1fr 250px; }
        .dash-val   { font-size: 26px; }
        .dash-tbl   { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 880px) {
          .dash-kpi  { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .dash-row1 { grid-template-columns: 1fr !important; }
          .dash-row2 { grid-template-columns: 1fr !important; }
          .dash-val  { font-size: 20px !important; }
          .dash-kpi-card { padding: 14px 14px !important; }
        }
      `}</style>

      {/* KPI cards */}
      <div className="dash-kpi" style={{ display: 'grid', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.label} className="dash-kpi-card" style={{ ...W, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <div className="dash-val" style={{ fontWeight: 800, color: '#0f2817', letterSpacing: -0.6, marginBottom: 8 }}>{k.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{k.sub}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: k.up ? '#16a34a' : '#dc2626' }}>
                {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{k.pct}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Pie */}
      <div className="dash-row1" style={{ display: 'grid', gap: 14 }}>
        <div style={W}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #d1fae5' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2817' }}>Revenue Overview</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                ₹{data.totalRevenue.toLocaleString('en-IN')} total · <span style={{ color: '#16a34a', fontWeight: 600 }}>+12.4%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['weekly', 'hourly'] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)} style={{
                  fontSize: 11, padding: '6px 14px', borderRadius: 7, fontWeight: 700, cursor: 'pointer',
                  background: chartMode === m ? '#16a34a' : '#f0fdf4',
                  color: chartMode === m ? '#fff' : '#9ca3af',
                  border: `1px solid ${chartMode === m ? '#16a34a' : '#d1fae5'}`,
                }}>
                  {m === 'weekly' ? '7 Days' : 'Hourly'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '20px 16px 12px', background: '#ffffff' }}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                <XAxis dataKey={chartKey} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} activeDot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut */}
        <div style={W}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2817' }}>Top Items</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: '#dcfce7', color: '#16a34a' }}>By Revenue</span>
          </div>
          <div style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '0 0 12px 12px' }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} dataKey="value" stroke="none" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
              {data.topItems.map((it, i) => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151' }}>{it.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2817' }}>₹{it.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders + bar chart */}
      <div className="dash-row2" style={{ display: 'grid', gap: 14 }}>
        <div style={W}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: '12px 12px 0 0' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2817' }}>Recent Orders</span>
            <a href="/orders" style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              View all <ChevronRight size={11} />
            </a>
          </div>
          <div className="dash-tbl">
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', minWidth: 460 }}>
            <thead>
              <tr>{['Customer','Items','Total','Time','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[
                { name:'Rahul Sharma',  items:3, val:200, time:'07:15', s:'completed' },
                { name:'Priya Singh',   items:2, val:180, time:'07:45', s:'completed' },
                { name:'Amit Kumar',    items:4, val:180, time:'08:00', s:'completed' },
                { name:'Deepak Verma', items:2, val:240, time:'14:05', s:'in-progress' },
                { name:'New Customer', items:1, val:80,  time:'14:10', s:'pending' },
              ].map((r,i)=>(
                <tr key={i} style={{ background: i%2 ? '#fafffe' : '#ffffff' }}>
                  <td style={{ ...TD, fontWeight:700, color:'#0f2817' }}>{r.name}</td>
                  <td style={TD}>{r.items} items</td>
                  <td style={{ ...TD, fontWeight:800, color:'#0f2817', fontSize:13 }}>₹{r.val}</td>
                  <td style={TD}><div style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11} color="#9ca3af"/>{r.time}</div></td>
                  <td style={TD}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:5,
                      background: r.s==='completed'?'#dcfce7': r.s==='in-progress'?'#dbeafe':'#fef9c3',
                      color:       r.s==='completed'?'#16a34a': r.s==='in-progress'?'#2563eb':'#ca8a04',
                    }}>
                      {r.s==='in-progress'?'In Progress': r.s.charAt(0).toUpperCase()+r.s.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div style={W}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #d1fae5', background: '#ffffff', borderRadius: '12px 12px 0 0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2817' }}>Daily Orders</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Last 7 days</div>
          </div>
          <div style={{ padding: '16px 10px 12px', background: '#ffffff', borderRadius: '0 0 12px 12px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.weekly} margin={{ top:0, right:0, left:-28, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                <XAxis dataKey="date" tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #d1fae5', borderRadius:8, fontSize:11, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }} itemStyle={{ color:'#16a34a' }} labelStyle={{ color:'#9ca3af' }} />
                <Bar dataKey="orders" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ borderTop:'1px solid #d1fae5', paddingTop:12, marginTop:8 }}>
              <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Today</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div style={{ fontSize:26, fontWeight:800, color:'#0f2817' }}>{data.todayOrders}</div>
                <div style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>₹{data.todayRevenue.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
