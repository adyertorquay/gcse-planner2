import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Firebase and Google API Config
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

function loadGapiScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => gapi.load('client:auth2', resolve);
    document.body.appendChild(script);
  });
}

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

// Components: Home, SubjectSetup, Availability, Timetable
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
  const subjectList = Object.keys(examDates);

  const handleToggle = (subject) => {
    setSelected(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
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
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr><th className="border p-2">Time</th>{days.map(day => <th key={day} className="border p-2">{day}</th>)}</tr>
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
      <button onClick={handleNext} className="mt-6 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Generate Timetable</button>
    </div>
  );
}

function Timetable({ subjects, availability, user }) {
  const slots = [...availability];
  const printRef = useRef();

  const sortedSubjects = [...subjects].sort((a, b) => {
    const dateA = examDates[a] || new Date("2025-06-30");
    const dateB = examDates[b] || new Date("2025-06-30");
    return dateA - dateB;
  });

  const timetable = slots.map((slot, i) => ({
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

  const handleAddToCalendar = async () => {
    if (!user) return alert("You must be signed in to use Google Calendar");

    await loadGapiScript();
    await gapi.client.init({
      apiKey: firebaseConfig.apiKey,
      clientId: "YOUR_OAUTH_CLIENT_ID",
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: "https://www.googleapis.com/auth/calendar.events"
    });

    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    if (!isSignedIn) await gapi.auth2.getAuthInstance().signIn();

    timetable.forEach(({ slot, subject }) => {
      const [day, time] = slot.split('-');
      const start = new Date();
      start.setDate(start.getDate() + ((7 + ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(day) - start.getDay()) % 7));
      start.setHours(time === 'Morning' ? 9 : time === 'Afternoon' ? 13 : 17);
      start.setMinutes(0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const event = {
        summary: `GCSE Revision: ${subject}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() }
      };

      gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
    });

    alert('Revision sessions added to Google Calendar!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Your Smart Revision Timetable</h2>
      <div ref={printRef} className="bg-white p-4 rounded shadow">
        <table className="w-full border-collapse bg-white text-sm">
          <thead><tr><th className="border p-2">Day</th><th className="border p-2">Time</th><th className="border p-2">Subject</th></tr></thead>
          <tbody>
            {timetable.map(({ slot, subject }) => {
              const [day, time] = slot.split('-');
              return <tr key={slot}><td className="border p-2">{day}</td><td className="border p-2">{time}</td><td className="border p-2 text-blue-700 font-semibold">{subject}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-6 flex-wrap">
        <button onClick={handlePrint} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700">Print</button>
        <button onClick={handleDownloadPDF} className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700">Download PDF</button>
        <button onClick={handleAddToCalendar} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Add to Google Calendar</button>
      </div>
    </div>
  );
}

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => await signInWithPopup(auth, provider);
  const handleSignOut = async () => await signOut(auth);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <header className="bg-blue-700 text-white p-4 shadow">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">GCSE Planner</h1>
            <nav className="space-x-4">
              <Link to="/">Home</Link>
              <Link to="/subject-setup">Subjects</Link>
              <Link to="/availability">Availability</Link>
              <Link to="/timetable">Timetable</Link>
              {user ? (
                <>
                  <span className="ml-4">{user.displayName}</span>
                  <button onClick={handleSignOut} className="ml-2 bg-red-500 px-3 py-1 rounded">Sign Out</button>
                </>
              ) : (
                <button onClick={handleSignIn} className="ml-4 bg-green-500 px-3 py-1 rounded">Sign In with Google</button>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subject-setup" element={<SubjectSetup setSubjects={setSubjects} />} />
            <Route path="/availability" element={<Availability setAvailability={setAvailability} />} />
            <Route path="/timetable" element={<Timetable subjects={subjects} availability={availability} user={user} />} />
          </Routes>
        </main>
        <footer className="bg-blue-100 text-center text-sm p-4 mt-10">
          &copy; 2025 GCSE Planner. Built for students.
        </footer>
      </div>
    </Router>
  );
}
