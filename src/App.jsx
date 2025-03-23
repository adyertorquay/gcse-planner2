import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore, compareAsc, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { createEvents } from 'ics';

const allSubjects = [
  'Maths', 'English Language', 'English Literature', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish',
  'Business', 'Automotive', 'Religious Studies', 'Music',
  'Food Tech', 'Health and Social', 'IT', 'Construction', 'Statistics',
  'Sport', 'Design Technology', 'Media Studies', 'Hospitality & Catering'
];

const examTimes = {
  '2025-05-06': '09:00',
  '2025-05-09': '13:30',
  '2025-05-12': '09:00',
  '2025-05-13': '13:30',
  '2025-05-14': '09:00',
  '2025-05-15': '09:00',
  '2025-05-16': '13:30',
  '2025-05-19': '09:00',
  '2025-05-20': '13:30',
  '2025-05-21': '09:00',
  '2025-05-22': '13:30',
  '2025-05-23': '09:00',
  '2025-06-02': '13:30',
  '2025-06-04': '09:00',
  '2025-06-05': '13:30',
  '2025-06-06': '09:00',
  '2025-06-09': '13:30',
  '2025-06-10': '09:00',
  '2025-06-11': '13:30',
  '2025-06-12': '09:00',
  '2025-06-13': '09:00',
  '2025-06-16': '13:30',
  '2025-06-17': '09:00',
  '2025-06-18': '13:30'
};

const examDates = {
  'Health and Social': ['2025-05-06'],
  'Construction': ['2025-05-06'],
  'Business': ['2025-05-09', '2025-05-16'],
  'English Literature': ['2025-05-12', '2025-05-20'],
  'Religious Studies': ['2025-05-13', '2025-05-21'],
  'Biology': ['2025-05-13', '2025-06-09'],
  'Geography': ['2025-05-14', '2025-06-06', '2025-06-12'],
  'Media Studies': ['2025-05-14', '2025-05-22'],
  'Maths': ['2025-05-15', '2025-06-04', '2025-06-11'],
  'History': ['2025-05-16', '2025-06-05', '2025-06-10'],
  'Chemistry': ['2025-05-19', '2025-06-13'],
  'French': ['2025-05-21', '2025-06-05'],
  'Physics': ['2025-05-22', '2025-06-16'],
  'Sport': ['2025-05-22'],
  'English Language': ['2025-05-23', '2025-06-06'],
  'Statistics': ['2025-06-02', '2025-06-13'],
  'Automotive': ['2025-06-02'],
  'IT': ['2025-06-09'],
  'Spanish': ['2025-06-10', '2025-06-17'],
  'Music': ['2025-06-05'],
  'Food Tech': ['2025-06-06'],
  'Design Technology': ['2025-06-18'],
  'Hospitality & Catering': ['2025-05-06']
};

function GCSEPlanner() {
  const calendarRef = useRef();
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availability, setAvailability] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });

  const startDate = new Date('2025-04-04');
  const endDate = new Date('2025-07-19');
  const intensiveStart = new Date('2025-04-22');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const handleAvailabilityChange = (day, time) => {
    setAvailability(prev => {
      const updated = new Set(prev[day]);
      if (updated.has(time)) updated.delete(time);
      else updated.add(time);
      return { ...prev, [day]: Array.from(updated).sort() };
    });
  };

  const toggleSubject = subject => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const revisionEvents = () => {
    const events = [];
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const sessions = {};

    allDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      sessions[key] = [];
    });

    const schedule = selectedSubjects.map(subject => {
      const exams = (examDates[subject] || []).map(parseISO);
      const final = exams.sort(compareAsc).at(-1);
      return { subject, exams, final };
    }).sort((a, b) => compareAsc(a.final, b.final));

    schedule.forEach(({ subject, exams }) => {
      exams.forEach(date => {
        const dayBefore = format(subDays(date, 1), 'yyyy-MM-dd');
        const dayName = format(subDays(date, 1), 'EEEE');
        const available = availability[dayName];
        if (available && available.length) {
          const time = available[0];
          if (!sessions[dayBefore].includes(subject)) {
            events.push({
              title: `Revise ${subject}`,
              date: dayBefore,
              time,
              color: '#1E40AF'
            });
            sessions[dayBefore].push(subject);
          }
        }
      });
    });

    return events;
  };

  const exportICS = () => {
    const examEvents = selectedSubjects.flatMap(subject => {
      return (examDates[subject] || []).map(date => {
        const [y, m, d] = date.split('-').map(Number);
        const [h, min] = (examTimes[date] || '09:00').split(':').map(Number);
        return {
          start: [y, m, d, h, min],
          duration: { hours: 1 },
          title: `${subject} Exam – ${examTimes[date] || '09:00'}`,
          status: 'CONFIRMED'
        };
      });
    });

    const revEvents = revisionEvents().map(({ title, date, time }) => {
      const [y, m, d] = date.split('-').map(Number);
      const [h, min] = time.split(':').map(Number);
      return {
        start: [y, m, d, h, min],
        duration: { hours: 1 },
        title,
        status: 'CONFIRMED'
      };
    });

    createEvents([...examEvents, ...revEvents], (error, value) => {
      if (error) return console.error(error);
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gcse-calendar.ics';
      a.click();
    });
  };

  const fullEvents = [
    ...selectedSubjects.flatMap(subject =>
      (examDates[subject] || []).map(date => ({
        title: `${subject} Exam – ${examTimes[date] || '09:00'}`,
        date,
        color: '#FF5733'
      }))
    ),
    ...revisionEvents()
  ];

  return (
    <div className="p-6 font-sans">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">📘 GCSE Planner</h1>
      <p className="text-gray-700 mb-4">Smart revision & ICS export with correct timings.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {allSubjects.map(subject => (
          <label key={subject} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedSubjects.includes(subject)}
              onChange={() => toggleSubject(subject)}
              className="mr-2"
            />
            {subject}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(availability).map(([day, slots]) => (
          <div key={day} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2 text-blue-700">{day}</h3>
            {timeSlots.map(slot => (
              <label key={slot} className="block text-sm">
                <input
                  type="checkbox"
                  checked={slots.includes(slot)}
                  onChange={() => handleAvailabilityChange(day, slot)}
                  className="mr-2"
                />
                {slot}
              </label>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={exportICS} className="bg-yellow-600 text-white px-4 py-2 rounded">Export Calendar (.ics)</button>
      </div>

      <div ref={calendarRef} className="bg-white p-4 rounded shadow-xl">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={fullEvents}
          height={600}
        />
      </div>
    </div>
  );
}

export default GCSEPlanner;