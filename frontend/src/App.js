import React, { useEffect, useMemo, useState } from 'react';
import { clearSession, getToken, getUser, request, setSession } from './api';

const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner'
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function prettyDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      setSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="auth-page">
    <div className="auth-art">
      <div className="brand-mark">♥</div>
      <p className="eyebrow">YOUR DAILY WELLNESS COMPANION</p>
      <h1>A little care,<br/><em>every day.</em></h1>
      <p className="muted-light">Keep your readings organised and understand your daily patterns.</p>
      <div className="art-orb">✦</div>
    </div>
    <div className="auth-panel">
      <div className="brand"><span className="brand-icon">♥</span> sweety</div>
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="subheading">{mode === 'login' ? 'Sign in to view your glucose journal.' : 'Start keeping your readings in one place.'}</p>
      <form onSubmit={submit} className="form-stack">
        {mode === 'register' && <label>Full name<input required maxLength="100" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
        {error && <div className="alert">{error}</div>}
        <button className="primary-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="switch-auth">{mode === 'login' ? "New to Sweety?" : 'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
      <p className="fine-print">Your readings are private to your account.</p>
    </div>
  </div>;
}

function StatCard({ label, value, suffix, icon, tone }) {
  return <div className={`stat-card ${tone}`}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value ?? '—'}<small>{value !== null && value !== undefined ? suffix : ''}</small></div></div>;
}

