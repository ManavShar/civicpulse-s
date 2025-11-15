import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { MapView } from "./pages/MapView";
import { Incidents } from "./pages/Incidents";
import { WorkOrders } from "./pages/WorkOrders";
import { Predictions } from "./pages/Predictions";
import { AgentConsole } from "./pages/AgentConsole";
import { Replay } from "./pages/Replay";
import { Scenarios } from "./pages/Scenarios";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDataFetching } from "./hooks/useDataFetching";
import { ThemeProvider } from "./contexts/ThemeContext";

function AppContent() {
  // Initialize WebSocket connection and data fetching
  useWebSocket();
  useDataFetching();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="agents" element={<AgentConsole />} />
          <Route path="replay" element={<Replay />} />
          <Route path="scenarios" element={<Scenarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
