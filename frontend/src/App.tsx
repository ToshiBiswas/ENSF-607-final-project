import { useState } from 'react';
import PaymentInfo from './components/PaymentInfo';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AIAdvice from './components/AIAdvice';
import './App.css';

function App() {
  //state to track which page is currently active
  const [activePage, setActivePage] = useState<'payment' | 'cart' | 'checkout' | 'ai'>('payment');

  return (
    <div className="App">
      {/*navigation bar*/}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/*logo/brand*/}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Event Planner</h1>
              </div>
              {/*navigation links*/}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActivePage('payment')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activePage === 'payment'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payment Methods
                </button>
                <button
                  onClick={() => setActivePage('cart')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activePage === 'cart'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Cart
                </button>
                <button
                  onClick={() => setActivePage('checkout')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activePage === 'checkout'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Checkout
                </button>
                <button
                  onClick={() => setActivePage('ai')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activePage === 'ai'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Advice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*mobile menu (simple dropdown)*/}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <button
              onClick={() => setActivePage('payment')}
              className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                activePage === 'payment'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActivePage('cart')}
              className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                activePage === 'cart'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Cart
            </button>
            <button
              onClick={() => setActivePage('checkout')}
              className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                activePage === 'checkout'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Checkout
            </button>
            <button
              onClick={() => setActivePage('ai')}
              className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                activePage === 'ai'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              AI Advice
            </button>
          </div>
        </div>
      </nav>

      {/*render active page component*/}
      <main>
        {activePage === 'payment' && <PaymentInfo />}
        {activePage === 'cart' && <Cart onNavigate={setActivePage} />}
        {activePage === 'checkout' && <Checkout onNavigate={setActivePage} />}
        {activePage === 'ai' && <AIAdvice />}
      </main>
    </div>
  );
}

export default App;