function App() {
  const [user, setUser] = useState(getUser());
  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [daily, setDaily] = useState(null);
  const [mtd, setMtd] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [form, setForm] = useState({ date: localToday(), slot: 'morning', value: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  async function loadData(date = selectedDate) {
    setLoading(true);
    try {
      const [r, d, m, p] = await Promise.all([
        request('/readings'),
        request(`/reports/daily?date=${date}`),
        request(`/reports/month-to-date?date=${date}`),
        request(`/reports/previous-month?date=${date}`)
      ]);
      setReadings(r.readings); setDaily(d); setMtd(m); setPrevious(p);
      setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (getToken() && user) loadData();
  }, []);

  useEffect(() => {
    if (user && getToken()) loadData(selectedDate);
  }, [selectedDate]);

  function resetForm() {
    setForm({ date: selectedDate, slot: 'morning', value: '' });
    setEditingId(null);
  }

  async function saveReading(e) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const path = editingId ? `/readings/${editingId}` : '/readings';
      await request(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...form, value: Number(form.value) }) });
      setSuccess(editingId ? 'Reading updated.' : 'Reading saved.');
      setSelectedDate(form.date);
      setEditingId(null);
      setForm({ date: form.date, slot: 'morning', value: '' });
      await loadData(form.date);
    } catch (err) { setError(err.message); }
  }

  function editReading(reading) {
    setForm({ date: reading.date, slot: reading.slot, value: String(reading.value) });
    setEditingId(reading.id); setTab('readings'); setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteReading(id) {
    if (!window.confirm('Delete this reading?')) return;
    setError(''); setSuccess('');
    try { await request(`/readings/${id}`, { method: 'DELETE' }); setSuccess('Reading deleted.'); await loadData(); }
    catch (err) { setError(err.message); }
  }

  function logout() { clearSession(); setUser(null); setReadings([]); }

  if (!user || !getToken()) return <AuthScreen onLogin={u=>{setUser(u);loadData();}}/>;

  const dailyReadings = daily?.readings || [];
  const monthLabel = mtd?.range ? `${prettyDate(mtd.range.start)} – ${prettyDate(mtd.range.end)}` : '';
  const previousLabel = previous?.range ? `${prettyDate(previous.range.start)} – ${prettyDate(previous.range.end)}` : '';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon">♥</span> sweety</div>
      <div className="side-caption">MENU</div>
      <button className={`nav-item ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>▦ <span>Overview</span></button>
      <button className={`nav-item ${tab==='readings'?'active':''}`} onClick={()=>setTab('readings')}>♡ <span>My readings</span></button>
      <button className={`nav-item ${tab==='reports'?'active':''}`} onClick={()=>setTab('reports')}>▤ <span>Reports</span></button>
      <div className="sidebar-bottom"><div className="avatar">{(user.name||'U').charAt(0).toUpperCase()}</div><div className="profile-text"><strong>{user.name}</strong><small>{user.email}</small></div><button className="logout" onClick={logout} title="Sign out">↗</button></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><span className="breadcrumb">Workspace / </span><strong>{tab==='overview'?'Overview':tab==='readings'?'My readings':'Reports'}</strong></div><div className="top-user"><span className="online-dot"></span> Personal health journal</div></header>
      <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">YOUR GLUCOSE JOURNAL</p><h1>{tab==='overview'?'Good day, '+user.name.split(' ')[0]+'!':tab==='readings'?'Your readings':'Your reports'} <span>✦</span></h1><p className="page-subtitle">A simple way to keep track, one reading at a time.</p></div><label className="date-picker">REPORT DATE<input type="date" max={localToday()} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label></div>

        {(error || success) && <div className={error?'alert':'success-alert'}>{error || success}<button onClick={()=>{setError('');setSuccess('');}}>×</button></div>}

        {tab !== 'readings' && <>
          <div className="section-heading"><div><h3>At a glance</h3><p>Daily summary · {prettyDate(selectedDate)}</p></div><button className="text-btn" onClick={()=>setTab('reports')}>View reports →</button></div>
          <div className="stats-grid">
            <StatCard label="Highest reading" value={daily?.highest} suffix=" mg/dl" icon="↗" tone="peach"/>
            <StatCard label="Lowest reading" value={daily?.lowest} suffix=" mg/dl" icon="↘" tone="lavender"/>
            <StatCard label="Daily average" value={daily?.average} suffix=" mg/dl" icon="∿" tone="mint"/>
            <StatCard label="Readings logged" value={daily?.count ?? 0} suffix=" / 4" icon="♡" tone="cream"/>
          </div>
        </>}

        {tab === 'overview' && <div className="content-grid">
          <div className="panel readings-panel"><div className="panel-heading"><div><h3>Today's readings</h3><p>Your recorded measurements for the selected date</p></div><button className="small-btn" onClick={()=>{resetForm();setTab('readings');}}>＋ Add reading</button></div>
            {dailyReadings.length ? <ReadingTable readings={dailyReadings} onEdit={editReading} onDelete={deleteReading}/> : <EmptyState title="No readings yet" text="Add your first reading to start your daily log."/>}
          </div>
          <div className="panel side-report"><div className="panel-heading"><div><h3>Monthly snapshot</h3><p>{monthLabel}</p></div><span className="soft-icon">✦</span></div><div className="snapshot-number">{mtd?.count ?? 0}<small> readings</small></div><div className="snapshot-line"><span>Average</span><strong>{mtd?.average ?? '—'} {mtd?.average != null?'mg/dl':''}</strong></div><div className="snapshot-line"><span>Highest</span><strong>{mtd?.highest ?? '—'} {mtd?.highest != null?'mg/dl':''}</strong></div><div className="snapshot-line"><span>Lowest</span><strong>{mtd?.lowest ?? '—'} {mtd?.lowest != null?'mg/dl':''}</strong></div><button className="outline-btn" onClick={()=>setTab('reports')}>See all reports</button></div>
        </div>}

        {tab === 'readings' && <div className="content-grid readings-layout">
          <div className="panel form-panel"><div className="panel-heading"><div><h3>{editingId?'Edit reading':'Add a reading'}</h3><p>Enter your measurement details below.</p></div><span className="soft-icon">＋</span></div>
            <form onSubmit={saveReading} className="form-stack">
              <label>Date<input type="date" required max={localToday()} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
              <label>Time slot<select value={form.slot} onChange={e=>setForm({...form,slot:e.target.value})}>{Object.entries(SLOT_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <label>Glucose value <span className="unit-label">mg/dl</span><input required type="number" min="40" max="600" step="1" placeholder="e.g. 110" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
              <p className="helper">Enter a whole number between 40 and 600 mg/dl. One reading per slot each day.</p>
              <button className="primary-btn">{editingId?'Save changes':'Save reading'}</button>
              {editingId && <button type="button" className="cancel-btn" onClick={resetForm}>Cancel edit</button>}
            </form>
          </div>
          <div className="panel readings-panel"><div className="panel-heading"><div><h3>Reading history</h3><p>All your saved readings</p></div><span className="count-pill">{readings.length} total</span></div>
            {readings.length ? <ReadingTable readings={readings} onEdit={editReading} onDelete={deleteReading}/> : <EmptyState title="Your journal is empty" text="Your saved readings will appear here."/>}
          </div>
        </div>}

        {tab === 'reports' && <div className="reports-stack">
          <div className="report-cards">
            <ReportCard title="Daily report" range={prettyDate(daily?.range?.start)} data={daily}/>
            <ReportCard title="Month-to-date" range={monthLabel} data={mtd}/>
            <ReportCard title="Previous month" range={previousLabel} data={previous}/>
          </div>
          <div className="panel readings-panel"><div className="panel-heading"><div><h3>Daily reading details</h3><p>{prettyDate(selectedDate)}</p></div></div>
            {dailyReadings.length ? <ReadingTable readings={dailyReadings} onEdit={editReading} onDelete={deleteReading}/> : <EmptyState title="Nothing recorded for this date" text="Choose another date or add a reading."/>}
          </div>
        </div>}
        <footer className="footer-note">Sweety is a personal record-keeping tool, not a medical device. Follow guidance from your healthcare professional.</footer>
      </section>
    </main>
  </div>;
}

function ReadingTable({ readings, onEdit, onDelete }) {
  return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Time slot</th><th>Value</th><th>Actions</th></tr></thead><tbody>{readings.map(r=><tr key={r.id}><td>{prettyDate(r.date)}</td><td>{SLOT_LABELS[r.slot]||r.slot}</td><td><strong>{r.value}</strong> <small>mg/dl</small></td><td><div className="actions"><button onClick={()=>onEdit(r)} title="Edit">✎</button><button onClick={()=>onDelete(r.id)} title="Delete">⌫</button></div></td></tr>)}</tbody></table></div>;
}
function EmptyState({ title, text }) { return <div className="empty-state"><div className="empty-heart">♡</div><strong>{title}</strong><p>{text}</p></div>; }
function ReportCard({ title, range, data }) {
  return <div className="panel report-card"><div className="report-card-top"><span>{title}</span><span>✦</span></div><p className="report-range">{range || 'Select a date'}</p><div className="report-average">{data?.average ?? '—'}<small>{data?.average != null?' mg/dl':'No data'}</small></div><div className="report-mini-grid"><div><small>Highest</small><strong>{data?.highest ?? '—'}</strong></div><div><small>Lowest</small><strong>{data?.lowest ?? '—'}</strong></div><div><small>Readings</small><strong>{data?.count ?? 0}</strong></div></div></div>;
}

export default App;
