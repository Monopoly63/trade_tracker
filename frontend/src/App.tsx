import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import TradeDetail from "./pages/TradeDetail";
import Analytics from "./pages/Analytics";
import Strategies from "./pages/Strategies";
import RiskReview from "./pages/RiskReview";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/trades/:id" element={<TradeDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/risk-review" element={<RiskReview />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;