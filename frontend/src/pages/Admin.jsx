import { useState, useCallback, useEffect } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NavBar } from '../layouts/MainLayout';
import { IconBtn } from '../components/ui/IconBtn';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { QRButton } from '../components/QRButton';

export function AdminPage({ toast }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setStats(d);
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [token]);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/admin/links`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setLinks(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStats();
    if (tab === 'users') fetchUsers();
    if (tab === 'links') fetchLinks();
  }, [tab]); // eslint-disable-line

  async function toggleUser(user) {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ disabled: !user.disabled }),
    });
    toast(`User ${user.disabled ? 'enabled' : 'disabled'}.`, 'success');
    fetchUsers();
  }

  async function promoteUser(user) {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: user.role === 'admin' ? 'user' : 'admin' }),
    });
    toast('Role updated.', 'success');
    fetchUsers();
  }

  async function deleteUser(user) {
    if (!confirm(`Delete user ${user.email} and all their links?`)) return;
    await fetch(`${API}/api/admin/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast('User deleted.', 'success');
    fetchUsers();
  }

  async function adminToggleLink(link) {
    await fetch(`${API}/api/links/${link.code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled: !link.enabled }),
    });
    toast(`Link ${link.enabled ? 'disabled' : 'enabled'}.`, 'success');
    fetchLinks();
  }

  async function adminDeleteLink(link) {
    if (!confirm(`Delete /${link.code}?`)) return;
    await fetch(`${API}/api/links/${link.code}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast('Link deleted.', 'success');
    fetchLinks();
  }

  const tabStyle = active => ({
    background: active ? C.accent : 'none',
    color: active ? '#000' : C.muted,
    border: `1px solid ${active ? C.accent : C.border2}`,
    borderRadius: 7, padding: '6px 18px', fontFamily: C.mono, fontSize: 12,
    cursor: 'pointer', fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <NavBar toast={toast} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 36, marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 32 }}>v1 — full access</p>

        {stats && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
            {[['Total users', stats.total_users], ['Total links', stats.total_links], ['Total clicks', stats.total_clicks]].map(([l, v]) => (
              <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 28px', flex: '1 1 150px' }}>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{l}</div>
                <div style={{ fontFamily: C.space, fontWeight: 800, fontSize: 36, color: C.accent }}>{v ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {['stats', 'users', 'links'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>{t}</button>
          ))}
        </div>

        {tab === 'stats' && (
          <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 14 }}>
            Overview stats shown above. Switch to Users or Links tabs for detailed management.
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 100px 90px 120px', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border2}`, fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Email</span><span>Role</span><span style={{ textAlign: 'center' }}>Links</span><span>Status</span><span>Joined</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
            ) : users.map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 100px 90px 120px', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center', fontSize: 13 }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{u.email}</div>
                  <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 11, marginTop: 2 }}>ID: {u.id}</div>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: u.role === 'admin' ? C.accent : C.muted }}>{u.role === 'admin' ? Ic.shield : null}</span>
                  <span style={{ color: u.role === 'admin' ? C.accent : C.muted }}>{u.role}</span>
                </span>
                <span style={{ fontFamily: C.mono, color: C.muted, fontSize: 12, textAlign: 'center' }}>{u.link_count ?? 0}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.disabled ? C.error : C.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: u.disabled ? C.error : C.accent }}>{u.disabled ? 'Suspended' : 'Active'}</span>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{new Date(u.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <IconBtn icon={u.role === 'admin' ? Ic.userX : Ic.shield} onClick={() => promoteUser(u)} title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'} hoverColor={u.role === 'admin' ? '#ff9900' : C.accent} />
                  <IconBtn icon={u.disabled ? Ic.userCheck : Ic.userX} onClick={() => toggleUser(u)} title={u.disabled ? 'Re-enable account' : 'Suspend account'} hoverColor={u.disabled ? C.accent : C.error} />
                  <IconBtn icon={Ic.trash} onClick={() => deleteUser(u)} title="Delete user and all their links" hoverColor={C.error} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'links' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px 60px 120px 80px 120px', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border2}`, fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Alias</span><span>Original URL</span><span>Created by</span><span style={{ textAlign: 'center' }}>Clicks</span><span>Status</span><span>Date</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
            ) : links.map(l => {
              const isExpired = l.expires_at && new Date(l.expires_at) < new Date();
              const statusColor = !l.enabled ? C.error : isExpired ? '#ff9900' : C.accent;
              const statusLabel = !l.enabled ? 'Disabled' : isExpired ? 'Expired' : 'Live';
              return (
                <div key={l.code} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px 60px 120px 80px 120px', gap: 10, padding: '14px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center', fontSize: 13 }}>
                  <div>
                    <a href={l.short_url} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>/{l.code}</a>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.original_url}>{l.original_url}</div>
                    {l.expires_at && <div style={{ fontFamily: C.mono, fontSize: 10, color: isExpired ? '#ff9900' : C.muted, marginTop: 2 }}>expires {new Date(l.expires_at).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.owner_email}>{l.owner_email}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>ID: {l.userId || '—'}</div>
                  </div>
                  <span style={{ fontFamily: C.mono, color: C.accent, textAlign: 'center', fontWeight: 600 }}>{l.clicks ?? 0}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: statusColor }}>{statusLabel}</span>
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <QRButton url={l.short_url} />
                    <ToggleSwitch enabled={l.enabled} onToggle={() => adminToggleLink(l)} />
                    <IconBtn icon={Ic.trash} onClick={() => adminDeleteLink(l)} title="Delete link permanently" hoverColor={C.error} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
