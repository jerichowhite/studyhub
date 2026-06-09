import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Pencil, FolderOpen, ArrowLeft } from 'lucide-react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

import ClassScheduleCalendar from '../components/studyarea/ClassScheduleCalendar';
import Whiteboard            from '../components/studyarea/Whiteboard';
import FileQuickAccess       from '../components/studyarea/FileQuickAccess';
import ContextualAI          from '../components/studyarea/ContextualAI';
import AddEventModal         from '../components/studyarea/AddEventModal';
import {
  startClassReminderService,
  stopClassReminderService,
} from '../services/classReminderService';

// ── StudyArea ─────────────────────────────────────────────────────────────────
const StudyArea = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [schedule,          setSchedule]          = useState([]);
  const [whiteboardContent, setWhiteboardContent]  = useState(null);
  const [openFile,          setOpenFile]           = useState(null);
  const [sidebarTab,        setSidebarTab]         = useState('schedule'); // 'schedule' | 'files'
  const [showModal,         setShowModal]          = useState(false);
  const [modalSlot,         setModalSlot]          = useState(null);
  const [editEvent,         setEditEvent]          = useState(null);
  const [mobilTab,          setMobilTab]           = useState('whiteboard'); // mobile active pane
  const [toast,             setToast]              = useState(null);
  const [sidebarWidth,      setSidebarWidth]       = useState(320);

  // ── Class reminder service ────────────────────────────────────────────────
  // scheduleRef lets the interval always read the latest schedule without
  // restarting the service on every schedule change.
  const scheduleRef = useRef(schedule);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    startClassReminderService(currentUser.uid, () => scheduleRef.current);
    return () => stopClassReminderService();
  }, [currentUser?.uid]);

  // ── Sidebar drag-resize ───────────────────────────────────────────────────
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(320);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const delta    = e.clientX - dragStartX.current;
      const newWidth = Math.max(200, Math.min(560, dragStartW.current + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor    = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load schedule from Firestore ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'scheduleEvents'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const evs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // Convert Firestore Timestamps to JS Dates for react-big-calendar
            start: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
            end:   data.endTime?.toDate   ? data.endTime.toDate()   : new Date(data.endTime),
          };
        });
        setSchedule(evs);
      },
      (error) => {
        console.error('Schedule listener error:', error);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

  // ── Save / update event ───────────────────────────────────────────────────
  const handleSaveEvent = async (eventData) => {
    if (!currentUser) return;
    try {
      const payload = {
        userId:    currentUser.uid,
        title:     eventData.title,
        type:      eventData.type,
        color:     eventData.color,
        startTime: eventData.start,
        endTime:   eventData.end,
        location:  eventData.location,
        instructor: eventData.instructor,
        notes:     eventData.notes,
        recurring: eventData.recurring,
        recurrence: eventData.recurrence,
        updatedAt: serverTimestamp(),
      };

      if (eventData.id) {
        await updateDoc(doc(db, 'scheduleEvents', eventData.id), payload);
        showToast('Event updated');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'scheduleEvents'), payload);
        showToast('Event added');
      }
      setShowModal(false);
      setEditEvent(null);
      setModalSlot(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save event', 'error');
    }
  };

  // ── Delete event ──────────────────────────────────────────────────────────
  const handleDeleteEvent = async (id) => {
    // Strip recurring instance suffix (id_YYYYMMDD → id)
    const baseId = id.includes('_') ? id.split('_').slice(0, -1).join('_') : id;
    try {
      await deleteDoc(doc(db, 'scheduleEvents', baseId));
      showToast('Event deleted');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete event', 'error');
    }
    setShowModal(false);
    setEditEvent(null);
  };

  const openAddModal = (slot) => {
    setModalSlot(slot);
    setEditEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditEvent(event);
    setModalSlot(null);
    setShowModal(true);
  };

  // ── Ask AI about a file ───────────────────────────────────────────────────
  const handleAskAIAboutFile = (file) => {
    setOpenFile(file);
    // ContextualAI picks up openFile and auto-sends the first message
  };

  const courses = userProfile?.courses || [];

  // ── Desktop layout ────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Study Area</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Your complete study workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile tab switcher */}
          <div className="flex md:hidden gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'schedule',   Icon: Calendar   },
              { id: 'whiteboard', Icon: Pencil      },
              { id: 'files',      Icon: FolderOpen  },
            ].map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setMobilTab(id)}
                className={`px-3 py-1 rounded text-sm transition flex items-center justify-center ${mobilTab === id ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {[
              { id: 'schedule', label: '📅 Schedule' },
              { id: 'files',    label: '📁 Files' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSidebarTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 ${
                  sidebarTab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {sidebarTab === 'schedule' ? (
              <ClassScheduleCalendar
                events={schedule}
                onSelectEvent={openEditModal}
                onAddEvent={openAddModal}
              />
            ) : (
              <FileQuickAccess
                onFileSelect={setOpenFile}
                onAskAIAboutFile={handleAskAIAboutFile}
              />
            )}
          </div>
        </div>

        {/* ── Drag-resize handle ─────────────────────────────────────────── */}
        <div
          className="hidden md:flex w-1.5 flex-shrink-0 cursor-col-resize items-center justify-center group bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          onMouseDown={(e) => {
            isDragging.current   = true;
            dragStartX.current   = e.clientX;
            dragStartW.current   = sidebarWidth;
            document.body.style.cursor     = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        >
          <div className="h-8 w-0.5 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
        </div>

        {/* ── Main workspace ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden min-w-0">
          {/* Desktop: always show whiteboard */}
          <div className="hidden md:flex h-full flex-col">
            <Whiteboard
              userId={currentUser?.uid}
              onContentChange={setWhiteboardContent}
            />
          </div>

          {/* Mobile: show active tab */}
          <div className="flex md:hidden h-full flex-col overflow-hidden">
            {mobilTab === 'schedule' && (
              <div className="h-full overflow-auto bg-white">
                <ClassScheduleCalendar
                  events={schedule}
                  onSelectEvent={openEditModal}
                  onAddEvent={openAddModal}
                />
              </div>
            )}
            {mobilTab === 'whiteboard' && (
              <Whiteboard
                userId={currentUser?.uid}
                onContentChange={setWhiteboardContent}
              />
            )}
            {mobilTab === 'files' && (
              <div className="h-full overflow-auto bg-white">
                <FileQuickAccess
                  onFileSelect={setOpenFile}
                  onAskAIAboutFile={handleAskAIAboutFile}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contextual AI (floating) ──────────────────────────────────────── */}
      <ContextualAI
        whiteboardContent={whiteboardContent}
        schedule={schedule}
        openFile={openFile}
        userCourses={courses}
      />

      {/* ── Add / Edit event modal ─────────────────────────────────────────── */}
      {showModal && (
        <AddEventModal
          initialSlot={modalSlot}
          existingEvent={editEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => { setShowModal(false); setEditEvent(null); setModalSlot(null); }}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg z-[4000] transition ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default StudyArea;
