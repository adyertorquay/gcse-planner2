import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Firebase config (placeholder)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exam dates
const examDates = {
  Maths: new Date("2025-05-07"),
  English: new Date("2025-06-10"),
  Biology: new Date("2025-05-13"),
  Chemistry: new Date("2025-05-16"),
  Physics: new Date("2025-05-20"),
  Geography: new Date("2025-05-21"),
  History: new Date("2025-05-23"),
  French: new Date("2025-06-03"),
  Spanish: new Date("2025-06-05")
};

function SubjectSetup({ setSubjects }) {
  const allSubjects = Object.keys(examDates);
  const [selected, setSelected] = useState([]);

  const toggle = (subject) => {
    setSelected((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Select Your Subjects</h2>
      <div className="flex flex-wrap gap-3">
        {allSubjects.map((subject) => (
          <button key={subject} onClick={() => toggle(subject)}
            className={`px-4 py-2 border rounded ${
              selected.includes(subject) ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}>
            {subject}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setSubjects(selected);
          navigate("/availability");
        }}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Next: Set Availability
      </button>
    </div>
  );
}

function Availability({ setAvailability }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['6-7', '7-8', '8-9'];
  const [selected, setSelected] = useState([]);

  const toggle = (slot) => {
    setSelected((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const isSelected = (slot) => selected.includes(slot);

  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Select Your 1-Hour Availability</h2>
      {days.map((day) => (
        <div key={day}>
          <h3 className="font-semibold mt-4">{day}</h3>
          <div className="flex gap-2 mt-1">
            {times.map((time) => {
              const slot = `${day}-${time}`;
              return (
                <button key={slot} onClick={() => toggle(slot)}
                  className={`px-3 py-1 border rounded ${
                    isSelected(slot) ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}>
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={() => {
          setAvailability(selected);
          navigate("/timetable");
        }}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Generate Timetable
      </button>
    </div>
  );
}

function Timetable({ subjects, availability, user }) {
  const printRef = useRef();

  const sortedSubjects = [...subjects].sort((a, b) =>
    (examDates[a] || new Date("2025-06-30")) - (examDates[b] || new Date("2025-06-30"))
  );

  const timetable = availability.map((slot, i) => ({
    slot,
    subject: sortedSubjects[i % sortedSubjects.length]
  }));

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('revision-timetable.pdf');
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Your Timetable</h2>
      <div ref={printRef} className="bg-white p-4 rounded shadow">
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="border p-2">Day</th>
              <th className="border p-2">Time</th>
              <th className="border p-2">Subject</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map(({ slot, subject }) => {
              const [day, time] = slot.split("-");
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
      <div className="flex gap-4 mt-6 flex-wrap">
        <button onClick={handlePrint} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700">Print</button>
        <button onClick={handleDownloadPDF} className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700">Download PDF</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState([]);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <Router>
      <header className="flex justify-between items-center bg-blue-800 text-white px-6 py-4">
        <h1 className="text-xl font-bold">GCSE Planner</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <span>Hi, {user.displayName}</span>
            <button onClick={logout} className="bg-white text-blue-800 px-3 py-1 rounded">Logout</button>
          </div>
        ) : (
          <button onClick={login} className="bg-white text-blue-800 px-3 py-1 rounded">Login with Google</button>
        )}
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<SubjectSetup setSubjects={setSubjects} />} />
          <Route path="/availability" element={<Availability setAvailability={setAvailability} />} />
          <Route path="/timetable" element={<Timetable subjects={subjects} availability={availability} user={user} />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
