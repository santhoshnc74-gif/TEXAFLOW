import { useEffect, useState } from 'react';
import api from '../services/api';

const WorkerProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const res = await api.get('/api/worker/me/profile');
        setProfile(res.data);
      } catch (error) {
        console.error('Failed to fetch worker profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-gray-500 py-12">Unable to load your profile.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#062B4A]">My Profile</h1>
        <p className="text-gray-500 mt-1">View your personal information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#062B4A]">Personal Information</h2>
          {/* Edit button is hidden/unavailable as per instructions for non-editable fields */}
        </div>
        
        <div className="flex flex-col md:flex-row p-8">
          {/* Avatar on the left */}
          <div className="flex-shrink-0 mb-8 md:mb-0 md:mr-12 flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-[#1687F8] text-white flex items-center justify-center text-4xl font-bold uppercase shadow-sm">
              {profile.name.substring(0, 2)}
            </div>
            <span className={`mt-4 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {profile.status}
            </span>
          </div>

          {/* Details on the right */}
          <div className="flex-1">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              
              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.employee_id}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.name}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.department}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Designation</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.designation || '-'}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.phone || '-'}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.email || '-'}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Shift</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{profile.shift || '-'}</dd>
              </div>

              <div className="sm:col-span-1 border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Joining Date</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{new Date(profile.joining_date).toLocaleDateString('en-GB')}</dd>
              </div>

            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
