// import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Homepage from "./pages/homepage";
import MyAccount from "./pages/MyAccount";

function App(){
  return (
    <Router>

      {/* Navbar visible in all pages */}
      {/* <Navbar />*/}

      {/* Routes define what component appears for each URL path */}
      <Routes>
        {/* When user visits /, show homepage */}
        <Route path="/" element={<Homepage />} />
        <Route path="/MyAccount" element={<MyAccount />} />

      </Routes>
    </Router>
  )
}

export default App;

