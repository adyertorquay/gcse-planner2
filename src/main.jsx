import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SubjectSetup from './pages/SubjectSetup';
import Availability from './pages/Availability';
import Timetable from './pages/Timetable';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/subject-setup' element={<SubjectSetup />} />
        <Route path='/availability' element={<Availability />} />
        <Route path='/timetable' element={<Timetable />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
