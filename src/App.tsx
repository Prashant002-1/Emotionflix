import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/common'
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
                                    <Route path="profile" element={<UserProfile />} />
                                    <Route path="log" element={<Log />} />
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