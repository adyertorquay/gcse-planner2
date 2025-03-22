import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const allSubjects = [
  'Maths', 'English', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish',
  'Business', 'Automotive', 'Religious Studies', 'Music',
  'Food Tech', 'Health and Social', 'IT', 'Construction', 'Statistics',
  'Sport', 'Design Technology', 'Media Studies'
];

const timeBlocks = [
  'Morning (8–9)', 'Morning (9–10)', 'Morning (10–11)', 'Morning (11–12)',
  'Afternoon (12–1)', 'Afternoon (1–2)', 'Afternoon (2–3)', 'Afternoon (3–4)', 'Afternoon (4–5)', 'Afternoon (5–6)',
  'Evening (6–7)', 'Evening (7–8)', 'Evening (8–9)', 'Evening (9–10)'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const examDates = {
  Maths: '2025-05-21',
  English: '2025-06-10',
  Biology: '2025-05-13',
  Chemistry: '2025-05-16',
  Physics: '2025-05-20',
  Geography: '2025-05-22',
  History: '2025-05-23',
  French: '2025-06-03',
  Spanish: '2025-06-05',
  Business: '2025-05-24',
  Automotive: '2025-06-07',
  'Religious Studies': '2025-05-17',
  Music: '2025-06-06',
  'Food Tech': '2025-06-08',
  'Health and Social': '2025-06-09',
  IT: '2025-06-04',
  Construction: '2025-06-11',
  Statistics: '2025-06-12',
  Sport: '2025-06-13',
  'Design Technology': '2025-06-14',
  'Media Studies': '2025-06-16'
};
