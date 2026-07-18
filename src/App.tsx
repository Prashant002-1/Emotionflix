/**
 * App Component
 * 
 * Root application component that sets up the routing structure and context providers.
 * Configures the provider hierarchy (Theme → User → Emotion) and defines all
 * application routes with appropriate protection for authenticated-only pages.
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { ErrorBoundary, LoadingSpinner, ProtectedRoute } from './components/common'
import { UserProvider } from './contexts/UserContext'
import { DiaryProvider } from './contexts/DiaryContext'
import Layout from './components/layout/Layout'
import SmoothScroll from './components/motion/SmoothScroll'

const Home = lazy(() => import('./pages/Home'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Log = lazy(() => import('./pages/Log'))
const Diary = lazy(() => import('./pages/Diary'))
const Feed = lazy(() => import('./pages/Feed'))
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
const People = lazy(() => import('./pages/People'))
const Search = lazy(() => import('./pages/Search'))
const Activity = lazy(() => import('./pages/Activity'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const MovieDetails = lazy(() => import('./pages/MovieDetails'))

/**
 * Main App component that renders the complete application structure.
 * Sets up context providers, routing, and error boundaries.
 */
function App() {
    return (
        <ErrorBoundary>
            <UserProvider>
                    <DiaryProvider>
                        <BrowserRouter>
                        <SmoothScroll />
                        <Suspense fallback={<LoadingSpinner message="Loading page" />}>
                            <Routes>
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<Home />} />
                                    <Route path="profile" element={
                                        <ProtectedRoute>
                                            <UserProfile />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="log" element={
                                        <ProtectedRoute>
                                            <Log />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="diary" element={
                                        <ProtectedRoute>
                                            <Diary />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="recommendations" element={
                                        <ProtectedRoute>
                                            <Recommendations />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="feed" element={
                                        <ProtectedRoute>
                                            <Feed />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="people" element={
                                        <ProtectedRoute>
                                            <People />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="search" element={
                                        <ProtectedRoute>
                                            <Search />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="activity" element={
                                        <ProtectedRoute>
                                            <Activity />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="community" element={<Navigate replace to="/feed" />} />
                                    <Route path="member/:username" element={
                                        <ProtectedRoute>
                                            <MemberProfile />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="movie-match" element={<Navigate replace to="/feed" />} />
                                    <Route path="movie/:id" element={
                                        <ProtectedRoute>
                                            <MovieDetails />
                                        </ProtectedRoute>
                                    } />
                                </Route>
                            </Routes>
                        </Suspense>
                        </BrowserRouter>
                    </DiaryProvider>
            </UserProvider>
        </ErrorBoundary>
    )
}

export default App
