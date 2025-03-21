import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-blue-700">GCSE Planner Loaded</h1>
      <p className="mt-4 text-gray-600">If you see this, your app is running correctly.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
