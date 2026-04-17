import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000';

const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');

const COLORS = ['#0066CC', '#00BFA6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];
const colorFor = (id) => COLORS[(id || 0) % COLORS.length];

// Rôle lisible
const roleLabel = (role) => {
  const map = {
    radiologist: 'Radiologist',
    patient:     'Patient',
    researcher:  'Researcher',
    admin:       'Admin',
  };
  return map[role] || role || '';
};

const ChatWidget = ({ user }) => {
  const { t } = useTranslation();

  // ── Panel fermé par défaut ─────────────────────────────────────────────────
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState('inbox');
  const [inbox, setInbox]           = useState([]);
  const [sent, setSent]             = useState([]);
  const [unread, setUnread]         = useState(0);
  const [thread, setThread]         = useState(null);
  const [contacts, setContacts]     = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [compose, setCompose]       = useState({ contactId: null, contactName: '', contactRole: '', message: '' });
  const [reply, setReply]           = useState('');
  const [sending, setSending]       = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);

  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchInbox = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/messages/inbox`, { headers: getHeaders() });
      if (r.ok) {
        const data = await r.json();
        setInbox(data);
        setUnread(data.filter(m => !m.is_read).length);
        return data;
      }
    } catch {}
    return [];
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/messages/sent`, { headers: getHeaders() });
      if (r.ok) {
        const data = await r.json();
        setSent(data);
        return data;
      }
    } catch {}
    return [];
  }, []);

  // ── fetchContacts — tous les rôles ─────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingContacts(true);
    try {
      const role = user.role?.value || user.role;

      if (role === 'patient') {
        const r = await fetch(`${API}/api/patients/my-records`, { headers: getHeaders() });
        if (r.ok) {
          const data = await r.json();
          setContacts((data.radiologists || []).map(rad => ({
            id: rad.id,
            name: rad.name,
            role: 'radiologist',
            sub: rad.specialty || 'Radiologist',
          })));
        }

      } else if (role === 'radiologist') {
        const r = await fetch(`${API}/api/patients/`, { headers: getHeaders() });
        if (r.ok) {
          const data = await r.json();
          setContacts(
            (data.patients || [])
              .filter(p => p.user_id)
              .map(p => ({
                id: p.user_id,
                name: `${p.first_name} ${p.last_name}`,
                role: 'patient',
                sub: 'Patient',
              }))
          );
        }

      } else if (role === 'admin') {
        // Admin ET Researcher voient tous les utilisateurs
        const r = await fetch(`${API}/api/users/`, { headers: getHeaders() });
        if (r.ok) {
          const data = await r.json();
          setContacts(
            (data.users || data || [])
              .filter(u => u.id !== user.id)
              .map(u => ({
                id:   u.id,
                name: `${u.first_name} ${u.last_name}`.trim() || u.username || 'Unknown',
                role: u.role?.value || u.role,
                sub:  roleLabel(u.role?.value || u.role),
              }))
          );
        }
      }
    } catch {}
    setLoadingContacts(false);
  }, [user]);

  // ── init + polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) { fetchInbox(); fetchSent(); }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      pollRef.current = setInterval(async () => {
        const freshInbox = await fetchInbox();
        const freshSent  = await fetchSent();
        if (view === 'thread' && thread) {
          const msgs = [
            ...freshInbox.filter(m => m.sender_id === thread.contact.id),
            ...freshSent.filter(m => m.recipient_id === thread.contact.id),
          ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setThread(prev => ({ ...prev, messages: msgs }));
        }
      }, 10000);
    }
    return () => clearInterval(pollRef.current);
  }, [open, user, view, thread]);

  useEffect(() => {
    if (view === 'contacts' && user) fetchContacts();
  }, [view]);

  useEffect(() => {
    if (view === 'thread' && thread?.messages?.length) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [thread?.messages?.length, view]);

  // ── open thread ────────────────────────────────────────────────────────────
  const openThread = async (contactId, contactName, contactRole) => {
    setView('thread');
    setThreadLoading(true);
    setThread({ contact: { id: contactId, name: contactName, role: contactRole }, messages: [] });

    try {
      const [freshInbox, freshSent] = await Promise.all([fetchInbox(), fetchSent()]);
      const msgs = [
        ...freshInbox.filter(m => m.sender_id === contactId),
        ...freshSent.filter(m => m.recipient_id === contactId),
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setThread({ contact: { id: contactId, name: contactName, role: contactRole }, messages: msgs });

      const toRead = msgs.filter(m => !m.is_read && m.recipient_id === user?.id);
      await Promise.all(toRead.map(m =>
        fetch(`${API}/api/messages/mark-read`, {
          method: 'PUT', headers: getHeaders(),
          body: JSON.stringify({ message_id: m.id })
        }).catch(() => {})
      ));
      if (toRead.length > 0) {
        setUnread(prev => Math.max(0, prev - toRead.length));
        setInbox(prev => prev.map(m =>
          toRead.find(u => u.id === m.id) ? { ...m, is_read: true } : m
        ));
      }
    } catch {}
    setThreadLoading(false);
  };

  // ── send reply ─────────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!reply.trim() || !thread || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/api/messages/send`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          recipient_id: thread.contact.id,
          subject: 'Re: conversation',
          message: reply.trim(),
        })
      });
      if (r.ok) {
        setReply('');
        const [fi, fs] = await Promise.all([fetchInbox(), fetchSent()]);
        const msgs = [
          ...fi.filter(m => m.sender_id === thread.contact.id),
          ...fs.filter(m => m.recipient_id === thread.contact.id),
        ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setThread(prev => ({ ...prev, messages: msgs }));
      }
    } catch {}
    setSending(false);
  };

  // ── compose ────────────────────────────────────────────────────────────────
  const startCompose = (contact) => {
    setCompose({ contactId: contact.id, contactName: contact.name, contactRole: contact.role, message: '' });
    setView('compose');
  };

  const sendMessage = async () => {
    if (!compose.contactId || !compose.message.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/api/messages/send`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          recipient_id: compose.contactId,
          subject: `Message from ${user?.first_name || 'User'}`,
          message: compose.message.trim(),
        })
      });
      if (r.ok) {
        const cId   = compose.contactId;
        const cName = compose.contactName;
        const cRole = compose.contactRole;
        setCompose({ contactId: null, contactName: '', contactRole: '', message: '' });
        await openThread(cId, cName, cRole);
      }
    } catch {}
    setSending(false);
  };

  // ── conversations ──────────────────────────────────────────────────────────
  const conversations = (() => {
    const map = {};
    [...inbox, ...sent].forEach(m => {
      const isMe  = m.sender_id === user?.id;
      const cid   = isMe ? m.recipient_id   : m.sender_id;
      const cname = isMe ? (m.recipient_name || 'Unknown') : (m.sender_name || 'Unknown');
      const crole = isMe ? (m.recipient_type || '') : (m.sender_type || '');
      if (!map[cid]) map[cid] = { id: cid, name: cname, role: crole, messages: [], unread: 0 };
      map[cid].messages.push(m);
      if (!isMe && !m.is_read) map[cid].unread++;
    });
    return Object.values(map)
      .map(c => ({
        ...c,
        last: [...c.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      }))
      .sort((a, b) => new Date(b.last?.created_at) - new Date(a.last?.created_at));
  })();

  const contactsLabel = {
    patient:    t('chat.yourRadiologists'),
    radiologist:t('chat.yourPatients'),
  }[user?.role] || t('chat.users');

  // ── Logique "un seul message par tour" pour les non-admins ─────────────────
  const canReply = (() => {
    if (user?.role === 'admin') return true; // admin peut toujours écrire
    if (!thread?.messages?.length) return true; // pas encore de messages
    const lastMsg = [...thread.messages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];
    // Peut répondre seulement si le dernier message vient de l'admin
    return lastMsg.sender_type === 'admin';
  })();

  if (!user) return null;

  return (
    <>
      {/* ── BUBBLE (toujours visible) ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ ...S.bubble, transform: open ? 'scale(0.92)' : 'scale(1)' }}
        title={t('chat.title')}
      >
        {open ? <XIcon /> : <ChatIcon />}
        {unread > 0 && (
          <span style={S.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* ── PANEL (visible seulement si open) ── */}
      {open && (
        <div style={S.panel}>

          {/* HEADER */}
          <div style={S.header}>
            {view !== 'inbox' && (
              <button style={S.iconBtn} onClick={() => { setView('inbox'); setThread(null); }}>
                <BackIcon />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={S.headerTitle}>
                {view === 'inbox'    ? t('chat.title')
                : view === 'contacts' ? contactsLabel
                : view === 'compose'  ? `${t('chat.to')} ${compose.contactName}`
                : view === 'thread'   ? thread?.contact?.name
                : t('chat.title')}
              </h3>
              {/* Rôle affiché sous le nom dans le thread */}
              {view === 'thread' && thread?.contact?.role && (
                <p style={S.headerSub}>{roleLabel(thread.contact.role)}</p>
              )}
              {view === 'inbox' && (
                <p style={S.headerSub}>
                  {unread > 0 ? t('chat.unread', { count: unread }) : t('chat.allCaughtUp')}
                </p>
              )}
            </div>
            {view === 'inbox' && (
              <button style={S.composeBtn} onClick={() => setView('contacts')}>
                <PlusIcon />
              </button>
            )}
          </div>

          {/* INBOX */}
          {view === 'inbox' && (
            <div style={S.body}>
              {conversations.length === 0 ? (
                <EmptyState
                  text={t('chat.noMessages')}
                  sub={t('chat.startConversation')}
                  onAction={() => setView('contacts')}
                  actionLabel={t('chat.startConversation')}
                />
              ) : conversations.map(c => (
                <button
                  key={c.id}
                  style={S.convRow}
                  onClick={() => openThread(c.id, c.name, c.role)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={c.name} id={c.id} size={42} />
                  <div style={S.convInfo}>
                    <div style={S.convTop}>
                      <div>
                        <span style={{ ...S.convName, fontWeight: c.unread > 0 ? 800 : 600 }}>{c.name}</span>
                        {/* Rôle sous le nom dans la liste */}
                        {c.role && (
                          <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748B', marginTop: '1px' }}>
                            {roleLabel(c.role)}
                          </p>
                        )}
                      </div>
                      <span style={S.convTime}>{fmt(c.last?.created_at)}</span>
                    </div>
                    <div style={S.convBottom}>
                      <span style={{
                        ...S.convPreview,
                        fontWeight: c.unread > 0 ? 600 : 400,
                        color: c.unread > 0 ? 'var(--text-primary,#fff)' : '#64748B'
                      }}>
                        {c.last?.sender_id === user?.id ? '↗ ' : ''}
                        {c.last?.message?.slice(0, 44)}{c.last?.message?.length > 44 ? '…' : ''}
                      </span>
                      {c.unread > 0 && <span style={S.unreadPill}>{c.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CONTACTS */}
          {view === 'contacts' && (
            <div style={S.body}>
              {loadingContacts ? (
                <div style={S.loadingWrap}><div style={S.spinner} /></div>
              ) : contacts.length === 0 ? (
                <EmptyState text={t('chat.noContacts')} />
              ) : contacts.map(c => (
                <button
                  key={c.id}
                  style={S.contactRow}
                  onClick={() => startCompose(c)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={c.name} id={c.id} size={40} />
                  <div>
                    <p style={S.contactName}>{c.name}</p>
                    {/* Rôle sous le nom dans la liste contacts */}
                    <p style={S.contactSub}>{c.sub || roleLabel(c.role)}</p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}><ArrowIcon /></div>
                </button>
              ))}
            </div>
          )}

          {/* COMPOSE */}
          {view === 'compose' && (
            <div style={{ ...S.body, gap: '0.875rem' }}>
              <div style={S.selectedContact}>
                <Avatar name={compose.contactName} id={compose.contactId} size={32} />
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary,#fff)', display: 'block' }}>
                    {compose.contactName}
                  </span>
                  {/* Rôle sous le nom dans compose */}
                  {compose.contactRole && (
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {roleLabel(compose.contactRole)}
                    </span>
                  )}
                </div>
                <button style={S.changeContact} onClick={() => setView('contacts')}>
                  {t('chat.change')}
                </button>
              </div>
              <textarea
                style={S.composeArea}
                placeholder={t('chat.writePlaceholder')}
                value={compose.message}
                onChange={e => setCompose(p => ({ ...p, message: e.target.value }))}
                rows={6}
                autoFocus
              />
              <button
                style={{ ...S.sendFullBtn, opacity: !compose.message.trim() || sending ? 0.55 : 1 }}
                onClick={sendMessage}
                disabled={!compose.message.trim() || sending}
              >
                {sending ? t('chat.sending') : <><SendIcon /> {t('chat.send')}</>}
              </button>
            </div>
          )}

          {/* THREAD */}
          {view === 'thread' && thread && (
            <div style={S.threadWrap}>
              <div style={S.threadMessages}>
                {threadLoading ? (
                  <div style={S.loadingWrap}><div style={S.spinner} /></div>
                ) : thread.messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '2rem' }}>
                    {t('chat.sayHello')}
                  </div>
                ) : thread.messages.map((m, i) => {
                  const isMe = m.sender_id === user?.id;
                  const showName = !isMe && (i === 0 || thread.messages[i - 1]?.sender_id !== m.sender_id);
                  return (
                    <div key={m.id} style={{ ...S.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && (
                        <div style={{ width: 28, flexShrink: 0 }}>
                          {showName && <Avatar name={thread.contact.name} id={thread.contact.id} size={28} />}
                        </div>
                      )}
                      <div style={{ maxWidth: '72%' }}>
                        {/* Rôle au-dessus du premier message de l'interlocuteur */}
                        {showName && !isMe && (
                          <p style={{ margin: '0 0 3px 2px', fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                            {roleLabel(m.sender_type)}
                          </p>
                        )}
                        <div style={{ ...S.bubble2, ...(isMe ? S.bubbleMe : S.bubbleThem) }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: isMe ? 'white' : 'var(--text-primary,#fff)', lineHeight: 1.5 }}>
                            {m.message}
                          </p>
                        </div>
                        <p style={{ ...S.msgTime, textAlign: isMe ? 'right' : 'left' }}>
                          {fmt(m.created_at)}
                          {isMe && m.is_read && <span style={{ marginLeft: '0.3rem', color: '#00BFA6' }}>✓✓</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message d'attente si le user ne peut pas encore répondre */}
              {!canReply && user?.role !== 'admin' && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  color: '#F59E0B',
                  textAlign: 'center',
                  margin: '0 0.75rem 0.5rem',
                  flexShrink: 0,
                }}>
                  Waiting for admin reply before you can send again
                </div>
              )}

              <div style={S.replyBox}>
                <textarea
                  style={{
                    ...S.replyInput,
                    opacity: canReply ? 1 : 0.4,
                    cursor: canReply ? 'text' : 'not-allowed',
                  }}
                  placeholder={canReply ? t('chat.replyPlaceholder') : 'Waiting for admin reply...'}
                  value={reply}
                  onChange={e => canReply && setReply(e.target.value)}
                  rows={2}
                  disabled={!canReply}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && canReply) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <button
                  style={{ ...S.replyBtn, opacity: !reply.trim() || sending || !canReply ? 0.5 : 1 }}
                  onClick={sendReply}
                  disabled={!reply.trim() || sending || !canReply}
                >
                  {sending ? <div style={S.spinnerSm} /> : <SendIcon />}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes chatUp   { from { opacity:0; transform:translateY(14px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes chatSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────
const Avatar = ({ name, id, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: colorFor(id),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 800,
    fontSize: size < 32 ? '0.6rem' : size < 40 ? '0.7rem' : '0.8rem',
  }}>
    {initials(name)}
  </div>
);

const EmptyState = ({ text, sub, onAction, actionLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1rem', gap: '0.75rem', textAlign: 'center' }}>
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
    <p style={{ color: 'var(--text-primary,#fff)', fontWeight: 600, margin: 0 }}>{text}</p>
    {sub && <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>{sub}</p>}
    {onAction && (
      <button onClick={onAction} style={{
        marginTop: '0.25rem', background: 'linear-gradient(135deg,#0066CC,#00BFA6)',
        border: 'none', borderRadius: '10px', color: 'white',
        padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
      }}>
        {actionLabel}
      </button>
    )}
  </div>
);

const ChatIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const XIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const BackIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ArrowIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;
const SendIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

const S = {
  bubble: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0066CC, #00BFA6)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,102,204,0.45)',
    zIndex: 9990, transition: 'transform 0.2s',
  },
  badge: {
    position: 'absolute', top: '-5px', right: '-5px',
    background: '#EF4444', color: 'white',
    fontSize: '0.65rem', fontWeight: 800,
    minWidth: '20px', height: '20px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid var(--bg-primary,#0A0E27)', padding: '0 3px',
    zIndex: 9991,
  },
  panel: {
    position: 'fixed', bottom: '5.5rem', right: '2rem',
    width: '360px', height: '540px',
    background: 'var(--bg-card, rgba(26,31,58,0.98))',
    border: '1px solid var(--border-primary, rgba(255,255,255,0.1))',
    borderRadius: '22px',
    boxShadow: '0 28px 70px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(28px)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', zIndex: 9989,
    animation: 'chatUp 0.22s ease',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1rem 1.125rem',
    borderBottom: '1px solid var(--border-primary, rgba(255,255,255,0.07))',
    background: 'rgba(0,102,204,0.07)', flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary,#fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub:   { margin: 0, fontSize: '0.72rem', color: '#64748B', marginTop: '1px' },
  iconBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
    color: 'var(--text-primary,#fff)', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  composeBtn: {
    background: 'linear-gradient(135deg,#0066CC,#00BFA6)',
    border: 'none', borderRadius: '8px', padding: '0.4rem 0.55rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  body: { flex: 1, overflowY: 'auto', padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: '3rem' },
  spinner:   { width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'chatSpin 0.7s linear infinite' },
  spinnerSm: { width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'chatSpin 0.7s linear infinite' },
  convRow: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.7rem 0.625rem', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' },
  convInfo: { flex: 1, minWidth: 0 },
  convTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' },
  convName: { fontSize: '0.875rem', color: 'var(--text-primary,#fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px', display: 'block' },
  convTime: { fontSize: '0.68rem', color: '#475569', flexShrink: 0, marginLeft: '0.5rem', marginTop: '2px' },
  convBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' },
  convPreview: { fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' },
  unreadPill: { background: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 },
  contactRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.625rem', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' },
  contactName: { margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary,#fff)' },
  contactSub:  { margin: 0, fontSize: '0.75rem', color: '#64748B', marginTop: '1px' },
  selectedContact: { display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '12px', padding: '0.625rem 0.875rem' },
  changeContact: { marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.5rem', cursor: 'pointer' },
  composeArea: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'var(--text-primary,#fff)', padding: '0.875rem 1rem', fontSize: '0.9rem', resize: 'none', outline: 'none', fontFamily: 'inherit', flex: 1, minHeight: '120px' },
  sendFullBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', borderRadius: '12px', color: 'white', padding: '0.8rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'opacity 0.2s' },
  threadWrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  threadMessages: { flex: 1, overflowY: 'auto', padding: '1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' },
  msgRow:    { display: 'flex', gap: '0.5rem', alignItems: 'flex-end' },
  bubble2:   { padding: '0.625rem 0.875rem', borderRadius: '16px' },
  bubbleMe:  { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', borderBottomRightRadius: '4px' },
  bubbleThem:{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' },
  msgTime:   { fontSize: '0.65rem', color: '#475569', marginTop: '0.2rem' },
  replyBox:  { display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.12)', alignItems: 'flex-end', flexShrink: 0 },
  replyInput:{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary,#fff)', padding: '0.625rem 0.875rem', fontSize: '0.875rem', resize: 'none', outline: 'none', fontFamily: 'inherit' },
  replyBtn:  { width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' },
};

export default ChatWidget;