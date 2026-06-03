import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Conversation from './pages/Conversation'
import Report from './pages/Report'
import SessionHistory from './pages/SessionHistory'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import LimitReached from './pages/LimitReached'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollProgress from './components/ui/ScrollProgress'

import SystemCheck from './pages/SystemCheck'
import Login from './pages/Login'
function AppContent() {
    const location = useLocation()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                    <Route path="/limit-reached" element={<ProtectedRoute><LimitReached /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
                    <Route path="/system-check/:sessionId" element={<ProtectedRoute><SystemCheck /></ProtectedRoute>} />
                    <Route path="/conversation/:sessionId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
                    <Route path="/report/:sessionId" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    )
}

function App() {
    return (
        <BrowserRouter>
            <ScrollProgress />
            <Toaster position="top-center" theme="dark" richColors />
            <AppContent />
        </BrowserRouter>
    )
}

export default App
