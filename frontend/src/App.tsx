import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Homepage from "./pages/homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import About from "./pages/About";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Navbar visible in all pages */}
        <Navbar />

        {/* Routes define what component appears for each URL path */}
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<Homepage />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Events route */}
          <Route path="/events" element={<Events />} />
          
          {/* About route */}
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
