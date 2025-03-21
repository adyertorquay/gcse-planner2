import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

function Home() {
  return (
    <div className="text-center space-y-6">
      <h2 className="text-3xl font-bold text-blue-700">Welcome to the GCSE Planner</h2>
      <p className="text-lg">Plan your revision efficiently and stay on track.</p>
      <Link to="/subject-setup" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-blue-700 transition">
        Get Started
      </Link>
    </div>
  );
}

function SubjectSetup({ setSubjects }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const subjectList = ['Maths', 'English', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'French', 'Spanish'];

  const handleToggle = (subject) => {
    setSelected((prev) => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const handleNext = () => {
    setSubjects(selected);
    navigate('/availability');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-blue-700">Choose Your Subjects</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {subjectList.map(subject => (
          <label key={subject} className="flex items-center space-x-2">
            <input type="checkbox" checked={selected.includes(subject)} onChange={() => handleToggle(subject)} className="accent-blue-600" />
            <span>{subject}</span>
          </label>
        ))}
      </div>
      <button onClick={handleNext} className="mt-6 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Next</button>
    </div>
  );
}

function Availability({ setAvailability }) {
  const navigate = useNavigate();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const slots = ['Morning', 'Afternoon', 'Evening'];
  const [grid, setGrid] = useState({});

  const toggleSlot = (day, slot) => {
    const key = `${day}-${slot}`;
    setGrid(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    const availableSlots = Object.entries(grid).filter(([_, v]) => v).map(([k]) => k);
    setAvailability(availableSlots);
    navigate('/timetable');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Select Your Available Time Slots</h2>
      <div className="overflow-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border p-2">Time</th>
              {days.map(day => (
                <th key={day} className="border p-2">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot}>
                <td className="border p-2 font-medium">{slot}</td>
                {days.map(day => {
                  const key = `${day}-${slot}`;
                  return (
                    <td key={key} className="border p-2 text-center">
                      <input type="checkbox" checked={!!grid[key]} onChange={() => toggleSlot(day, slot)} className="accent-blue-600" />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleNext} className="mt-6 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Generate Timetable</button>
    </div>
  );
}

function Timetable({ subjects, availability }) {
  const slots = [...availability];
  const timetable = slots.map((slot, i) => ({
    slot,
    subject: subjects[i % subjects.length]
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Your Revision Timetable</h2>
      <table className="w-full border-collapse bg-white shadow text-sm">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-100">Day</th>
            <th className="border p-2 bg-gray-100">Time</th>
            <th className="border p-2 bg-gray-100">Subject</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map(({ slot, subject }) => {
            const [day, time] = slot.split('-');
            return (
              <tr key={slot}>
                <td className="border p-2">{day}</td>
                <td className="border p-2">{time}</td>
                <td className="border p-2 text-blue-700 font-semibold">{subject}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState([]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <header className="bg-blue-700 text-white p-4 shadow">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">GCSE Planner</h1>
            <nav className="space-x-4">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/subject-setup" className="hover:underline">Subjects</Link>
              <Link to="/availability" className="hover:underline">Availability</Link>
              <Link to="/timetable" className="hover:underline">Timetable</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subject-setup" element={<SubjectSetup setSubjects={setSubjects} />} />
            <Route path="/availability" element={<Availability setAvailability={setAvailability} />} />
            <Route path="/timetable" element={<Timetable subjects={subjects} availability={availability} />} />
          </Routes>
        </main>

        <footer className="bg-blue-100 text-center text-sm p-4 mt-10">
          &copy; 2025 GCSE Planner. Built for students.
        </footer>
      </div>
    </Router>
  );
}
