
import React, { useState, useRef } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const allSubjects = [
  'Maths', 'English', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish',
  'Business', 'Automotive', 'Religious Studies', 'Music',
  'Food Tech', 'Health and Social', 'IT'
];

const timeBlocks = [
  'Morning (8–9)', 'Morning (9–10)', 'Morning (10–11)', 'Morning (11–12)',
  'Afternoon (12–1)', 'Afternoon (1–2)', 'Afternoon (2–3)', 'Afternoon (3–4)', 'Afternoon (4–5)', 'Afternoon (5–6)',
  'Evening (6–7)', 'Evening (7–8)', 'Evening (8–9)', 'Evening (9–10)'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function GCSEPlanner() {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [startDate, setStartDate] = useState('2025-04-04');
  const [endDate, setEndDate] = useState('2025-07-19');
  const [availability, setAvailability] = useState({});
  const printRef = useRef();

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleTimeBlock = (day, block) => {
    const key = `${day}-${block}`;
    setAvailability((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const generateSchedule = () => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const daysList = eachDayOfInterval({ start, end });
    const timetable = [];
    let subjectIndex = 0;

    daysList.forEach((date) => {
      const dayName = format(date, 'EEEE');
      timeBlocks.forEach((block) => {
        const key = `${dayName}-${block}`;
        if (availability[key]) {
          const subject = selectedSubjects[subjectIndex % selectedSubjects.length];
          timetable.push({
            date: format(date, 'yyyy-MM-dd'),
            time: block,
            subject
          });
          subjectIndex++;
        }
      });
    });

    return timetable;
  };

  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('revision-timetable.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddToCalendar = () => {
    const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    generateSchedule().forEach(({ date, time, subject }) => {
      const hourMatch = time.match(/(\d+)(–(\d+))?/);
      const startHour = hourMatch ? ('0' + hourMatch[1]).slice(-2) : '09';
      const endHour = hourMatch && hourMatch[3] ? ('0' + hourMatch[3]).slice(-2) : ('0' + (parseInt(startHour) + 1)).slice(-2);

      const startDateTime = `${date}T${startHour}00`;
      const endDateTime = `${date}T${endHour}00`;
      const url = `${gcalBase}&text=GCSE+Revision:+${encodeURIComponent(subject)}&dates=${startDateTime}/${endDateTime}&details=Scheduled+study+session&sf=true&output=xml`;
      window.open(url, '_blank');
    });
  };

  const timetable = generateSchedule();
  const calendarEvents = timetable.map(({ date, time, subject }) => ({
    title: `${subject} (${time})`,
    start: date
  }));

  return (
    <div className="bg-yellow-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-5xl mx-auto py-10 px-6">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-4">🎓 GCSE Planner</h1>
        <p className="text-lg text-gray-600 mb-8">Build your personalised revision schedule and export it!</p>

        <div className="bg-white shadow-md p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-2">1️⃣ Select Your Subjects</h2>
          <div className="flex flex-wrap gap-3">
            {allSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`px-4 py-2 rounded border ${selectedSubjects.includes(subject) ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border-purple-600'} hover:opacity-80`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-md p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-2">2️⃣ Select Date Range</h2>
          <div className="flex gap-4">
            <div>
              <label className="block font-semibold mb-1">Start Date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded w-full" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">3️⃣ Select Your Availability</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {days.map((day) => (
              <div key={day}>
                <h3 className="font-bold text-purple-700 mb-2">{day}</h3>
                {timeBlocks.map((block) => {
                  const key = `${day}-${block}`;
                  return (
                    <label key={key} className="block text-sm">
                      <input
                        type="checkbox"
                        checked={availability[key] || false}
                        onChange={() => toggleTimeBlock(day, block)}
                        className="mr-2"
                      />
                      {block}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {timetable.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-purple-700 mb-4">📅 Your Revision Timetable</h2>
            <div ref={printRef} className="bg-white shadow p-4 rounded-lg">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                height="auto"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Print</button>
              <button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download PDF</button>
              <button onClick={handleAddToCalendar} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Add to Google Calendar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
