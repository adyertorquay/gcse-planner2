import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore, addDays, isSameDay } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const allSubjects = [
  'Maths', 'English Language', 'English Literature', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish',
  'Business', 'Automotive', 'Religious Studies', 'Music',
  'Food Tech', 'Health and Social', 'IT', 'Construction', 'Statistics',
  'Sport', 'Design Technology', 'Media Studies'
];

const examDates = {
  'Health and Social': ['2025-05-06'],
  Construction: ['2025-05-06'],
  Business: ['2025-05-09', '2025-05-16'],
  'English Literature': ['2025-05-12', '2025-05-20'],
  'Religious Studies': ['2025-05-13', '2025-05-21'],
  Biology: ['2025-05-13', '2025-06-09'],
  Geography: ['2025-05-14', '2025-06-06', '2025-06-12'],
  'Media Studies': ['2025-05-14', '2025-05-22'],
  Maths: ['2025-05-15', '2025-06-04', '2025-06-11'],
  History: ['2025-05-16', '2025-06-05', '2025-06-10'],
  Chemistry: ['2025-05-19', '2025-06-13'],
  French: ['2025-05-21', '2025-06-05'],
  Physics: ['2025-05-22', '2025-06-16'],
  Sport: ['2025-05-22'],
  'English Language': ['2025-05-23', '2025-06-06'],
  Statistics: ['2025-06-02', '2025-06-13'],
  Automotive: ['2025-06-02'],
  IT: ['2025-06-09'],
  Spanish: ['2025-06-10', '2025-06-17'],
  Music: ['2025-06-05'],
  'Food Tech': ['2025-06-06'],
  'Design Technology': ['2025-06-18']
};

function GCSEPlanner() {
  const calendarRef = useRef();
  const today = new Date();
  const endDate = new Date('2025-07-19');

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availability, setAvailability] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const handleAvailabilityChange = (day, time) => {
    setAvailability(prev => {
      const daySlots = new Set(prev[day]);
      if (daySlots.has(time)) daySlots.delete(time);
      else daySlots.add(time);
      return { ...prev, [day]: Array.from(daySlots).sort() };
    });
  };

  const toggleSubject = subject => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const generateRevisionEvents = () => {
    const revisionEvents = [];
    const revisionDays = eachDayOfInterval({ start: today, end: endDate });
    const sessionMap = {};

    selectedSubjects.forEach(subject => {
      const subjectExamDates = examDates[subject] || [];
      const lastExam = subjectExamDates.map(d => parseISO(d)).sort((a, b) => b - a)[0];
      const availableDays = revisionDays.filter(day => isBefore(day, lastExam));
      const spread = Math.max(1, Math.floor(availableDays.length / selectedSubjects.length));

      for (let i = 0; i < spread && i < availableDays.length; i++) {
        const date = availableDays[i];
        const dayName = format(date, 'EEEE');
        const slots = availability[dayName];

        if (!slots || slots.length === 0) continue;

        const key = format(date, 'yyyy-MM-dd');
        if (!sessionMap[key]) sessionMap[key] = new Set();
        if (sessionMap[key].has(subject)) continue;

        revisionEvents.push({
          title: `Revise ${subject}`,
          date: key,
          color: '#3B82F6'
        });

        sessionMap[key].add(subject);
      }
    });

    return revisionEvents;
  };

  const exportPDF = () => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    html2canvas(calendarElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('gcse-timetable.pdf');
    });
  };

  const printPage = () => {
    window.print();
  };

  const addToGoogleCalendar = () => {
    const gcalUrl = 'https://calendar.google.com/calendar/u/0/r/eventedit?text=GCSE+Revision+Planner&details=This+is+your+revision+calendar+exported+from+GCSE+Planner&location=&sf=true';
    window.open(gcalUrl, '_blank');
  };

  const examEvents = Object.entries(examDates).flatMap(([subject, dates]) =>
    dates.map(date => ({
      title: `${subject} Exam`,
      date,
      color: '#FF5733'
    }))
  );

  const revisionEvents = generateRevisionEvents();

  return (
    <div className="p-6 font-sans">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">📘 GCSE Planner – Final Version</h1>
      <p className="text-gray-700 mb-4">Now with smart revision scheduling and custom availability.</p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Select Your Subjects</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {allSubjects.map(subject => (
            <label key={subject} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => toggleSubject(subject)}
              />
              <span>{subject}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.keys(availability).map(day => (
          <div key={day} className="bg-white p-3 shadow rounded">
            <h3 className="font-semibold text-blue-700 mb-2">{day}</h3>
            {timeSlots.map(slot => (
              <div key={slot}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={availability[day].includes(slot)}
                    onChange={() => handleAvailabilityChange(day, slot)}
                    className="mr-2"
                  />
                  {slot}
                </label>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
          Download PDF
        </button>
        <button onClick={printPage} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
          Print Timetable
        </button>
        <button onClick={addToGoogleCalendar} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow">
          Add to Google Calendar
        </button>
      </div>

      <div ref={calendarRef} className="bg-white p-4 rounded shadow-xl">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={[...examEvents, ...revisionEvents]}
          height={600}
        />
      </div>
    </div>
  );
}

export default GCSEPlanner;
