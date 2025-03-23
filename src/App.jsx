import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore, compareAsc, isEqual, subDays, addDays } from 'date-fns';
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
  'Health and Social': [['2025-05-06', 'AM']],
  Construction: [['2025-05-06', 'AM']],
  Business: [['2025-05-09', 'AM'], ['2025-05-16', 'AM']],
  'English Literature': [['2025-05-12', 'AM'], ['2025-05-20', 'AM']],
  'Religious Studies': [['2025-05-13', 'AM'], ['2025-05-21', 'AM']],
  Biology: [['2025-05-13', 'PM'], ['2025-06-09', 'PM']],
  Geography: [['2025-05-14', 'AM'], ['2025-06-06', 'PM'], ['2025-06-12', 'AM']],
  'Media Studies': [['2025-05-14', 'PM'], ['2025-05-22', 'PM']],
  Maths: [['2025-05-15', 'AM'], ['2025-06-04', 'AM'], ['2025-06-11', 'AM']],
  History: [['2025-05-16', 'PM'], ['2025-06-05', 'AM'], ['2025-06-10', 'PM']],
  Chemistry: [['2025-05-19', 'AM'], ['2025-06-13', 'AM']],
  French: [['2025-05-21', 'PM'], ['2025-06-05', 'PM']],
  Physics: [['2025-05-22', 'AM'], ['2025-06-16', 'AM']],
  Sport: [['2025-05-22', 'PM']],
  'English Language': [['2025-05-23', 'AM'], ['2025-06-06', 'AM']],
  Statistics: [['2025-06-02', 'PM'], ['2025-06-13', 'PM']],
  Automotive: [['2025-06-02', 'AM']],
  IT: [['2025-06-09', 'AM']],
  Spanish: [['2025-06-10', 'PM'], ['2025-06-17', 'AM']],
  Music: [['2025-06-05', 'AM']],
  'Food Tech': [['2025-06-06', 'AM']],
  'Design Technology': [['2025-06-18', 'PM']],
  'Hospitality & Catering': [['2025-06-12', 'PM']]
};

function GCSEPlanner() {
  const calendarRef = useRef();
  const startDate = new Date('2025-04-04');
  const endDate = new Date('2025-07-19');
  const intensiveStart = new Date('2025-04-22');

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
    const revisionDays = eachDayOfInterval({ start: startDate, end: endDate });
    const sessionMap = {};
    const daySlots = {};

    revisionDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayName = format(day, 'EEEE');
      daySlots[key] = availability[dayName] || [];
      sessionMap[key] = [];
    });

    const examSchedule = selectedSubjects.map(subject => {
      const exams = (examTimes[subject] || []).map(([date]) => parseISO(date));
      const finalExam = exams.sort(compareAsc)[exams.length - 1];
      return { subject, exams, finalExam };
    }).sort((a, b) => compareAsc(a.finalExam, b.finalExam));

    // Add day-before revision sessions and ensure 3 total sessions before each exam if possible
    examSchedule.forEach(({ subject, exams }) => {
      exams.forEach(examDate => {
        let added = 0;
        let cursor = subDays(examDate, 1);

        while (isBefore(startDate, cursor) && added < 3) {
          const key = format(cursor, 'yyyy-MM-dd');
          const slots = daySlots[key] || [];
          if (slots.length > 0 && !sessionMap[key].includes(subject)) {
            revisionEvents.push({ title: `Revise ${subject}`, date: key, color: '#1E40AF' });
            sessionMap[key].push(subject);
            added++;
          }
          cursor = subDays(cursor, 1);
        }
      });
    });

    // Balanced early phase
    revisionDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const slots = daySlots[key];
      if (!slots.length || sessionMap[key].length >= slots.length) return;

      const isEarlyPhase = isBefore(day, intensiveStart);
      if (isEarlyPhase) {
        for (const slot of slots) {
          const index = (revisionDays.indexOf(day) + slots.indexOf(slot)) % selectedSubjects.length;
          const subject = selectedSubjects[index];
          if (!sessionMap[key].includes(subject)) {
            revisionEvents.push({ title: `Revise ${subject}`, date: key, color: '#3B82F6' });
            sessionMap[key].push(subject);
            break;
          }
        }
      }
    });

    return revisionEvents;
  };

  const exportICS = () => {
    const events = [...examEvents, ...revisionEvents].map(e => {
      const [year, month, day] = e.date.split('-').map(Number);
      const hour = e.title.toLowerCase().includes('revise') ? 10 : (e.title.includes('2PM') ? 14 : 9);
      return {
        start: [year, month, day, hour, 0],
        duration: { hours: 1 },
        title: e.title,
        status: 'CONFIRMED'
      };
    });
    createEvents(events, (error, value) => {
      if (error) return console.log(error);
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gcse-timetable.ics';
      a.click();
    });
  };

  const examEvents = Object.entries(examTimes).flatMap(([subject, times]) =>
    selectedSubjects.includes(subject)
      ? times.map(([date, session]) => ({
          title: `${subject} Exam – ${session}`,
          date,
          color: '#FF5733'
        }))
      : []
  );

  const revisionEvents = generateRevisionEvents();

  return (
    <div className="p-6 font-sans">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">📘 GCSE Planner – Smart Revision + .ICS</h1>

      <div className="mb-6">
        <button onClick={exportICS} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow">
          Export Calendar (.ics)
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={[...examEvents, ...revisionEvents]}
        height={600}
      />
    </div>
  );
}

export default GCSEPlanner;