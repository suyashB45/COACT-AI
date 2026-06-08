import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollProgress from './components/ui/ScrollProgress'
import ErrorBoundary from './components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'))
const Practice = lazy(() => import('./pages/Practice'))
const Conversation = lazy(() => import('./pages/Conversation'))
const Report = lazy(() => import('./pages/Report'))
const SessionHistory = lazy(() => import('./pages/SessionHistory'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const LimitReached = lazy(() => import('./pages/LimitReached'))
const SystemCheck = lazy(() => import('./pages/SystemCheck'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))

// Simple page loader for Suspense fallback
const PageLoader = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading...</p>
    </div>
)
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
                <Suspense fallback={<PageLoader />}>
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                        <Route path="/limit-reached" element={<ProtectedRoute><LimitReached /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
                        <Route path="/system-check/:sessionId" element={<ProtectedRoute><SystemCheck /></ProtectedRoute>} />
                        <Route path="/conversation/:sessionId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
                        <Route path="/report/:sessionId" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                    </Routes>
                </Suspense>
            </motion.div>
        </AnimatePresence>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ScrollProgress />
                <Toaster position="top-center" theme="dark" richColors />
                <AppContent />
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
