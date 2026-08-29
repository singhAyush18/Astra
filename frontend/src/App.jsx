import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import RunHistory from "./pages/RunHistory";
import About from "./pages/About";
import ActiveRun from "./pages/ActiveRun";
import RunSummary from "./pages/RunSummary";
import TerritoryMap from "./pages/TerritoryMap";
import Settings from "./pages/Settings";
import Clans from "./pages/Clans";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#141428',
          color: '#e8e0d0',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          fontFamily: "'Inter', sans-serif"
        }
      }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/about" element={<About />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><RunHistory /></ProtectedRoute>} />
          <Route path="/run" element={<ProtectedRoute><ActiveRun /></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute><RunSummary /></ProtectedRoute>} />
          <Route path="/territories" element={<ProtectedRoute><TerritoryMap /></ProtectedRoute>} />
          <Route path="/clans" element={<ProtectedRoute><Clans /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
