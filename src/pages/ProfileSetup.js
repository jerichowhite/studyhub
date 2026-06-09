import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { completeUserProfile, uploadProfilePhoto } from '../services/userService';
import { validateDisplayName, sanitizeInput } from '../utils/validation';

// ─── Static data ────────────────────────────────────────────────────────────

const UNIVERSITIES = ['Benson Idahosa University'];

const FIXED_DEPARTMENT = 'Computer Science';

// CS at BIU: 100–400 only. No 500 level.
const LEVEL_OPTIONS = [
  { value: '100', yearLabel: 'Year 1' },
  { value: '200', yearLabel: 'Year 2' },
  { value: '300', yearLabel: 'Year 3' },
  { value: '400', yearLabel: 'Year 4' },
];

// Real BIU CS courses, split by level and semester.
// Courses are plain strings — the full "CSC XXX - Title" label.
const COURSES_BY_LEVEL = {
  '100': {
    first: [
      'CHM 111 - General Chemistry I (Physical and Inorganic)',
      'CHM 113 - Practical Chemistry I',
      'CSC 111 - Introduction to Computing I',
      'CSC 112 - Introduction to Computer Practical',
      'FRN 111 - Communication in French I',
      'GST 111 - Communication in English I',
      'GST 112 - Logic, Philosophy and Human Existence',
      'GST 113 - Nigerian Peoples and Culture',
      'IDS 111 - Rudiments of Christian Life',
      'MTH 111 - Algebra and Trigonometry',
      'MTH 112 - Statistics for Physical Sciences and Engineering',
      'PHY 111 - General Physics',
      'PHY 113 - General Physics Laboratory I',
    ],
    second: [
      'CSC 121 - Introduction to Computing II',
      'CSC 122 - Programming in Visual Basic',
      'CSC 123 - Visual Basic.NET/Basic Practical',
      'FRN 121 - Communication in French II',
      'GST 121 - Use of Library, Study Skills and ICT',
      'GST 122 - Communication in English II',
      'GST 124 - History and Philosophy of Science',
      'IDS 121 - Life and Times of the Archbishop Benson Idahosa',
      'MTH 121 - Vector and Geometry',
      'MTH 122 - Calculus',
      'PHY 121 - General Physics II',
      'PHY 123 - General Physics Laboratory II',
    ],
  },
  '200': {
    first: [
      'CSC 211 - Business Application and File Processing',
      'CSC 212 - Structured Programming and Algorithm',
      'CSC 213 - Database Management System',
      'CSC 214 - Digital Computer Design I',
      'CSC 215 - Computational Science Using MATLAB',
      'CSC 216 - Database Management System Practical',
      'CSC 217 - Hardware Practical I',
      'GST 112 - Logic, Philosophy and Human Existence',
      'IDS 111 - Rudiments of Christian Life',
      'MTH 211 - Linear Algebra',
      'MTH 212 - Sets, Logic and Algebra',
    ],
    second: [
      'CSC 221 - Programming in C++',
      'CSC 222 - Assembly Language Programming',
      'CSC 223 - Digital Computer Design II',
      'CSC 224 - C++ Practical',
      'CSC 225 - Assembly Language Practical',
      'CSC 226 - Hardware Laboratory II',
      'CSC 227 - Introduction to Web Design',
      'CSC 228 - Web Design Practical',
      'CSC 229 - Data Structure and Processing I',
      'ENT 328 - Introduction to Entrepreneurial Studies',
      'GST 222 - Peace and Conflict Resolution',
      'MTH 222 - Operations Research',
      'MTH 223 - Introduction to Numerical Analysis',
    ],
  },
  '300': {
    first: [
      'CSC 311 - Programming in Java',
      'CSC 312 - Compiler Construction',
      'CSC 313 - Computer Architecture and Organization',
      'CSC 314 - Network and Graph Theory',
      'CSC 315 - Computer Network',
      'CSC 316 - Real Time Application for Computer Systems',
      'CSC 317 - Java Practical',
      'ENT 318 - Introduction to Entrepreneurial Skills',
      'MTH 310 - Numerical Methods',
    ],
    second: [
      'CSC 321 - Student Industrial Work Experience Scheme (SIWES)',
    ],
  },
  '400': {
    first: [
      'CSC 411 - Net-Centric Computing',
      'CSC 412 - Software Engineering',
      'CSC 413 - Advanced Database Management System',
      'CSC 414 - Systems Analysis and Design',
      'CSC 415 - Artificial Intelligence',
      'CSC 416 - Seminar',
      'CSC 417 - Human Computer Interaction',
      'CSC 419 - Principles of Operating System',
    ],
    second: [
      'CSC 421 - Final Year Project I',
      'CSC 423 - Computer Graphics',
      'CSC 424 - Management Information Systems',
      'CSC 425 - Distributed Computing',
      'CSC 426 - Information Security',
      'CSC 427 - Formal Language and Automata',
    ],
  },
};

