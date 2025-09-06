/**
 * App Component
 * 
 * Root application component that sets up the routing structure and context providers.
 * Configures the provider hierarchy (Theme → User → Emotion) and defines all
 * application routes with appropriate protection for authenticated-only pages.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary, ProtectedRoute } from './components/common'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserContext'
import { EmotionProvider } from './contexts/EmotionContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import UserProfile from './pages/UserProfile'
import Log from './pages/Log'
import Recommendations from './pages/Recommendations'
import MovieDetails from './pages/MovieDetails'
import MovieMatch from './pages/MovieMatch'

/**
 * Main App component that renders the complete application structure.
 * Sets up context providers, routing, and error boundaries.
 */
function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <UserProvider>
                    <EmotionProvider>
                        <BrowserRouter>
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
                                <Route path="recommendations" element={<Recommendations />} />
                                <Route path="movie-match" element={<MovieMatch />} />
                                <Route path="movie/:id" element={<MovieDetails />} />
                            </Route>
                        </Routes>
                        </BrowserRouter>
                    </EmotionProvider>
                </UserProvider>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App