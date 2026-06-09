import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 tracking-tight mb-6">
          Welcome to <span className="text-blue-600">StudyHub</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Your ultimate university learning platform. Connect, collaborate, and conquer your courses with ease.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200">
            Get Started
          </Link>
          <Link to="/login" className="px-8 py-4 bg-white text-blue-600 border border-blue-200 rounded-lg font-semibold text-lg shadow-sm hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-200">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
