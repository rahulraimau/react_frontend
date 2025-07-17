import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';

// Define your backend API base URL
const API_BASE_URL = 'https://job-analytic-backend.onrender.com/api/analytics';
// Main App Component
const App = () => {
  // --- Static Mock Data (Only for charts that don't have dynamic backend endpoints yet, like Top 5 Roles) ---
  const topRolesAdjustedData = [
    { Role: 'Backend Web Developer', Count: 357 },
    { Role: 'Frontend Web Developer', Count: 353 },
    { Role: 'Full-Stack Developer', Count: 345 },
    { Role: 'DevOps Engineer', Count: 300 },
    { Role: 'UI/UX Designer', Count: 280 },
  ];

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#8A2BE2', '#DC143C'];

  // --- State Variables ---
  const [loading, setLoading] = useState(true);
  const [currentISTTime, setCurrentISTTime] = useState('');

  // State for Filters
  const [selectedWorkType, setSelectedWorkType] = useState('All');
  const [selectedQualification, setSelectedQualification] = useState('All');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('All');

  // State for actual fetched data
  const [workTypeData, setWorkTypeData] = useState([]);
  const [qualificationData, setQualificationData] = useState([]);
  const [experienceData, setExperienceData] = useState([]);
  const [salaryRangeData, setSalaryRangeData] = useState([]);
  const [jobPortalData, setJobPortalData] = useState([]);
  const [jobTrendData, setJobTrendData] = useState([]);
  const [top10CompaniesData, setTop10CompaniesData] = useState([]);
  const [companySizeVsCompanyData, setCompanySizeVsCompanyData] = useState([]);

  // All possible filter options (fetched from backend)
  const [allWorkTypeOptions, setAllWorkTypeOptions] = useState([]);
  const [allQualificationOptions, setAllQualificationOptions] = useState([]);
  const [allExperienceOptions, setAllExperienceOptions] = useState([]);


  // Function to get current IST time string
  const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istOffset = 330 * 60000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(utc + istOffset);

    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const hours = String(istTime.getHours()).padStart(2, '0');
    const minutes = String(istTime.getMinutes()).padStart(2, '0');
    const seconds = String(istTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} [IST]`;
  };

  // Function to check if current time is within 3 PM IST to 5 PM IST
  const isTimeToShowChart = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istOffset = 330 * 60000;
    const istTime = new Date(utc + istOffset);

    const istHours = istTime.getHours();
    const istMinutes = istTime.getMinutes();

    return (istHours > 15 || (istHours === 15 && istMinutes >= 0)) &&
           (istHours < 17 || (istHours === 17 && istMinutes === 0));
  };

  // Function to fetch data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setCurrentISTTime(getISTTime()); // Update time immediately

    try {
      // Fetch filter options first
      const [workTypeOptsRes, qualOptsRes, expOptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/work_types`),
        fetch(`${API_BASE_URL}/qualifications`),
        fetch(`${API_BASE_URL}/experience_levels`)
      ]);
      const [workTypeOpts, qualOpts, expOpts] = await Promise.all([
        workTypeOptsRes.json(),
        qualOptsRes.json(),
        expOptsRes.json()
      ]);
      setAllWorkTypeOptions(workTypeOpts);
      setAllQualificationOptions(qualOpts);
      setAllExperienceOptions(expOpts);


      // Fetch Work Type Distribution (filtered)
      const workTypeRes = await fetch(`${API_BASE_URL}/work_type_distribution?workType=${selectedWorkType}`);
      const workTypeData = await workTypeRes.json();
      setWorkTypeData(workTypeData);

      // Fetch Qualification Distribution (filtered)
      const qualRes = await fetch(`${API_BASE_URL}/qualification_distribution?qualification=${selectedQualification}`);
      const qualData = await qualRes.json();
      setQualificationData(qualData);

      // Fetch Experience Distribution (filtered)
      const expRes = await fetch(`${API_BASE_URL}/experience_distribution?experience=${selectedExperienceLevel}`);
      const expData = await expRes.json();
      setExperienceData(expData);

      // Fetch Salary Range Distribution
      const salaryRes = await fetch(`${API_BASE_URL}/salary_range_distribution`);
      const salaryData = await salaryRes.json();
      setSalaryRangeData(salaryData);

      // Fetch Job Portal Distribution
      const portalRes = await fetch(`${API_BASE_URL}/job_portal_distribution`);
      const portalData = await portalRes.json();
      setJobPortalData(portalData);

      // Fetch Job Postings Trend
      const trendRes = await fetch(`${API_BASE_URL}/job_postings_trend`);
      const trendData = await trendRes.json();
      setJobTrendData(trendData);

      // Fetch Top 10 Companies (conditional by backend logic)
      const top10Res = await fetch(`${API_BASE_URL}/top_10_companies`);
      const top10Data = await top10Res.json();
      setTop10CompaniesData(top10Data);

      // Fetch Company Size vs Company Name (conditional by backend logic)
      const companySizeRes = await fetch(`${API_BASE_URL}/company_size_vs_name`);
      const companySizeData = await companySizeRes.json();
      setCompanySizeVsCompanyData(companySizeData);

    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error state in UI
    } finally {
      setLoading(false);
    }
  }, [selectedWorkType, selectedQualification, selectedExperienceLevel]); // Dependencies for useCallback

  useEffect(() => {
    fetchData(); // Initial fetch and re-fetch on filter changes
    const interval = setInterval(() => {
      setCurrentISTTime(getISTTime());
      // Re-fetch conditional charts data periodically to update time-based visibility
      // This is a lighter fetch than fetchData() if only time-sensitive data needs update
      if (isTimeToShowChart()) {
          fetch(`${API_BASE_URL}/top_10_companies`).then(res => res.json()).then(setTop10CompaniesData).catch(console.error);
          fetch(`${API_BASE_URL}/company_size_vs_name`).then(res => res.json()).then(setCompanySizeVsCompanyData).catch(console.error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);


  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body { font-family: 'Inter', sans-serif; }
          .card {
            @apply bg-white rounded-xl shadow-lg p-6 mb-6;
          }
          .chart-container {
            @apply h-64 sm:h-80 lg:h-96 w-full;
          }
        `}
      </style>

      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-700 mb-2">Job Analytics Dashboard</h1>
        <p className="text-lg text-gray-600">Insights from Job Posting Data</p>
        <div className="flex items-center justify-center mt-4 text-gray-700">
          <Clock className="w-5 h-5 mr-2" />
          <span>Current IST Time: {currentISTTime}</span>
          <button
            onClick={fetchData}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-xl text-blue-600">Loading analytics data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Filters Section */}
          <div className="card col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Work Type Toggle */}
              <div>
                <label htmlFor="workTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Work Type:</label>
                <select
                  id="workTypeFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value)}
                >
                  <option value="All">All Work Types</option>
                  {allWorkTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Qualification Slicer */}
              <div>
                <label htmlFor="qualificationFilter" className="block text-sm font-medium text-gray-700 mb-1">Qualification:</label>
                <select
                  id="qualificationFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  value={selectedQualification}
                  onChange={(e) => setSelectedQualification(e.target.value)}
                >
                  <option value="All">All Qualifications</option>
                  {allQualificationOptions.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {/* Experience Level Slicer */}
              <div>
                <label htmlFor="experienceFilter" className="block text-sm font-medium text-gray-700 mb-1">Experience Level:</label>
                <select
                  id="experienceFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  value={selectedExperienceLevel}
                  onChange={(e) => setSelectedExperienceLevel(e.target.value)}
                >
                  <option value="All">All Experience Levels</option>
                  {allExperienceOptions.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {/* Work Type Distribution Chart (Now filtered) */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Work Type Distribution</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Number of Postings" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This chart shows the distribution of different work types in the dataset, filtered by your selection.</p>
          </div>

          {/* Top 5 Roles (Adjusted Filter) Chart - remains static as per prompt */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top 5 Roles (Interns as Web Developer in 2022)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRolesAdjustedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Role" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="Count" fill="#EF4444" name="Number of Occurrences" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This chart displays the top roles for interns with 'Web Developer' job titles in 2022.</p>
          </div>

          {/* Salary Range Distribution Chart */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Salary Range Distribution</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryRangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#8B5CF6" name="Number of Postings" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This chart shows the distribution of job postings across different salary ranges.</p>
          </div>

          {/* Jobs by Qualification Chart (Now filtered) */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Jobs by Qualification</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualificationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="qualification" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#06B6D4" name="Number of Postings" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This chart displays the number of job postings for various qualifications, filtered by your selection.</p>
          </div>

          {/* Job Portal Distribution (Pie Chart) */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Portal Distribution</h2>
            <div className="chart-container flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <Pie
                    data={jobPortalData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {
                      jobPortalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))
                    }
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This pie chart shows the distribution of job postings across different job portals.</p>
          </div>

          {/* Job Postings Trend Over Time (Line Chart) */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Postings Trend Over Time</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={jobTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="postings" stroke="#FF5733" activeDot={{ r: 8 }} name="Number of Postings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This line chart illustrates the trend of job postings over several months.</p>
          </div>

          {/* Experience Level Distribution (Bar Chart - Now filtered) */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Experience Level Distribution</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" tick={{ fill: '#4B5563' }} />
                  <YAxis tick={{ fill: '#4B5563' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#4CAF50" name="Number of Postings" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">This chart shows the distribution of job postings across different experience levels, filtered by your selection.</p>
          </div>


          {/* Top 10 Companies (Conditional Display) Chart */}
          <div className="card col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top 10 Companies (Data Engineer/Scientist - Filtered)</h2>
            {isTimeToShowChart() ? (
              top10CompaniesData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10CompaniesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Company" tick={{ fill: '#4B5563' }} />
                      <YAxis tick={{ fill: '#4B5563' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Legend />
                      <Bar dataKey="Count" fill="#10B981" name="Number of Postings" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                  <p className="text-yellow-700">No data found for the specified filters (Data Engineer/Scientist, Female, non-Asian, non-'C' country, latitude {'<'} 10, 2023-01-01 to 2023-06-01).</p>
                </div>
              )
            ) : (
              <div className="text-center p-4 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                <p className="text-blue-700">This chart is only visible between 3 PM IST and 5 PM IST.</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              This chart shows top companies for Data Engineer/Scientist roles based on specific filters (Female preference, non-Asian country, country not starting with 'C', latitude {'<'} 10, and job posting dates between Jan 1 and Jun 1, 2023).
              It is only displayed during the specified time window.
            </p>
          </div>

          {/* Company Size vs Company Name (Conditional Display) Chart */}
          <div className="card col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Company Size vs. Company Name (Filtered)</h2>
            {isTimeToShowChart() ? (
              companySizeVsCompanyData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companySizeVsCompanyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Company" tick={{ fill: '#4B5563' }} />
                      <YAxis tick={{ fill: '#4B5563' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Legend />
                      <Bar dataKey="Company Size" fill="#F97316" name="Company Size" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                  <p className="text-yellow-700">No data found for the specified filters (Mechanical Engineer, Male, Asian, {'>'}5yrs Exp, {'>'}$50k, Part/Full Time, Idealist, Company Size {'<'} 50000).</p>
                </div>
              )
            ) : (
              <div className="text-center p-4 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 h-6 text-blue-600 mr-2" />
                <p className="text-blue-700">This chart is only visible between 3 PM IST and 5 PM IST.</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              This chart displays company size for companies matching specific criteria (Company Size {'<'} 50000, Job Title 'Mechanical Engineer', Experience {'>'} 5 years, Asian country, Salary {'>'} $50k, Work Type 'Part Time' or 'Full Time', Preference 'Male', Job Portal 'Idealist').
              It is only displayed during the specified time window.
            </p>
          </div>

        </div>
      )}

      <footer className="text-center text-gray-500 text-sm mt-10">
        <p>
          This is a front-end simulation of a job analytics portal. For a true real-time experience with your full dataset,
          a backend API would be required to serve the processed data and handle complex queries.
        </p>
        <p className="mt-2">Developed with React, Tailwind CSS, and Recharts.</p>
      </footer>
    </div>
  );
};

export default App;
