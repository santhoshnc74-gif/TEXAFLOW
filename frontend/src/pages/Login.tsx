import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiUser, FiUsers, FiSettings, FiTrendingUp } from 'react-icons/fi';
import loginBg from '../assets/texflow-textile-login.jpg';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      
      if (data.user.must_change_password) {
        navigate('/change-password');
      } else if (data.user.role === 'ADMIN') {
        navigate('/dashboard');
      } else if (data.user.role === 'WORKER') {
        navigate('/worker-dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#062B4A] relative overflow-hidden font-sans">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 flex justify-end bg-[#0a355c]">
        <div 
          className="w-full lg:w-[70%] h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="w-full h-full bg-[#062B4A] opacity-30"></div>
        </div>
      </div>

      {/* Left Brand Panel */}
      <div 
        className="relative z-10 w-full lg:w-[45%] xl:w-[40%] bg-[#062B4A] text-white flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-20 min-h-screen lg:min-h-0 lg:[clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)] shadow-2xl"
      >
        <div className="max-w-md lg:pr-12">
          {/* Logo & Title */}
          <div className="mb-16">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-wider text-white mb-3 shadow-sm">
              TEX<span className="text-[#1687F8]">FLOW</span>
            </h1>
            <h2 className="text-xl lg:text-2xl text-blue-100 font-light leading-relaxed">
              Garment / Textile Factory<br />Management System
            </h2>
          </div>

          {/* Features */}
          <div className="space-y-10">
            {/* Feature 1 */}
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#1687F8] shadow-lg flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">People</h3>
                <p className="text-sm text-blue-200">Skilled workforce drives success</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#1687F8] shadow-lg flex items-center justify-center">
                <FiSettings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Production</h3>
                <p className="text-sm text-blue-200">Streamlined operations</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#1687F8] shadow-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Progress</h3>
                <p className="text-sm text-blue-200">A stronger tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Card Section */}
      <div className="relative z-10 w-full lg:w-[55%] xl:w-[60%] flex items-center justify-center lg:justify-end p-6 sm:p-12 lg:pr-24 xl:pr-32 min-h-screen lg:min-h-0">
        
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#062B4A]">Account Login</h2>
            <p className="text-sm text-slate-500 mt-3 px-4">Enter your username and password to access your account</p>
          </div>

          <form className="space-y-7" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm font-medium">
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-2 focus:ring-[#1687F8] focus:border-[#1687F8] block w-full pl-12 sm:text-base border-slate-300 rounded-lg py-3.5 px-4 border outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-[#1687F8] focus:border-[#1687F8] block w-full pl-12 pr-12 sm:text-base border-slate-300 rounded-lg py-3.5 px-4 border outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-[#1687F8] hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {loading ? 'Signing in...' : 'Login →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
