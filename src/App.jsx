
import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const subjects = ['Maths', 'English', 'Biology', 'Chemistry', 'Physics'];
const times = ['6–7pm', '7–8pm', '8–9pm'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function App() {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availability, setAvailability] = useState({});
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const printRef = useRef();

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const toggleSlot = (day, time) => {
    const key = `${day}-${time}`;
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const generateTimetable = () => {
    const slots = Object.keys(availability).filter(k => availability[k]);
    return slots.map((slot, i) => ({
      slot,
      subject: selectedSubjects[i % selectedSubjects.length]
    }));
  };

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('timetable.pdf');
  };

  return (
    <div className="p-6 font-sans max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">GCSE Planner</h1>

      <h2 className="text-lg font-semibold mb-2">Select your subjects</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {subjects.map(sub => (
          <button key={sub} onClick={() => toggleSubject(sub)}
            className={`px-4 py-2 rounded-full ${selectedSubjects.includes(sub) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {sub}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-2">Select your date range</h2>
      <div className="flex gap-4 mb-4">
        <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="p-2 border rounded" />
        <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="p-2 border rounded" />
      </div>

      <h2 className="text-lg font-semibold mb-2">Select your availability</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {days.map(day => (
          <div key={day}>
            <h3 className="font-semibold">{day}</h3>
            <div className="flex flex-wrap gap-2">
              {times.map(time => {
                const key = `${day}-${time}`;
                return (
                  <button key={key} onClick={() => toggleSlot(day, time)}
                    className={`px-3 py-1 rounded ${availability[key] ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-2">Your Timetable</h2>
      <div ref={printRef} className="bg-white shadow rounded p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Day</th>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Subject</th>
            </tr>
          </thead>
          <tbody>
            {generateTimetable().map(({ slot, subject }, i) => {
              const [day, time] = slot.split('-');
              return (
                <tr key={i} className="border-t">
                  <td className="p-2">{day}</td>
                  <td className="p-2">{time}</td>
                  <td className="p-2 font-medium text-blue-700">{subject}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={handleDownloadPDF} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Download PDF
        </button>
      </div>
    </div>
  );
}

export default App;
