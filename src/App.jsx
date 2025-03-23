import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore, compareAsc, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { createEvents } from 'ics';

const allSubjects = [
  'Maths', 'English Language', 'English Literature', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish', 'Business', 'Automotive', 'Religious Studies',
  'Music', 'Food Tech', 'Health and Social', 'IT', 'Construction', 'Statistics', 'Sport',
  'Design Technology', 'Media Studies', 'Hospitality & Catering'
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
  'Design Technology': ['2025-06-18'],
  'Hospitality & Catering': ['2025-06-12']
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
      const exams = (examDates[subject] || []).map(parseISO).sort(compareAsc);
      const finalExam = exams[exams.length - 1];
      return { subject, exams, finalExam };
    }).sort((a, b) => compareAsc(a.finalExam, b.finalExam));

    // Priority 1: Day-before-exam revision
    examSchedule.forEach(({ subject, exams }) => {
      exams.forEach(examDate => {
        const dayBefore = format(subDays(examDate, 1), 'yyyy-MM-dd');
        const slots = daySlots[dayBefore] || [];
        for (const slot of slots) {
          if (!sessionMap[dayBefore].includes(subject)) {
            revisionEvents.push({ title: `Revise ${subject}`, date: dayBefore, color: '#1E40AF' });
            sessionMap[dayBefore].push(subject);
            break;
          }
        }
      });
    });

    // Priority 2: Fairly balanced revision leading to nearest exams
    revisionDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const slots = daySlots[key];
      if (!slots.length || sessionMap[key].length >= slots.length) return;

      // Find most urgent subjects
      const upcomingSubjects = examSchedule
        .filter(({ exams }) => exams.some(exam => isBefore(day, exam)))
        .sort((a, b) => compareAsc(a.exams.find(d => isBefore(day, d)), b.exams.find(d => isBefore(day, d))));

      for (const slot of slots) {
        for (const { subject } of upcomingSubjects) {
          if (!sessionMap[key].includes(subject)) {
            revisionEvents.push({ title: `Revise ${subject}`, date: key, color: '#60A5FA' });
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
      const [hour, minute] = (e.time || '09:00').split(':').map(Number); // Use real time if available
      return {
        start: [year, month, day, hour, minute],
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

}