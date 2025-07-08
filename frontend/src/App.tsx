import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Markets from "./pages/Markets";
import Trade from "./pages/Trade";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Markets />} />
        <Route path="/trade/:symbol" element={<Trade />} />
      </Routes>
    </Router>
  );
}
export default App;