const STUDY_TIMES = [
  { value: 'early_morning', label: 'Early Morning (5am–8am)' },
  { value: 'morning', label: 'Morning (8am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–4pm)' },
  { value: 'evening', label: 'Evening (4pm–8pm)' },
  { value: 'night', label: 'Night (8pm–12am)' },
];

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual', desc: 'Diagrams, videos, charts' },
  { value: 'auditory', label: 'Auditory', desc: 'Lectures, discussions' },
  { value: 'reading', label: 'Reading / Writing', desc: 'Textbooks, notes' },
  { value: 'kinesthetic', label: 'Kinesthetic', desc: 'Hands-on, practice' },
];

// ─── Step progress bar ───────────────────────────────────────────────────────

const STEPS = ['University', 'Courses', 'Preferences', 'Review'];

const ProgressBar = ({ currentStep }) => (
  <div className="px-8 pt-6 pb-4 bg-white border-b border-gray-100">
    <div className="flex items-center">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium hidden sm:block ${
                  isActive ? 'text-blue-700' : isDone ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  isDone ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Individual steps ────────────────────────────────────────────────────────

const Step1University = ({ data, onChange, errors }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold text-gray-900">University Information</h2>
      <p className="text-sm text-gray-500 mt-1">Tell us about where you study</p>
    </div>

    {/* University */}
    <div>
      <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1.5">
        University <span className="text-red-500">*</span>
      </label>
      <select
        id="university"
        value={data.university}
        onChange={(e) => onChange('university', e.target.value)}
        className={`block w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
          errors.university ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <option value="">Select your university</option>
        {UNIVERSITIES.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      {errors.university && <p className="mt-1.5 text-xs text-red-600">{errors.university}</p>}
    </div>

    {/* Department — fixed */}
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-1.5">Department</p>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Department</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{FIXED_DEPARTMENT}</p>
        </div>
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">Fixed</span>
      </div>
    </div>

    {/* Level — clickable cards, 100–400 only */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Current Level <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {LEVEL_OPTIONS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange('level', level.value)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              data.level === level.value
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
            }`}
          >
            <p className="text-2xl font-bold">{level.value}</p>
            <p className="text-xs mt-1">{level.yearLabel}</p>
          </button>
        ))}
      </div>
      {errors.level && <p className="mt-1.5 text-xs text-red-600">{errors.level}</p>}
    </div>

    {/* Matric number (optional) */}
    <div>
      <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
        Matriculation Number <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="matricNumber"
        type="text"
        value={data.matricNumber}
        onChange={(e) => onChange('matricNumber', e.target.value)}
        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="e.g. BIU/2021/0001"
        maxLength={30}
      />
    </div>
  </div>
);

