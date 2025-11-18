import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Homepage from "./pages/homepage";
import MyAccount from "./pages/MyAccount";
import MyAccountDashboard from "./pages/MyAccountDashboard";
import MyTickets from "./pages/MyTickets";
import MyInfo from "./pages/MyInfo";
import MyPaymentInfo from "./pages/MyPaymentInfo";
import TransactionHistory from "./pages/TransactionHistory";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import AIAdvice from "./components/AIAdvice";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Navbar visible in all pages */}
        <Navbar />

        {/* Routes define what component appears for each URL path */}
        <Routes>
          {/* When user visits /, show homepage */}
          <Route path="/" element={<Homepage />} />
          
          {/* MyAccount with nested routes */}
          <Route path="/MyAccount" element={<MyAccount />}>
            <Route index element={<MyAccountDashboard />} />
            <Route path="MyTickets" element={<MyTickets />} />
            <Route path="MyInfo" element={<MyInfo />} />
            <Route path="MyPaymentInfo" element={<MyPaymentInfo />} />
            <Route path="TransactionHistory" element={<TransactionHistory />} />
          </Route>

          {/* Cart, Checkout, and AI Advice routes */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/ai-advice" element={<AIAdvice />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
