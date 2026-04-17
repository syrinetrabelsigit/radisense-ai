import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/UserManagement.css';
import Toast, { useToast } from '../../components/Toast';

const UserManagement = () => {
  
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, toast, removeToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'patient',
    password: '',
  });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUsers(data.users);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/users?username=${encodeURIComponent(formData.username)}&email=${encodeURIComponent(formData.email)}&first_name=${encodeURIComponent(formData.firstName)}&last_name=${encodeURIComponent(formData.lastName)}&password=${encodeURIComponent(formData.password)}&role=${formData.role}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        toast.success('User created successfully!');
        setShowModal(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create user');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const params = new URLSearchParams();
      if (formData.username)  params.append('username',   formData.username);
      if (formData.email)     params.append('email',      formData.email);
      if (formData.firstName) params.append('first_name', formData.firstName);
      if (formData.lastName)  params.append('last_name',  formData.lastName);
      if (formData.role)      params.append('role',       formData.role);

      const response = await fetch(
        `http://localhost:8000/api/admin/users/${editingUser.id}?${params.toString()}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        toast.success('User updated successfully!');
        setShowModal(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update user');
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      toast.error('Failed to update user');
    }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/users/${userId}/activate`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        toast.success(user?.is_active ? 'User suspended successfully' : 'User activated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user');
    }
  };

  const roleCfg = {
    admin:       { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   label: t('admin.users.role.admin')       },
    radiologist: { color: '#0066CC', bg: 'rgba(0,102,204,0.12)',   border: 'rgba(0,102,204,0.25)',   label: t('admin.users.role.radiologist') },
    patient:     { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  label: t('admin.users.role.patient')     },
    researcher:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', label: t('admin.users.role.researcher')  },
  };

  const roleFilters = [
    { val: 'all',         label: t('admin.users.filterAll'),          count: users.length },
    { val: 'admin',       label: t('admin.users.filterAdmins'),       count: users.filter(u => u.role === 'admin').length },
    { val: 'radiologist', label: t('admin.users.filterRadiologists'), count: users.filter(u => u.role === 'radiologist').length },
    { val: 'patient',     label: t('admin.users.filterPatients'),     count: users.filter(u => u.role === 'patient').length },
    { val: 'researcher',  label: t('admin.users.filterResearchers'),  count: users.filter(u => u.role === 'researcher').length },
  ];

  const filtered = users.filter(u => {
    const roleOk   = selectedRole === 'all' || u.role === selectedRole;
    const searchOk = [u.first_name, u.last_name, u.email, u.username].some(v =>
      v?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return roleOk && searchOk;
  });

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', firstName: '', lastName: '', email: '', role: 'patient', password: '' });
    setShowModal(true);
  };

  const openEdit = user => {
    setEditingUser(user);
    setFormData({
      username:  user.username,
      firstName: user.first_name,
      lastName:  user.last_name,
      email:     user.email,
      role:      user.role,
      password:  '',
    });
    setShowModal(true);
  };

  const avatarFallback = user =>
    `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  if (loading) {
    return (
      <div className="um-page">
        <div className="container">
          <div className="um-loading">
            <div className="um-spinner"/>
            <p>{t('admin.users.title')}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="um-page">
      <div className="container">

        {/* HEADER */}
        <div className="um-header" data-aos="fade-down">
          <div>
            <div className="um-badge">
              <div className="um-badge-dot"/>
              <span>{t('admin.dashboard.title')}</span>
            </div>
            <h1 className="um-title">
              <span className="um-title-grad">{t('admin.users.title')}</span>
            </h1>
            <p className="um-subtitle">{t('admin.users.subtitle')}</p>
          </div>
          <button className="um-add-btn" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('admin.users.addNew')}
          </button>
        </div>

        {/* FILTERS */}
        <div className="um-filters-card" data-aos="fade-up">
          <div className="um-search-wrap">
            <svg className="um-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="um-search"
              type="text"
              placeholder={t('admin.users.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="um-search-clear" onClick={() => setSearchTerm('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          <div className="um-role-filters">
            {roleFilters.map(f => {
              const rc = f.val !== 'all' ? roleCfg[f.val] : null;
              const isActive = selectedRole === f.val;
              return (
                <button
                  key={f.val}
                  className={`um-role-btn ${isActive ? 'active' : ''}`}
                  style={isActive && rc ? { background: rc.color, borderColor: rc.color, boxShadow: `0 6px 20px color-mix(in srgb, ${rc.color} 35%, transparent)` } : {}}
                  onClick={() => setSelectedRole(f.val)}
                >
                  {f.val !== 'all' && (
                    <span className="um-role-dot" style={{ background: isActive ? 'rgba(255,255,255,0.7)' : rc?.color }}/>
                  )}
                  {f.label}
                  <span className="um-role-count" style={isActive ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : {}}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="um-count-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <strong>{filtered.length}</strong> / <strong>{users.length}</strong> {t('admin.users.title').toLowerCase()}
          </div>
        </div>

        {/* TABLE */}
        <div className="um-table-card" data-aos="fade-up">
          <div className="um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>{t('admin.users.table.name')}</th>
                  <th>{t('admin.users.table.email')}</th>
                  <th>{t('admin.users.table.role')}</th>
                  <th>{t('admin.users.table.joined')}</th>
                  {(selectedRole === 'all' || selectedRole === 'radiologist' || selectedRole === 'patient') && (
                  <th>{t('admin.users.table.analyses')}</th>
                )}
                  <th>{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rc = roleCfg[user.role];
                  return (
                    <tr key={user.id} className="um-row" data-aos="fade-right" data-aos-delay={i * 45}>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar-wrap">
                            <div className="um-avatar-fallback" style={{ background: rc.color }}>
                              {avatarFallback(user)}
                            </div>
                          </div>
                          <div>
                            <div className="um-user-name">{user.first_name} {user.last_name}</div>
                            <div className="um-user-id">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="um-email">{user.email}</td>
                      <td>
                        <span className="um-pill" style={{ color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
                          <span className="um-pill-dot" style={{ background: rc.color }}/>
                          {rc.label}
                        </span>
                      </td>
                      <td className="um-date">{new Date(user.created_at).toLocaleDateString()}</td>
                      {(selectedRole === 'all' || selectedRole === 'radiologist' || selectedRole === 'patient') && (
                      <td>
                        {(user.role === 'radiologist' || user.role === 'patient') ? (
                          <div className="um-analyses">
                            <span className="um-analyses-val">{(user.analyses_count || 0).toLocaleString()}</span>
                            {user.analyses_count > 0 && (
                              <div className="um-analyses-bar">
                                <div style={{ width: `${Math.min(user.analyses_count / 400 * 100, 100)}%`, background: rc.color }}/>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>—</span>
                        )}
                      </td>
                    )}
                      <td>
                        <div className="um-actions">
                          <button className="um-action-btn edit" title={t('admin.users.action.edit')} onClick={() => openEdit(user)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            className={`um-action-btn ${user.is_active ? 'suspend' : 'activate'}`}
                            title={user.is_active ? t('admin.users.action.suspend') : t('admin.users.action.activate')}
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.is_active
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            }
                          </button>
                          <button className="um-action-btn delete" title={t('admin.users.action.delete')} onClick={() => setDeleteConfirm(user.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="um-empty">
                <div className="um-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <h4>{t('patient.recentAnalyses.noResults')}</h4>
                <p>{t('admin.users.search')}</p>
                <button className="um-empty-btn" onClick={() => { setSearchTerm(''); setSelectedRole('all'); }}>
                  {t('admin.logs.clearFilters')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="um-modal" onClick={e => e.stopPropagation()}>

              <div className="um-modal-header">
                <div className="um-modal-title-wrap">
                  <div className="um-modal-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {editingUser
                        ? <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                        : <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
                      }
                    </svg>
                  </div>
                  <div>
                    <h2 className="um-modal-title">
                      {editingUser ? t('admin.users.modal.edit') : t('admin.users.modal.title')}
                    </h2>
                    <p className="um-modal-sub">
                      {editingUser
                        ? `${t('admin.users.modal.editing')} ${editingUser.first_name} ${editingUser.last_name}`
                        : t('admin.users.modal.subtitle')
                      }
                    </p>
                  </div>
                </div>
                <button className="um-modal-close" onClick={() => setShowModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="um-modal-body">
                {!editingUser && (
                  <div className="um-form-field">
                    <label className="um-form-label">{t('register.form.username')}</label>
                    <input className="um-form-input" type="text" value={formData.username}
                      placeholder={t('register.placeholder.username')}
                      onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                    />
                  </div>
                )}

                <div className="um-form-row">
                  <div className="um-form-field">
                    <label className="um-form-label">{t('admin.users.form.firstName')}</label>
                    <input className="um-form-input" type="text" value={formData.firstName}
                      placeholder={t('register.placeholder.firstname')}
                      onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="um-form-field">
                    <label className="um-form-label">{t('admin.users.form.lastName')}</label>
                    <input className="um-form-input" type="text" value={formData.lastName}
                      placeholder={t('register.placeholder.lastname')}
                      onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="um-form-field">
                  <label className="um-form-label">{t('admin.users.form.email')}</label>
                  <div className="um-form-icon-wrap">
                    <svg className="um-form-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input className="um-form-input has-icon" type="email" value={formData.email}
                      placeholder={t('register.placeholder.email')}
                      onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="um-form-field">
                  <label className="um-form-label">{t('admin.users.form.role')}</label>
                  <select className="um-form-select" value={formData.role}
                    onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                    {Object.entries(roleCfg).map(([val, rc]) => (
                      <option key={val} value={val}>{rc.label}</option>
                    ))}
                  </select>
                </div>

                {!editingUser && (
                  <div className="um-form-field">
                    <label className="um-form-label">{t('admin.users.form.password')}</label>
                    <div className="um-form-icon-wrap">
                      <svg className="um-form-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <input className="um-form-input has-icon has-eye"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        placeholder={t('register.placeholder.password')}
                        onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                      />
                      <button className="um-eye-btn" type="button" onClick={() => setShowPassword(p => !p)}>
                        {showPassword
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {formData.role && (
                  <div className="um-role-preview" style={{ '--rpc': roleCfg[formData.role]?.color }}>
                    <div className="um-role-preview-dot"/>
                    <span>
                      {t('admin.users.modal.rolePermission')} <strong>{roleCfg[formData.role]?.label}</strong> {t('admin.users.modal.permissions')}
                    </span>
                  </div>
                )}
              </div>

              <div className="um-modal-footer">
                <button className="um-modal-cancel" onClick={() => setShowModal(false)}>
                  {t('admin.users.form.cancel')}
                </button>
                <button className="um-modal-save" onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {editingUser ? t('admin.users.form.saveChanges') : t('admin.users.form.createUser')}
                </button>
              </div>

            </div>
          </div>
        )}

      {/* CONFIRM DELETE */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'var(--bg-card)',
              border:'1px solid rgba(239,68,68,0.3)',
              borderRadius:'20px', padding:'2rem',
              maxWidth:'400px', width:'90%',
              textAlign:'center',
              position:'relative', zIndex:1001
            }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', color:'#EF4444' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <h3 style={{ color:'var(--text-primary)', marginBottom:'0.5rem', fontWeight:800, fontSize:'1.125rem' }}>
                Delete User?
              </h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
                This action cannot be undone. The user will be permanently deleted.
              </p>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding:'0.625rem 1.5rem', borderRadius:'10px', border:'1px solid var(--border-primary)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>
                  Cancel
                </button>
                <button onClick={async () => { await handleDeleteUser(deleteConfirm); setDeleteConfirm(null); }}
                  style={{ padding:'0.625rem 1.5rem', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#EF4444,#DC2626)', color:'white', cursor:'pointer', fontWeight:700, fontSize:'0.875rem', boxShadow:'0 4px 12px rgba(239,68,68,0.3)' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default UserManagement;