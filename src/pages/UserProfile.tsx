import React, { useState } from 'react';
import { BookOpen, KeyRound, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { authService } from '../services/authService';

const UserProfile: React.FC = () => {
  const { user, updateBio } = useUser();
  const { entries, savedFilms, summary } = useDiary();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [bioStatus, setBioStatus] = useState('');
  const [savingBio, setSavingBio] = useState(false);

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
      <header className="page-header"><div className="page-header__copy"><h1 className="page-title">{user.displayName}</h1><p className="page-intro">Account settings and the state of your diary.</p></div></header>

      <div className="account-grid">
        <section className="account-section">
          <header><BookOpen size={21} /><div><h2>Diary</h2><p>The records attached to this account.</p></div></header>
          <dl className="data-list">
            <div className="data-row"><dt>Entries</dt><dd>{summary?.entries ?? entries.length}</dd></div>
            <div className="data-row"><dt>Public entries</dt><dd>{summary?.public_entries ?? entries.filter(entry => entry.visibility === 'public').length}</dd></div>
            <div className="data-row"><dt>Saved films</dt><dd>{summary?.saved ?? savedFilms.length}</dd></div>
            <div className="data-row"><dt>Average rating</dt><dd>{summary?.average_rating ? `${summary.average_rating} / 5` : 'No ratings yet'}</dd></div>
          </dl>
          <Link className="button button--secondary" to="/diary">Open your diary</Link>
        </section>

        <section className="account-section">
          <header><LockKeyhole size={21} /><div><h2>Account</h2><p>The identity used for private records and public entries.</p></div></header>
          <dl className="data-list">
            <div className="data-row"><dt>Username</dt><dd>@{user.username}</dd></div>
            <div className="data-row"><dt>Email</dt><dd>{user.email}</dd></div>
          </dl>
          <form className="profile-bio-form" onSubmit={saveBio}><div className="field"><label htmlFor="profile-bio">Public bio</label><textarea id="profile-bio" maxLength={240} onChange={event => setBio(event.target.value)} placeholder="What tends to stay with you after a film?" value={bio} /><span className="field__hint">{bio.length} / 240. Shown beside public diary entries.</span></div>{bioStatus && <p className="metadata" role="status">{bioStatus}</p>}<button className="button button--secondary" disabled={savingBio} type="submit">{savingBio ? 'Saving profile' : 'Save public bio'}</button></form>
          {(summary?.public_entries || 0) > 0 && <Link className="text-link" to={`/member/${user.username}`}>View your public diary</Link>}
        </section>

        <section className="account-section account-section--wide">
          <header><KeyRound size={21} /><div><h2>Password</h2><p>Change the password used to sign in.</p></div></header>
          <form className="password-form" onSubmit={changePassword}>
            <div className="field"><label htmlFor="current-password">Current password</label><input autoComplete="current-password" id="current-password" onChange={event => setPasswords(data => ({ ...data, currentPassword: event.target.value }))} required type="password" value={passwords.currentPassword} /></div>
            <div className="field"><label htmlFor="new-password">New password</label><input autoComplete="new-password" id="new-password" onChange={event => setPasswords(data => ({ ...data, newPassword: event.target.value }))} required type="password" value={passwords.newPassword} /><span className="field__hint">Use a letter, number, and special character.</span></div>
            <div className="field"><label htmlFor="confirm-new-password">Confirm new password</label><input autoComplete="new-password" id="confirm-new-password" onChange={event => setPasswords(data => ({ ...data, confirmPassword: event.target.value }))} required type="password" value={passwords.confirmPassword} /></div>
            {passwordStatus && <p className="metadata" role="status">{passwordStatus}</p>}
            <button className="button button--primary" disabled={savingPassword} type="submit">{savingPassword ? 'Updating password' : 'Update password'}</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
