import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Target, Download, BarChart3, Moon, Sun, Calculator, BookOpen, Award, PieChart, HelpCircle, RefreshCw, AlertCircle, Check, Menu, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'https://java-cgpa-calculator.onrender.com/api/courses';

const GRADING_SYSTEMS = {
  'LASU (5.0)': { A: 5.0, B: 4.0, C: 3.0, D: 2.0, E: 1.0, F: 0.0 }
};

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function CGPACalculator() {
  const [darkMode, setDarkMode] = useState(true);
  const [courses, setCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState({});
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, totalUnits: 0, totalGradePoints: 0 });
  const [semesterGPAs, setSemesterGPAs] = useState({});
  const [targetCGPA, setTargetCGPA] = useState('');
  const [requiredUnits, setRequiredUnits] = useState(120);
  const [activeTab, setActiveTab] = useState('calculator');
  const [showHelp, setShowHelp] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calculating, setCalculating] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const maxGPA = 5.0;

  const helpTexts = {
    units: "Units are the credit hours assigned to each course. In LASU, courses typically have 1-4 units based on their workload. For example: CSC 201 might be 3 units, MTH 101 might be 4 units.",
    cgpa: "CGPA (Cumulative Grade Point Average) is calculated by: (Total Grade Points) ÷ (Total Units). For example: If you score A(5) in a 3-unit course and B(4) in a 2-unit course: (5×3 + 4×2) ÷ (3+2) = 23÷5 = 4.60 CGPA",
    progress: "This shows how many units you've completed out of the total required for graduation. Most programs require 120-140 units to graduate.",
    whatif: "This feature calculates what GPA you need in future courses to reach your target. If it shows a number above 5.0, it means your target is impossible with the remaining units.",
    health: "Your Academic Health Score (0-100) combines three factors:\n• CGPA Score (60%): Your current performance\n• Trend Score (20%): Whether you're improving\n• Consistency Score (20%): How stable your grades are"
  };

  const apiCall = async (endpoint, method, data = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      if (method === 'DELETE') {
        return { success: true };
      }
      
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('', 'GET');
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Make sure the backend is running on http://localhost:8080 and CORS is enabled.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCGPA = async () => {
    try {
      const data = await apiCall('/cgpa', 'GET');
      setCgpaData(data);
    } catch (err) {
      console.error('Failed to fetch CGPA:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCGPA();
  }, []);

  const addCourse = (semester) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newCourse = {
      id: tempId,
      semester: semester,
      courseName: '',
      unit: '',
      grade: '',
      isPending: true
    };
    
    setPendingCourses(prev => ({
      ...prev,
      [semester]: [...(prev[semester] || []), newCourse]
    }));
  };

  const updatePendingCourse = (semester, courseId, field, value) => {
    setPendingCourses(prev => ({
      ...prev,
      [semester]: prev[semester].map(c =>
        c.id === courseId ? { ...c, [field]: value } : c
      )
    }));
  };

  const deletePendingCourse = (semester, courseId) => {
    setPendingCourses(prev => ({
      ...prev,
      [semester]: prev[semester].filter(c => c.id !== courseId)
    }));
  };

  const deleteSavedCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await apiCall(`/${courseId}`, 'DELETE');
      await fetchCourses();
      await fetchCGPA();
      
      const updatedCourses = courses.filter(c => c.id !== courseId);
      recalculateSemesterGPAs(updatedCourses);
    } catch (err) {
      alert('Failed to delete course. Please try again.');
      console.error(err);
    }
  };

  const calculateGPAForSemester = async (semester) => {
    const semesterPendingCourses = pendingCourses[semester] || [];
    
    const invalidCourses = semesterPendingCourses.filter(
      c => !c.courseName || !c.unit || !c.grade
    );
    
    if (invalidCourses.length > 0) {
      alert('Please fill in all fields (Course Name, Units, Grade) for all courses before calculating GPA.');
      return;
    }

    if (semesterPendingCourses.length === 0) {
      alert('Please add at least one course for this semester.');
      return;
    }

    try {
      setCalculating(prev => ({ ...prev, [semester]: true }));

      const savePromises = semesterPendingCourses.map(course =>
        apiCall('', 'POST', {
          semester: course.semester,
          courseName: course.courseName,
          unit: parseInt(course.unit),
          grade: course.grade
        })
      );

      await Promise.all(savePromises);

      setPendingCourses(prev => {
        const updated = { ...prev };
        delete updated[semester];
        return updated;
      });

      await fetchCourses();
      await fetchCGPA();

      const semesterGPAData = await apiCall(`/cgpa/semester/${encodeURIComponent(semester)}`, 'GET');
      setSemesterGPAs(prev => ({
        ...prev,
        [semester]: semesterGPAData.cgpa
      }));

    } catch (err) {
      alert('Failed to save courses and calculate GPA. Please try again.');
      console.error(err);
    } finally {
      setCalculating(prev => ({ ...prev, [semester]: false }));
    }
  };

  const recalculateSemesterGPAs = (coursesList) => {
    const semesters = {};
    coursesList.forEach(course => {
      if (!semesters[course.semester]) {
        semesters[course.semester] = [];
      }
      semesters[course.semester].push(course);
    });

    const newGPAs = {};
    Object.entries(semesters).forEach(([semester, semCourses]) => {
      const validCourses = semCourses.filter(c => c.unit && c.grade && c.gradePoint);
      if (validCourses.length > 0) {
        const totalPoints = validCourses.reduce((sum, c) => sum + (c.gradePoint * c.unit), 0);
        const totalUnits = validCourses.reduce((sum, c) => sum + c.unit, 0);
        newGPAs[semester] = totalUnits > 0 ? totalPoints / totalUnits : 0;
      }
    });

    setSemesterGPAs(newGPAs);
  };

  useEffect(() => {
    if (courses.length > 0) {
      recalculateSemesterGPAs(courses);
    }
  }, [courses]);

  const addSemester = () => {
    const existingSemesters = getAllSemesters();
    const newSemesterName = `Semester ${existingSemesters.length + 1}`;
    addCourse(newSemesterName);
  };

  const getAllSemesters = () => {
    const savedSemesters = [...new Set(courses.map(c => c.semester))];
    const pendingSemesters = Object.keys(pendingCourses);
    return [...new Set([...savedSemesters, ...pendingSemesters])];
  };

  const getSemesterCourses = (semester) => {
    const saved = courses.filter(c => c.semester === semester);
    const pending = pendingCourses[semester] || [];
    return { saved, pending };
  };

  const getGradeDistribution = () => {
    const distribution = {};
    courses.forEach(course => {
      if (course.grade) {
        distribution[course.grade] = (distribution[course.grade] || 0) + 1;
      }
    });
    return Object.entries(distribution).map(([grade, count]) => ({ grade, count }));
  };

  const getSemesterTrend = () => {
    return getAllSemesters().map(sem => ({
      name: sem,
      gpa: parseFloat((semesterGPAs[sem] || 0).toFixed(2))
    }));
  };

  const calculateRequiredGPA = () => {
    if (!targetCGPA) return null;
    const currentCGPA = cgpaData.cgpa;
    const currentUnits = cgpaData.totalUnits;
    const target = parseFloat(targetCGPA);
    
    const remainingUnits = requiredUnits - currentUnits;
    if (remainingUnits <= 0) return null;
    
    const requiredPoints = (target * requiredUnits) - (currentCGPA * currentUnits);
    const requiredGPA = requiredPoints / remainingUnits;
    
    return requiredGPA.toFixed(2);
  };

  const getAcademicHealthScore = () => {
    const cgpa = cgpaData.cgpa;
    const trend = getSemesterTrend();
    
    const cgpaScore = (cgpa / maxGPA) * 60;
    
    let trendScore = 0;
    if (trend.length > 1) {
      const recent = trend.slice(-3);
      const improving = recent.every((sem, i) => i === 0 || sem.gpa >= recent[i-1].gpa);
      trendScore = improving ? 20 : (recent[recent.length-1].gpa > recent[0].gpa ? 10 : 0);
    }
    
    const consistencyScore = trend.length > 0 ? 
      20 - (Math.max(...trend.map(t => t.gpa)) - Math.min(...trend.map(t => t.gpa))) * 5 : 0;
    
    return Math.min(100, Math.max(0, Math.round(cgpaScore + trendScore + Math.max(0, consistencyScore))));
  };

  const getHealthScoreBreakdown = () => {
    const cgpa = cgpaData.cgpa;
    const trend = getSemesterTrend();
    
    const cgpaScore = Math.round((cgpa / maxGPA) * 60);
    
    let trendScore = 0;
    if (trend.length > 1) {
      const recent = trend.slice(-3);
      const improving = recent.every((sem, i) => i === 0 || sem.gpa >= recent[i-1].gpa);
      trendScore = improving ? 20 : (recent[recent.length-1].gpa > recent[0].gpa ? 10 : 0);
    }
    
    const consistencyScore = trend.length > 0 ? 
      Math.max(0, Math.round(20 - (Math.max(...trend.map(t => t.gpa)) - Math.min(...trend.map(t => t.gpa))) * 5)) : 0;
    
    return { cgpaScore, trendScore, consistencyScore };
  };

  const exportToPDF = () => {
    const semesters = getAllSemesters();
    const content = `
CGPA REPORT - LASU
Generated: ${new Date().toLocaleDateString()}

SUMMARY
Overall CGPA: ${cgpaData.cgpa.toFixed(2)}
Total Units Completed: ${cgpaData.totalUnits}
Total Grade Points: ${cgpaData.totalGradePoints}
Academic Health Score: ${getAcademicHealthScore()}/100

SEMESTER BREAKDOWN
${semesters.map(sem => {
  const { saved } = getSemesterCourses(sem);
  const gpa = semesterGPAs[sem] || 0;
  return `
${sem} - GPA: ${gpa.toFixed(2)}
${saved.map(c => `  ${c.courseName}: Grade ${c.grade} (${c.unit} units) = ${c.gradePoint} points`).join('\n')}
Units: ${saved.reduce((sum, c) => sum + c.unit, 0)}
`;
}).join('\n')}

GRADE DISTRIBUTION
${getGradeDistribution().map(g => `${g.grade}: ${g.count} courses`).join('\n')}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lasu-cgpa-report.txt';
    a.click();
  };

  const HelpTooltip = ({ id, text }) => (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowHelp({...showHelp, [id]: true})}
        onMouseLeave={() => setShowHelp({...showHelp, [id]: false})}
        onClick={() => setShowHelp({...showHelp, [id]: !showHelp[id]})}
        className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
      >
        <HelpCircle size={16} />
      </button>
      {showHelp[id] && (
        <div className={`absolute z-50 left-0 mt-2 w-72 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );

  const bgClass = darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';
  const cardClass = darkMode ? 'bg-gray-800/50 backdrop-blur-lg border-gray-700' : 'bg-white/70 backdrop-blur-lg border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={`${textClass} text-xl`}>Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${bgClass} transition-all duration-500`}>
      <div className="flex ">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 ${cardClass} border-r transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Calculator className="text-purple-500" size={28} />
                <h2 className={`text-xl font-bold ${textClass}`}>LASU CGPA</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-purple-500/20 rounded-lg"
              >
                <X className={textClass} size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'calculator', icon: Calculator, label: 'Calculator' },
                { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                { id: 'goals', icon: Target, label: 'Goals & What-If' },
                { id: 'insights', icon: Award, label: 'Health Score' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : `${textSecondary} hover:bg-purple-500/20`
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} hover:bg-purple-500/20 transition-all`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={() => {
                  fetchCourses();
                  fetchCGPA();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} hover:bg-purple-500/20 transition-all mt-2`}
              >
                <RefreshCw size={20} />
                <span className="font-medium">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className='flex md:gap-10 items-center'>
              <div className="mb-6 ">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`mb-15 md:mb-6 cursor-pointer`}
                >
                  <Menu className={textClass} size={30} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 font-semibold">Connection Error</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                    <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                      <p className="text-red-200 text-xs font-mono">
                        <strong>Fix CORS Error:</strong> Add this to your Spring Boot controller:<br/>
                        <code className="block mt-1">@CrossOrigin(origins = "*")</code>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setError(null);
                        fetchCourses();
                      }}
                      className="mt-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-sm text-red-200 transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}
              <div className='flex  w-full justify-between items-center '>
                <div className={` p-6 mb-6 `}>
                  <h1 className={`text-2xl  md:text-4xl font-bold ${textClass} flex items-center gap-3`}>
                    <Calculator className="text-purple-500  hidden md:block" />
                    LASU CGPA CALCULATOR
                  </h1>
                  <p className={`${textSecondary} mt-2 text-sm md:text-lg`}>Track, analyze, and optimize your academic performance</p>
                </div>
                <div className='hidden md:block'>
                  <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full bg-purple-500 mb-10 flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} hover:bg-purple-600 transition-all`}
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>
           </div>
            {activeTab === 'calculator' && (
              <div className="space-y-6 max-w-6xl mx-auto ">
                <div className={`${cardClass} border rounded-2xl p-8 shadow-xl text-center`}>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`${textSecondary} text-sm uppercase tracking-wider`}>Current CGPA</div>
                    <HelpTooltip id="cgpa" text={helpTexts.cgpa} />
                  </div>
                  <div className={`text-6xl font-bold ${textClass} mb-4`}>{cgpaData.cgpa.toFixed(2)}</div>
                  <div className="flex justify-center gap-8 flex-wrap">
                    <div>
                      <div className="flex items-center justify-center">
                        <div className={`${textSecondary} text-sm`}>Total Units</div>
                        <HelpTooltip id="units" text={helpTexts.units} />
                      </div>
                      <div className={`text-2xl font-bold ${textClass}`}>{cgpaData.totalUnits}</div>
                    </div>
                    <div>
                      <div className={`${textSecondary} text-sm`}>Semesters</div>
                      <div className={`text-2xl font-bold ${textClass}`}>{getAllSemesters().length}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center">
                        <div className={`${textSecondary} text-sm`}>Progress</div>
                        <HelpTooltip id="progress" text={helpTexts.progress} />
                      </div>
                      <div className={`text-2xl font-bold ${textClass}`}>
                        {Math.min(100, Math.round((cgpaData.totalUnits / requiredUnits) * 100))}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cgpaData.totalUnits / requiredUnits) * 100)}%` }}
                    />
                  </div>
                  <p className={`${textSecondary} text-xs mt-2`}>
                    {cgpaData.totalUnits} / {requiredUnits} units completed
                  </p>
                </div>

                {getAllSemesters().map((semester) => {
                  const { saved, pending } = getSemesterCourses(semester);
                  const hasGPA = semesterGPAs[semester] !== undefined;
                  
                  return (
                    <div key={semester} className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className={`text-2xl font-bold ${textClass}`}>{semester}</h3>
                        {hasGPA && (
                          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                            <Check className="text-green-400" size={20} />
                            <div>
                              <div className={`${textSecondary} text-xs`}>Semester GPA</div>
                              <div className={`text-2xl font-bold ${textClass}`}>
                                {semesterGPAs[semester].toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {saved.length > 0 && (
                        <div className="mb-4">
                          <h4 className={`${textSecondary} text-sm font-semibold mb-2`}>Saved Courses:</h4>
                          <div className="space-y-2">
                            {saved.map((course) => (
                              <div key={course.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className={`col-span-4 ${textClass} font-medium`}>{course.courseName}</div>
                                <div className={`col-span-2 ${textSecondary} text-sm`}>{course.unit} units</div>
                                <div className={`col-span-2 ${textSecondary} text-sm`}>Grade: {course.grade}</div>
                                <div className={`col-span-3 ${textSecondary} text-sm`}>{course.gradePoint} pts</div>
                                <button
                                  onClick={() => deleteSavedCourse(course.id)}
                                  className="col-span-1 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pending.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <h4 className={`${textSecondary} text-sm font-semibold`}>New Courses (not yet saved):</h4>
                          {pending.map((course) => (
                            <div key={course.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <input
                                type="text"
                                placeholder="Course Name (e.g., CSC 201)"
                                value={course.courseName}
                                onChange={(e) => updatePendingCourse(semester, course.id, 'courseName', e.target.value)}
                                className={`md:col-span-5 px-4 py-3 rounded-xl ${cardClass} border ${textClass} placeholder-gray-500`}
                              />
                              <input
                                type="number"
                                placeholder="Units"
                                value={course.unit}
                                onChange={(e) => updatePendingCourse(semester, course.id, 'unit', e.target.value)}
                                className={`md:col-span-2 px-4 py-3 rounded-xl ${cardClass} border ${textClass} placeholder-gray-500`}
                              />
                              <select
                                value={course.grade}
                                onChange={(e) => updatePendingCourse(semester, course.id, 'grade', e.target.value)}
                                className={`md:col-span-4 px-4 py-3 rounded-xl ${cardClass} border ${textClass} cursor-pointer`}
                              >
                                <option value="">Select Grade</option>
                                {['A', 'B', 'C', 'D', 'E', 'F'].map(grade => (
                                  <option key={grade} value={grade}>{grade} ({GRADING_SYSTEMS['LASU (5.0)'][grade]})</option>
                                ))}
                              </select>
                              <button
                                onClick={() => deletePendingCourse(semester, course.id)}
                                className="md:col-span-1 p-3 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => addCourse(semester)}
                          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                        >
                          <Plus size={18} />
                          Add Course
                        </button>
                        
                        {pending.length > 0 && (
                          <button
                            onClick={() => calculateGPAForSemester(semester)}
                            disabled={calculating[semester]}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                          >
                            {calculating[semester] ? (
                              <>
                                <RefreshCw size={18} className="animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <Calculator size={18} />
                                Calculate GPA
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={addSemester}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-2xl transition-all font-semibold text-lg"
                >
                  <Plus size={20} />
                  Add New Semester
                </button>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6  max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                    <h3 className={`text-xl font-bold ${textClass} mb-4 flex items-center gap-2`}>
                      <TrendingUp className="text-purple-500" />
                      Semester GPA Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getSemesterTrend()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} domain={[0, maxGPA]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'),
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Line type="monotone" dataKey="gpa" stroke="#8b5cf6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                    <h3 className={`text-xl font-bold ${textClass} mb-4 flex items-center gap-2`}>
                      <PieChart className="text-purple-500" />
                      Grade Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={getGradeDistribution()}
                          dataKey="count"
                          nameKey="grade"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {getGradeDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'),
                            borderRadius: '0.5rem'
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                  <h3 className={`text-xl font-bold ${textClass} mb-4`}>Semester Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getSemesterTrend()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} domain={[0, maxGPA]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          border: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'),
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar dataKey="gpa" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                  <h3 className={`text-xl font-bold ${textClass} mb-4`}>Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-xl border border-purple-500/30">
                      <div className={`${textSecondary} text-sm mb-1`}>Highest GPA</div>
                      <div className={`text-2xl font-bold ${textClass}`}>
                        {getSemesterTrend().length > 0 ? Math.max(...getSemesterTrend().map(s => s.gpa)).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div className="p-4 bg-pink-500/20 rounded-xl border border-pink-500/30">
                      <div className={`${textSecondary} text-sm mb-1`}>Lowest GPA</div>
                      <div className={`text-2xl font-bold ${textClass}`}>
                        {getSemesterTrend().length > 0 ? Math.min(...getSemesterTrend().map(s => s.gpa)).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                      <div className={`${textSecondary} text-sm mb-1`}>Total Courses</div>
                      <div className={`text-2xl font-bold ${textClass}`}>
                        {courses.filter(c => c.grade).length}
                      </div>
                    </div>
                    <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                      <div className={`${textSecondary} text-sm mb-1`}>Avg Units/Sem</div>
                      <div className={`text-2xl font-bold ${textClass}`}>
                        {getAllSemesters().length > 0 ? (cgpaData.totalUnits / getAllSemesters().length).toFixed(1) : '0.0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6  max-w-6xl mx-auto">
                <div className={`${cardClass} border rounded-2xl p-8 shadow-xl`}>
                  <h3 className={`text-2xl font-bold ${textClass} mb-6 flex items-center gap-2`}>
                    <Target className="text-purple-500" />
                    Target CGPA Calculator
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`${textSecondary} text-sm mb-2 block`}>Target CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={`Enter target (0-${maxGPA})`}
                        value={targetCGPA}
                        onChange={(e) => setTargetCGPA(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl ${cardClass} border ${textClass}`}
                      />
                    </div>
                    <div>
                      <label className={`${textSecondary} text-sm mb-2 block`}>Total Required Units for Graduation</label>
                      <input
                        type="number"
                        value={requiredUnits}
                        onChange={(e) => setRequiredUnits(parseInt(e.target.value) || 120)}
                        className={`w-full px-4 py-3 rounded-xl ${cardClass} border ${textClass}`}
                      />
                    </div>
                  </div>

                  {calculateRequiredGPA() && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                      <div className={`${textSecondary} text-sm mb-2`}>Required GPA in Remaining Units:</div>
                      <div className={`text-4xl font-bold ${textClass}`}>
                        {calculateRequiredGPA()}
                      </div>
                      <div className={`${textSecondary} text-sm mt-2`}>
                        You need to maintain a {calculateRequiredGPA()} GPA in your remaining {requiredUnits - cgpaData.totalUnits} units to reach your target of {targetCGPA}
                      </div>
                      {parseFloat(calculateRequiredGPA()) > maxGPA && (
                        <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                          <p className="text-red-400 text-sm">
                            ⚠️ <strong>This target is mathematically impossible!</strong> The maximum GPA is {maxGPA}, but you would need {calculateRequiredGPA()} to reach your target. Consider lowering your target or taking more units.
                          </p>
                        </div>
                      )}
                      {parseFloat(calculateRequiredGPA()) <= maxGPA && parseFloat(calculateRequiredGPA()) > maxGPA * 0.9 && (
                        <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                          <p className="text-yellow-400 text-sm">
                            ⚠️ This target is very challenging! You'll need near-perfect grades (all A's) in all remaining courses.
                          </p>
                        </div>
                      )}
                      {parseFloat(calculateRequiredGPA()) <= maxGPA && parseFloat(calculateRequiredGPA()) <= maxGPA * 0.9 && parseFloat(calculateRequiredGPA()) > 0 && (
                        <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                          <p className="text-green-400 text-sm">
                            ✅ <strong>This target is achievable!</strong> Stay focused and maintain consistent performance in your remaining courses.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`${cardClass} border rounded-2xl p-8 shadow-xl`}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className={`text-2xl font-bold ${textClass}`}>What-If Scenarios</h3>
                    <HelpTooltip id="whatif" text={helpTexts.whatif} />
                  </div>
                  <p className={`${textSecondary} mb-6`}>
                    See how your CGPA would change if you take 15 units next semester with different grade outcomes:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { scenario: 'Best Case', desc: 'All A\'s', grade: 'A', color: 'green' },
                      { scenario: 'Expected', desc: 'Mix of A\'s & B\'s', grade: 'B', color: 'blue' },
                      { scenario: 'Worst Case', desc: 'All C\'s', grade: 'C', color: 'orange' }
                    ].map(({ scenario, desc, grade, color }) => {
                      const hypUnits = 15;
                      const currentCGPA = cgpaData.cgpa;
                      const currentUnits = cgpaData.totalUnits;
                      const gradePoint = GRADING_SYSTEMS['LASU (5.0)'][grade];
                      const newCGPA = currentUnits > 0 
                        ? ((currentCGPA * currentUnits) + (gradePoint * hypUnits)) / (currentUnits + hypUnits)
                        : gradePoint;
                      const change = newCGPA - currentCGPA;
                      const isImpossible = newCGPA > maxGPA;
                      
                      return (
                        <div key={scenario} className={`p-6 bg-gradient-to-br from-${color}-600/10 to-${color}-600/5 rounded-xl border border-${color}-500/20`}>
                          <div className={`${textSecondary} text-sm mb-1 font-semibold`}>{scenario}</div>
                          <div className={`text-3xl font-bold ${textClass} mb-2`}>
                            {isImpossible ? '❌' : newCGPA.toFixed(2)}
                          </div>
                          {!isImpossible && (
                            <div className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'} mb-2`}>
                              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)} from current
                            </div>
                          )}
                          {isImpossible && (
                            <div className="text-xs text-red-400 mb-2">
                              Would be {newCGPA.toFixed(2)} (exceeds max {maxGPA})
                            </div>
                          )}
                          <div className={`${textSecondary} text-xs`}>
                            {desc} ({grade} = {gradePoint})
                          </div>
                          <div className={`${textSecondary} text-xs mt-1`}>
                            15 units × {gradePoint} = {(gradePoint * 15).toFixed(0)} points
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className={`${textSecondary} text-sm`}>
                      <strong>How it works:</strong> Current total points = {cgpaData.cgpa.toFixed(2)} × {cgpaData.totalUnits} = {cgpaData.totalGradePoints.toFixed(1)} points. 
                      Add hypothetical points, divide by new total units. Note: CGPA cannot exceed {maxGPA}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6  max-w-6xl mx-auto">
                <div className={`${cardClass} border rounded-2xl p-8 shadow-xl text-center`}>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <h3 className={`text-2xl font-bold ${textClass}`}>Academic Health Score</h3>
                    <HelpTooltip id="health" text={helpTexts.health} />
                  </div>
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke={darkMode ? '#374151' : '#e5e7eb'}
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(getAcademicHealthScore() / 100) * 502.4} 502.4`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>
                        <div className={`text-5xl font-bold ${textClass}`}>{getAcademicHealthScore()}</div>
                        <div className={`text-sm ${textSecondary}`}>/ 100</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-3 mb-6">
                    {(() => {
                      const breakdown = getHealthScoreBreakdown();
                      return (
                        <>
                          <div className="flex justify-between items-center p-3 bg-purple-500/20 rounded-lg">
                            <span className={textSecondary}>CGPA Score (60% weight)</span>
                            <span className={`font-bold ${textClass}`}>{breakdown.cgpaScore}/60</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-pink-500/20 rounded-lg">
                            <span className={textSecondary}>Trend Score (20% weight)</span>
                            <span className={`font-bold ${textClass}`}>{breakdown.trendScore}/20</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                            <span className={textSecondary}>Consistency Score (20% weight)</span>
                            <span className={`font-bold ${textClass}`}>{breakdown.consistencyScore}/20</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <p className={`${textSecondary} max-w-md mx-auto text-sm`}>
                    Your score combines your current CGPA, semester trends, and grade consistency.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                    <h3 className={`text-xl font-bold ${textClass} mb-4`}>Performance Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={textSecondary}>Highest Semester GPA</span>
                        <span className={`font-bold ${textClass}`}>
                          {getSemesterTrend().length > 0 ? Math.max(...getSemesterTrend().map(s => s.gpa)).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={textSecondary}>Lowest Semester GPA</span>
                        <span className={`font-bold ${textClass}`}>
                          {getSemesterTrend().length > 0 ? Math.min(...getSemesterTrend().map(s => s.gpa)).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={textSecondary}>Total Courses</span>
                        <span className={`font-bold ${textClass}`}>
                          {courses.filter(c => c.grade).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={textSecondary}>Average Units/Semester</span>
                        <span className={`font-bold ${textClass}`}>
                          {getAllSemesters().length > 0 ? (cgpaData.totalUnits / getAllSemesters().length).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                    <h3 className={`text-xl font-bold ${textClass} mb-4`}>Smart Recommendations</h3>
                    <div className="space-y-3">
                      {cgpaData.cgpa >= maxGPA * 0.85 && (
                        <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                          <p className="text-green-400 text-sm">
                            🎉 <strong>Outstanding performance!</strong> Keep maintaining these high standards!
                          </p>
                        </div>
                      )}
                      {cgpaData.cgpa >= maxGPA * 0.7 && cgpaData.cgpa < maxGPA * 0.85 && (
                        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <p className="text-blue-400 text-sm">
                            👍 <strong>Good performance!</strong> Aim for more A's to push towards First Class honors.
                          </p>
                        </div>
                      )}
                      {cgpaData.cgpa < maxGPA * 0.6 && cgpaData.totalUnits > 0 && (
                        <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                          <p className="text-yellow-400 text-sm">
                            💡 <strong>Room for improvement:</strong> Consider seeking academic support!
                          </p>
                        </div>
                      )}
                      <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <p className="text-purple-400 text-sm">
                          📚 <strong>Progress Check:</strong> {cgpaData.totalUnits < requiredUnits * 0.25 
                            ? "You're early in your journey - build strong study habits now!"
                            : cgpaData.totalUnits < requiredUnits * 0.75
                            ? "You're making good progress!"
                            : "You're in the final stretch - finish strong!"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-2xl p-6 shadow-xl`}>
                  <h3 className={`text-xl font-bold ${textClass} mb-4`}>Export Report</h3>
                  <p className={`${textSecondary} mb-4 text-sm`}>
                    Download your complete academic report for your records.
                  </p>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all"
                  >
                    <Download size={18} />
                    Export Report (.txt)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
