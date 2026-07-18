import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { authService } from '../services/authService';

const UserProfile: React.FC = () => {
  const { user, updateBio, logout } = useUser();
  const { entries, savedFilms, summary } = useDiary();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [bioStatus, setBioStatus] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [view, setView] = useState<'profile' | 'account' | 'password'>('profile');

  if (!user) return null;

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordStatus('');
    if (passwords.newPassword !== passwords.confirmPassword) return setPasswordStatus('The new passwords do not match.');
    setSavingPassword(true);
    try {
      await authService.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswordStatus('Password updated.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPasswordStatus(message || 'The password could not be updated.');
    } finally {
      setSavingPassword(false);
    }
  };

  const saveBio = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingBio(true);
    setBioStatus('');
    try {
      await updateBio(bio);
      setBioStatus('Profile updated.');
    } catch {
      setBioStatus('The profile could not be updated.');
    } finally {
      setSavingBio(false);
    }
  };

  return (
    <div className="page-shell account-page">
      <header className="page-header account-header">
        <div className="page-header__copy"><h1 className="page-title">{user.displayName}</h1><p className="page-intro">@{user.username}</p></div>
        <div className="account-header__actions">
          <div aria-label="Choose account view" className="product-section-tabs" role="group">
            <button aria-pressed={view === 'profile'} onClick={() => setView('profile')} type="button">Profile</button>
            <button aria-pressed={view === 'account'} onClick={() => setView('account')} type="button">Account</button>
            <button aria-pressed={view === 'password'} onClick={() => setView('password')} type="button">Password</button>
          </div>
          <button className="button button--quiet" onClick={logout} type="button"><LogOut size={16} />Sign out</button>
        </div>
      </header>

      <div className="account-grid">
        {view === 'profile' && <section className="account-section">
          <dl className="data-list">
            <div className="data-row"><dt>Entries</dt><dd>{summary?.entries ?? entries.length}</dd></div>
            <div className="data-row"><dt>Public responses</dt><dd>{summary?.public_entries ?? entries.filter(entry => entry.visibility === 'public').length}</dd></div>
            <div className="data-row"><dt>Saved films</dt><dd>{summary?.saved ?? savedFilms.length}</dd></div>
          </dl>
          <form className="profile-bio-form" onSubmit={saveBio}><div className="field"><label htmlFor="profile-bio">Public bio</label><textarea id="profile-bio" maxLength={240} onChange={event => setBio(event.target.value)} placeholder="What tends to stay with you after a film?" value={bio} /><span className="field__hint">{bio.length} / 240. Shown beside public responses.</span></div>{bioStatus && <p className="metadata" role="status">{bioStatus}</p>}<button className="button button--secondary" disabled={savingBio} type="submit">{savingBio ? 'Saving profile' : 'Save public bio'}</button></form>
          <div className="account-section__links"><Link className="text-link" to="/diary">Open diary</Link>{(summary?.public_entries || 0) > 0 && <Link className="text-link" to={`/member/${user.username}`}>View public profile</Link>}</div>
        </section>}

        {view === 'account' && <section className="account-section">
          <dl className="data-list"><div className="data-row"><dt>Username</dt><dd>@{user.username}</dd></div><div className="data-row"><dt>Email</dt><dd>{user.email}</dd></div></dl>
        </section>}

        {view === 'password' && <section className="account-section">
          <form className="password-form" onSubmit={changePassword}>
            <div className="field"><label htmlFor="current-password">Current password</label><input autoComplete="current-password" id="current-password" onChange={event => setPasswords(data => ({ ...data, currentPassword: event.target.value }))} required type="password" value={passwords.currentPassword} /></div>
            <div className="field"><label htmlFor="new-password">New password</label><input autoComplete="new-password" id="new-password" onChange={event => setPasswords(data => ({ ...data, newPassword: event.target.value }))} required type="password" value={passwords.newPassword} /><span className="field__hint">Use a letter, number, and special character.</span></div>
            <div className="field"><label htmlFor="confirm-new-password">Confirm new password</label><input autoComplete="new-password" id="confirm-new-password" onChange={event => setPasswords(data => ({ ...data, confirmPassword: event.target.value }))} required type="password" value={passwords.confirmPassword} /></div>
            {passwordStatus && <p className="metadata" role="status">{passwordStatus}</p>}
            <button className="button button--primary" disabled={savingPassword} type="submit">{savingPassword ? 'Updating password' : 'Update password'}</button>
          </form>
        </section>}
      </div>
    </div>
  );
};

export default UserProfile;
