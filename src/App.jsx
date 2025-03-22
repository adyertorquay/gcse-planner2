import React, { useState, useRef } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const allSubjects = [
  'Maths', 'English', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'French', 'Spanish'
];

const timeBlocks = ['Morning (9–10)', 'Afternoon (1–2)', 'Evening (6–7)', 'Evening (7–8)', 'Evening (8–9)'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function GCSEPlanner() {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [startDate, setStartDate] = useState('2025-04-04');
  const [endDate, setEndDate] = useState('2025-07-19');
  const [availability, setAvailability] = useState({});
  const printRef = useRef();

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
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
      const startHour = time.includes('Morning') ? '09' : time.includes('Afternoon') ? '13' : time.includes('6–7') ? '18' : time.includes('7–8') ? '19' : '20';
      const startDateTime = `${date}T${startHour}00`;
      const endDateTime = `${date}T${('0' + (parseInt(startHour) + 1)).slice(-2)}00`;

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
    <div className="p-6 max-w-5xl mx-auto">
      {timetable.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📅 FullCalendar View</h2>
          <div ref={printRef} className="bg-white shadow rounded p-4">
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
  );
}