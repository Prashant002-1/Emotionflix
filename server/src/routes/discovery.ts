import express from 'express';
import { getActivity, getCommunityPulse, getFeed, getFilmEntries, getPeople, getPersonProfile, followPerson, reactToEntry, removeReaction, unfollowPerson } from '../controllers/discoveryController';
import { authenticateToken, optionalAuthentication } from '../middleware/auth';

const router = express.Router();
router.get('/feed', optionalAuthentication, getFeed);
router.get('/activity', authenticateToken, getActivity);
router.get('/pulse', optionalAuthentication, getCommunityPulse);
router.get('/films/:movieId', optionalAuthentication, getFilmEntries);
router.get('/people', optionalAuthentication, getPeople);
router.get('/people/:username', optionalAuthentication, getPersonProfile);
router.post('/people/:personId/follow', authenticateToken, followPerson);
router.delete('/people/:personId/follow', authenticateToken, unfollowPerson);
router.post('/entries/:entryId/reaction', authenticateToken, reactToEntry);
router.delete('/entries/:entryId/reaction', authenticateToken, removeReaction);

export default router;
