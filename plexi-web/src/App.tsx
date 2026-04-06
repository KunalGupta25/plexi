import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Hub from "./pages/Hub";
import Assistant from "./pages/Assistant";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/hub/*" element={<Hub />} />
            <Route path="/assistant" element={<Assistant />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
