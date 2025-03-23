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
  'Health and Social': [{ date: '2025-05-06', time: '09:00' }],
  Construction: [{ date: '2025-05-06', time: '13:30' }],
  Business: [
    { date: '2025-05-09', time: '09:00' },
    { date: '2025-05-16', time: '13:30' }
  ],
  'English Literature': [
    { date: '2025-05-12', time: '09:00' },
    { date: '2025-05-20', time: '09:00' }
  ],
  'Religious Studies': [
    { date: '2025-05-13', time: '13:30' },
    { date: '2025-05-21', time: '13:30' }
  ],
  Biology: [
    { date: '2025-05-13', time: '09:00' },
    { date: '2025-06-09', time: '09:00' }
  ],
  Geography: [
    { date: '2025-05-14', time: '13:30' },
    { date: '2025-06-06', time: '09:00' },
    { date: '2025-06-12', time: '13:30' }
  ],
  'Media Studies': [
    { date: '2025-05-14', time: '09:00' },
    { date: '2025-05-22', time: '13:30' }
  ],
  Maths: [
    { date: '2025-05-15', time: '09:00' },
    { date: '2025-06-04', time: '09:00' },
    { date: '2025-06-11', time: '09:00' }
  ],
  History: [
    { date: '2025-05-16', time: '09:00' },
    { date: '2025-06-05', time: '13:30' },
    { date: '2025-06-10', time: '09:00' }
  ],
  Chemistry: [
    { date: '2025-05-19', time: '09:00' },
    { date: '2025-06-13', time: '09:00' }
  ],
  French: [
    { date: '2025-05-21', time: '09:00' },
    { date: '2025-06-05', time: '13:30' }
  ],
  Physics: [
    { date: '2025-05-22', time: '09:00' },
    { date: '2025-06-16', time: '09:00' }
  ],
  Sport: [{ date: '2025-05-22', time: '13:30' }],
  'English Language': [
    { date: '2025-05-23', time: '09:00' },
    { date: '2025-06-06', time: '09:00' }
  ],
  Statistics: [
    { date: '2025-06-02', time: '09:00' },
    { date: '2025-06-13', time: '13:30' }
  ],
  Automotive: [{ date: '2025-06-02', time: '13:30' }],
  IT: [{ date: '2025-06-09', time: '13:30' }],
  Spanish: [
    { date: '2025-06-10', time: '09:00' },
    { date: '2025-06-17', time: '09:00' }
  ],
  Music: [{ date: '2025-06-05', time: '09:00' }],
  'Food Tech': [{ date: '2025-06-06', time: '13:30' }],
  'Design Technology': [{ date: '2025-06-18', time: '09:00' }],
  'Hospitality & Catering': [{ date: '2025-06-10', time: '13:30' }]
};

// App.jsx will be continued...
