import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { discoveryService, EntryComment } from '../../services/discoveryService';

interface ResponseCommentsProps {
  entryId: number;
  initialCount?: number;
}

export function ResponseComments({ entryId, initialCount = 0 }: ResponseCommentsProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<EntryComment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setCount(initialCount), [initialCount]);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    setLoading(true);
    setError('');
    discoveryService.comments(entryId)
      .then(nextComments => {
        if (!active) return;
        setComments(nextComments);
        setCount(nextComments.length);
        setLoaded(true);
      })
      .catch(() => active && setError('Comments could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [entryId, loaded, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || saving) return;
    setSaving(true);
    setError('');
    try {
      const comment = await discoveryService.addComment(entryId, nextBody);
      setComments(current => [...current, comment]);
      setCount(current => current + 1);
      setBody('');
      setLoaded(true);
    } catch {
      setError('Comment could not be added.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (comment: EntryComment) => {
    try {
      await discoveryService.deleteComment(comment.id);
      setComments(current => current.filter(item => item.id !== comment.id));
      setCount(current => Math.max(0, current - 1));
    } catch {
      setError('Comment could not be removed.');
    }
  };

  return (
    <div className={`response-comments${open ? ' response-comments--open' : ''}`}>
      <button aria-expanded={open} className="response-comments__toggle" onClick={() => setOpen(current => !current)} type="button">
        <MessageCircle aria-hidden="true" size={16} />
        <span>{count ? `${count} ${count === 1 ? 'comment' : 'comments'}` : 'Comment'}</span>
      </button>

      {open && (
        <div className="response-comments__panel">
          {loading ? <p className="response-comments__status">Loading comments</p> : comments.length ? (
            <div className="response-comments__list">
              {comments.map(comment => (
                <article className="response-comment" key={comment.id}>
                  <Link className="response-comment__avatar" to={`/member/${comment.username}`}>{comment.username.charAt(0).toUpperCase()}</Link>
                  <div>
                    <p><Link to={`/member/${comment.username}`}><strong>@{comment.username}</strong></Link><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></p>
                    <blockquote>{comment.body}</blockquote>
                  </div>
                  {comment.own && <button aria-label="Delete comment" className="response-comment__delete" onClick={() => void remove(comment)} type="button"><Trash2 aria-hidden="true" size={14} /></button>}
                </article>
              ))}
            </div>
          ) : <p className="response-comments__status">No comments yet.</p>}

          {user ? (
            <form className="response-comments__form" onSubmit={submit}>
              <textarea aria-label="Write a comment" maxLength={1000} onChange={event => setBody(event.target.value)} placeholder="Write a comment" rows={2} value={body} />
              <button aria-label="Post comment" disabled={!body.trim() || saving} type="submit"><Send aria-hidden="true" size={15} /></button>
            </form>
          ) : <p className="response-comments__status">Enter the demo to comment.</p>}
          {error && <p className="response-comments__error" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
