'use client';
import { useEffect, useState, useRef } from 'react';
import { UtensilsCrossed, Upload, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Star } from 'lucide-react';

interface MenuItem {
  id: string; name: string; price: number; category: string;
  description: string; available: boolean; popular: boolean;
}

const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const INPUT: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, color: '#0f2817', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 };

const EMPTY: Omit<MenuItem, 'id'> = { name: '', price: 0, category: 'General', description: '', available: true, popular: false };

export default function MenuPage() {
  const [items,    setItems]    = useState<MenuItem[]>([]);
  const [editing,  setEditing]  = useState<MenuItem | null>(null);
  const [addForm,  setAddForm]  = useState<Omit<MenuItem, 'id'> | null>(null);
  const [toast,    setToast]    = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview,  setPreview]  = useState<Omit<MenuItem,'id'>[] | null>(null);
  const [catFilter, setCatFilter] = useState('All');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch('/api/menu/items').then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered   = catFilter === 'All' ? items : items.filter(i => i.category === catFilter);

  /* ── Upload ── */
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/menu/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.error) { showToast('Parse error: ' + data.error); return; }
    setPreview(data.items);
    if (fileRef.current) fileRef.current.value = '';
  };

  const applyPreview = async (replace: boolean) => {
    if (!preview) return;
    const body = replace ? preview.map((it, idx) => ({ ...it, id: `m${Date.now() + idx}`, available: true, popular: false }))
      : [...items, ...preview.map((it, idx) => ({ ...it, id: `m${Date.now() + idx}`, available: true, popular: false }))];
    await fetch('/api/menu/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setPreview(null); load(); showToast(`${preview.length} items ${replace ? 'replaced' : 'added'}!`);
  };

  /* ── CRUD ── */
  const addItem = async () => {
    if (!addForm || !addForm.name || !addForm.price) return;
    await fetch('/api/menu/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    setAddForm(null); load(); showToast('Item added!');
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch('/api/menu/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null); load(); showToast('Item updated!');
  };

  const toggleField = async (item: MenuItem, field: 'available' | 'popular') => {
    await fetch('/api/menu/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, [field]: !item[field] }) });
    load();
  };

  const deleteItem = async (id: string) => {
    await fetch('/api/menu/items', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load(); showToast('Item deleted');
  };

  const ItemForm = ({ val, onChange, onSave, onCancel, saveLabel }: {
    val: Omit<MenuItem,'id'>; onChange: (v: Omit<MenuItem,'id'>) => void;
    onSave: () => void; onCancel: () => void; saveLabel: string;
  }) => (
    <div style={{ padding: '18px 20px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #a7f3d0', marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LABEL}>Item Name *</label>
          <input style={INPUT} value={val.name} onChange={e => onChange({ ...val, name: e.target.value })} placeholder="e.g. Chole Bhature" />
        </div>
        <div>
          <label style={LABEL}>Price (₹) *</label>
          <input style={INPUT} type="number" value={val.price || ''} onChange={e => onChange({ ...val, price: Number(e.target.value) })} placeholder="0" />
        </div>
        <div>
          <label style={LABEL}>Category</label>
          <input style={INPUT} value={val.category} onChange={e => onChange({ ...val, category: e.target.value })} placeholder="e.g. Main Course" list="cat-list" />
          <datalist id="cat-list">{Array.from(new Set(items.map(i => i.category))).map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LABEL}>Description</label>
          <input style={INPUT} value={val.description} onChange={e => onChange({ ...val, description: e.target.value })} placeholder="Short description" />
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={val.available} onChange={e => onChange({ ...val, available: e.target.checked })} /> Available
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={val.popular} onChange={e => onChange({ ...val, popular: e.target.checked })} /> Popular
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
          <Check size={13} /> {saveLabel}
        </button>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 12, border: '1px solid #d1fae5', cursor: 'pointer' }}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .menu-head { flex-direction: row; align-items: center; }
        .menu-tbl  { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 880px) {
          .menu-head { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .menu-head-actions { width: 100%; flex-wrap: wrap; }
          .menu-head-actions > * { flex: 1; justify-content: center; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 300, background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 20px', color: '#16a34a', fontWeight: 700, fontSize: 13, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} /> {toast}
        </div>
      )}

      {/* Header row */}
      <div className="menu-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2817', letterSpacing: -0.4 }}>Menu Items</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{items.length} items across {categories.length - 1} categories</div>
        </div>
        <div className="menu-head-actions" style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAddForm({ ...EMPTY })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#16a34a', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: '1px solid #a7f3d0', cursor: 'pointer' }}>
            <Plus size={14} /> Add Item
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: 'none', cursor: uploading ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            <Upload size={14} /> {uploading ? 'Parsing…' : 'Upload Menu'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>

      {/* Upload file type hint */}
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: -8 }}>
        Supported: Excel (.xlsx, .xls, .csv) · PDF · Word (.docx) · Text — auto-extracts menu items
      </div>

      {/* Upload preview */}
      {preview && (
        <div style={{ ...CARD, padding: '18px 22px', background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 12 }}>
            Found {preview.length} items from upload — choose what to do:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, maxHeight: 120, overflowY: 'auto' }}>
            {preview.map((it, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                {it.name} — ₹{it.price}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => applyPreview(false)} style={{ background: '#16a34a', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
              Add to existing menu
            </button>
            <button onClick={() => applyPreview(true)} style={{ background: '#dc2626', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
              Replace entire menu
            </button>
            <button onClick={() => setPreview(null)} style={{ background: '#fff', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 12, border: '1px solid #d1fae5', cursor: 'pointer' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Add form */}
      {addForm && (
        <ItemForm val={addForm} onChange={setAddForm} onSave={addItem} onCancel={() => setAddForm(null)} saveLabel="Add Item" />
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: catFilter === c ? '#16a34a' : '#fff',
            color: catFilter === c ? '#fff' : '#374151',
            border: catFilter === c ? 'none' : '1px solid #d1fae5',
            cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      {/* Items table */}
      <div style={CARD}>
        <div className="menu-tbl">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              {['Item', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, fontSize: 13, color: '#9ca3af' }}>No items yet — add some or upload your menu</td></tr>
            ) : filtered.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                {editing?.id === item.id ? (
                  <td colSpan={5} style={{ padding: '8px 16px' }}>
                    <ItemForm val={editing} onChange={v => setEditing({ ...v, id: item.id })} onSave={saveEdit} onCancel={() => setEditing(null)} saveLabel="Save" />
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <div style={{ fontWeight: 700, color: '#0f2817', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.popular && <Star size={11} fill="#f59e0b" color="#f59e0b" />}
                        {item.name}
                      </div>
                      {item.description && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 5, background: '#f0fdf4', border: '1px solid #d1fae5', fontSize: 11, fontWeight: 600 }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0f2817' }}>₹{item.price}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => toggleField(item, 'available')} title={item.available ? 'Mark unavailable' : 'Mark available'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          {item.available ? <Eye size={15} color="#16a34a" /> : <EyeOff size={15} color="#9ca3af" />}
                        </button>
                        <button onClick={() => toggleField(item, 'popular')} title={item.popular ? 'Remove popular' : 'Mark popular'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Star size={15} fill={item.popular ? '#f59e0b' : 'none'} color={item.popular ? '#f59e0b' : '#9ca3af'} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditing(item)} style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => deleteItem(item.id)} style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#dc2626' }}>
                          <Trash2 size={12} /> Del
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