const Step2Courses = ({ data, onChange, errors }) => {
  const availableCourses = COURSES_BY_LEVEL[data.level]?.[data.semester] || [];

  const toggleCourse = (course) => {
    const updated = data.courses.includes(course)
      ? data.courses.filter((c) => c !== course)
      : [...data.courses, course];
    onChange('courses', updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Select Your Courses</h2>
        <p className="text-sm text-gray-500 mt-1">
          {FIXED_DEPARTMENT} — {data.level} Level &nbsp;·&nbsp; Select at least 3 courses
        </p>
      </div>

      {errors.courses && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {errors.courses}
        </p>
      )}

      {/* Semester picker */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Select Semester <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'first', short: '1st', label: 'First Semester' },
            { value: 'second', short: '2nd', label: 'Second Semester' },
          ].map(({ value, short, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('semester', value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                data.semester === value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
              }`}
            >
              <p className="text-lg font-bold">{short}</p>
              <p className="text-xs mt-1">{label}</p>
            </button>
          ))}
        </div>
        {errors.semester && <p className="mt-1.5 text-xs text-red-600">{errors.semester}</p>}
      </div>

      {/* Course list — only shown once a semester is chosen */}
      {data.semester && (
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Select Your Courses{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              ({availableCourses.length} available)
            </span>
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {availableCourses.map((course) => {
              const isSelected = data.courses.includes(course);
              return (
                <label
                  key={course}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCourse(course)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">{course}</span>
                </label>
              );
            })}
          </div>

          {/* Select / Deselect all */}
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={() => onChange('courses', availableCourses)}
              className="text-xs text-blue-600 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onChange('courses', [])}
              className="text-xs text-gray-500 hover:underline"
            >
              Deselect All
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            {data.courses.length} course{data.courses.length !== 1 ? 's' : ''} selected
            {data.courses.length < 3 && ` — select ${3 - data.courses.length} more`}
          </p>
        </div>
      )}
    </div>
  );
};

const Step3Preferences = ({ data, onChange, photoPreview, onPhotoChange, errors }) => {
  const toggleStudyTime = (value) => {
    const current = data.studyPreferences.preferredTimes;
    const updated = current.includes(value)
      ? current.filter((t) => t !== value)
      : [...current, value];
    onChange('studyPreferences', { ...data.studyPreferences, preferredTimes: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Personalise your StudyHub experience</p>
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={data.displayName}
          onChange={(e) => onChange('displayName', e.target.value)}
          className={`block w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.displayName ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="How should we call you?"
          maxLength={50}
        />
        {errors.displayName && <p className="mt-1.5 text-xs text-red-600">{errors.displayName}</p>}
      </div>

      {/* Profile photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
          </div>
          <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            {photoPreview ? 'Change Photo' : 'Upload Photo'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPhotoChange}
            />
          </label>
        </div>
      </div>

      {/* Preferred study times */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Study Times <span className="text-gray-400 font-normal">(select all that apply)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STUDY_TIMES.map(({ value, label }) => {
            const isSelected = data.studyPreferences.preferredTimes.includes(value);
            return (
              <label
                key={value}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStudyTime(value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Learning style */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Learning Style</p>
        <div className="grid grid-cols-2 gap-2">
          {LEARNING_STYLES.map(({ value, label, desc }) => {
            const isSelected = data.studyPreferences.learningStyle === value;
            return (
              <label
                key={value}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition select-none ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="learningStyle"
                    checked={isSelected}
                    onChange={() =>
                      onChange('studyPreferences', {
                        ...data.studyPreferences,
                        learningStyle: value,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </div>
                <span className="text-xs text-gray-500 ml-6">{desc}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Notification preferences */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Notifications</p>
        <div className="space-y-2">
          {[
            { key: 'emailNotifications', label: 'Email notifications' },
            { key: 'inAppNotifications', label: 'In-app notifications' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.studyPreferences[key]}
                onChange={(e) =>
                  onChange('studyPreferences', {
                    ...data.studyPreferences,
                    [key]: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReviewRow = ({ label, value, onEdit }) => (
  <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value || '—'}</p>
    </div>
    <button
      type="button"
      onClick={onEdit}
      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0 mt-0.5"
    >
      Edit
    </button>
  </div>
);

const Step4Review = ({ data, photoPreview, onEdit }) => {
  const semesterLabel = data.semester === 'first' ? 'First Semester' : data.semester === 'second' ? 'Second Semester' : '—';
  const courseLabels = data.courses.join(', ');

  const timeLabels = STUDY_TIMES.filter((t) =>
    data.studyPreferences.preferredTimes.includes(t.value)
  )
    .map((t) => t.label)
    .join(', ');

  const styleLabel =
    LEARNING_STYLES.find((s) => s.value === data.studyPreferences.learningStyle)?.label || '—';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review Your Profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Check everything looks correct before submitting
        </p>
      </div>

      {photoPreview && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <img src={photoPreview} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" />
          <span className="text-sm text-gray-600">Profile photo selected</span>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">University</h3>
        <ReviewRow label="University" value={data.university} onEdit={() => onEdit(1)} />
        <ReviewRow label="Department" value={FIXED_DEPARTMENT} onEdit={() => onEdit(1)} />
        <ReviewRow label="Level" value={data.level ? `${data.level} Level` : ''} onEdit={() => onEdit(1)} />
        {data.matricNumber && (
          <ReviewRow label="Matric Number" value={data.matricNumber} onEdit={() => onEdit(1)} />
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Courses ({data.courses.length})
        </h3>
        <ReviewRow label="Semester" value={semesterLabel} onEdit={() => onEdit(2)} />
        <ReviewRow label="Selected Courses" value={courseLabels} onEdit={() => onEdit(2)} />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Preferences</h3>
        <ReviewRow label="Display Name" value={data.displayName} onEdit={() => onEdit(3)} />
        <ReviewRow label="Learning Style" value={styleLabel} onEdit={() => onEdit(3)} />
        <ReviewRow
          label="Preferred Study Times"
          value={timeLabels || 'None selected'}
          onEdit={() => onEdit(3)}
        />
        <ReviewRow
          label="Notifications"
          value={[
            data.studyPreferences.emailNotifications && 'Email',
            data.studyPreferences.inAppNotifications && 'In-app',
          ]
            .filter(Boolean)
            .join(', ') || 'None'}
          onEdit={() => onEdit(3)}
        />
      </div>
    </div>
  );
};

// ─── Main ProfileSetup component ────────────────────────────────────────────

const ProfileSetup = () => {
  const { currentUser, setUserData } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    university: '',
    department: FIXED_DEPARTMENT,
    level: '',
    semester: '',
    matricNumber: '',
    courses: [],
    displayName: '',
    studyPreferences: {
      preferredTimes: [],
      learningStyle: 'visual',
      emailNotifications: true,
      inAppNotifications: true,
    },
  });

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }
  if (!currentUser.emailVerified) {
    navigate('/verify-email', { replace: true });
    return null;
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Cascade resets: level change wipes semester + courses; semester change wipes courses
      if (field === 'level') { updated.semester = ''; updated.courses = []; }
      if (field === 'semester') { updated.courses = []; }
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Per-step validation ──────────────────────────────────────────────────

  const validateStep1 = () => {
    const errs = {};
    if (!formData.university) errs.university = 'Please select your university';
    if (!formData.level) errs.level = 'Please select your current level';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.semester) errs.semester = 'Please select a semester';
    if (formData.courses.length < 3) errs.courses = 'Please select at least 3 courses';
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    const nameError = validateDisplayName(formData.displayName);
    if (nameError) errs.displayName = nameError;
    return errs;
  };

  const handleNext = () => {
    let errs = {};
    if (step === 1) errs = validateStep1();
    if (step === 2) errs = validateStep2();
    if (step === 3) errs = validateStep3();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleJumpToStep = (targetStep) => {
    setErrors({});
    setStep(targetStep);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');

    try {
      let photoURL = null;
      if (photoFile) {
        photoURL = await uploadProfilePhoto(currentUser.uid, photoFile);
      }

      const profileData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: sanitizeInput(formData.displayName),
        photoURL,
        university: formData.university,
        department: FIXED_DEPARTMENT,
        level: parseInt(formData.level, 10),
        semester: formData.semester,
        matricNumber: sanitizeInput(formData.matricNumber) || null,
        courses: formData.courses,
        studyPreferences: formData.studyPreferences,
        emailVerified: true,
        profileCompleted: true,
        onboardingComplete: true,
        points: 0,
        currentLevel: 'Freshman Helper',
        badges: [],
        rank: null,
      };

      await completeUserProfile(currentUser.uid, profileData);

      // Update context synchronously so ProtectedRoute sees the completed profile
      // on the very next render — no Firestore round-trip required.
      setUserData({ ...profileData, id: currentUser.uid });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Profile setup error:', err);
      setSubmitError('Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 pt-6 pb-0">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Step {step} of {STEPS.length}</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Let&apos;s set up your profile</h1>
          </div>

          <ProgressBar currentStep={step} />

          <div className="px-8 py-6">
            {submitError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            {step === 1 && (
              <Step1University data={formData} onChange={handleFieldChange} errors={errors} />
            )}
            {step === 2 && (
              <Step2Courses data={formData} onChange={handleFieldChange} errors={errors} />
            )}
            {step === 3 && (
              <Step3Preferences
                data={formData}
                onChange={handleFieldChange}
                photoPreview={photoPreview}
                onPhotoChange={handlePhotoChange}
                errors={errors}
              />
            )}
            {step === 4 && (
              <Step4Review
                data={formData}
                photoPreview={photoPreview}
                onEdit={handleJumpToStep}
              />
            )}
          </div>

          <div className="px-8 pb-8 flex justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Complete Profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
