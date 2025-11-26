import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Homepage from "./pages/homepage";
import MyAccount from "./pages/MyAccount";
import MyAccountDashboard from "./pages/MyAccountDashboard";
import MyTickets from "./pages/MyTickets";
import MyInfo from "./pages/MyInfo";
import MyPaymentInfo from "./pages/MyPaymentInfo";
import TransactionHistory from "./pages/TransactionHistory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import AIAdvice from "./components/AIAdvice";
import PaymentInfo from "./components/PaymentInfo";
import AdvicePage from "./pages/AdvicePage";
import EventPageWithParams from "./pages/EventPage";

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
          {/* MyAccount with nested routes */}
          <Route path="/MyAccount" element={<MyAccount />}>
            <Route index element={<MyAccountDashboard />} />
            <Route path="MyTickets" element={<MyTickets />} />
            <Route path="MyInfo" element={<MyInfo />} />
            <Route path="MyPaymentInfo" element={<MyPaymentInfo />} />
            <Route path="TransactionHistory" element={<TransactionHistory />} />
          </Route>

          {/* Cart, Checkout, AI Advice, and Payment Info routes */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/ai-advice" element={<AIAdvice />} />
          <Route path="/advice" element={<AdvicePage />} />
          <Route path="/payment-info" element={<PaymentInfo />} />
          <Route path="/events/:id" element={<EventPageWithParams />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
