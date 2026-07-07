import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User } from '../types';

export default function Profile() {
  const { userId } = useParams();
  const { token, user: currentUser } = useStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);

  useEffect(() => {
    // In a real app we'd fetch specific user profile by ID.
    // For now we can just display the current user if it matches.
    if (userId === currentUser?.id) {
      setProfileUser(currentUser);
    } else {
      // Fetch user from API
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(users => {
          const user = users.find((u: User) => u.id === userId);
          if (user) setProfileUser(user);
        });
    }
  }, [userId, currentUser, token]);

  if (!profileUser) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <img 
          src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`} 
          alt="avatar" 
          className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-indigo-100" 
        />
        <h2 className="text-3xl font-bold text-gray-900">{profileUser.username}</h2>
        <p className="text-gray-500 mb-6">{profileUser.email}</p>
        
        <div className="bg-gray-50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-gray-700 mb-2">Bio</h3>
          <p className="text-gray-600">{profileUser.bio || "No bio available."}</p>
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          Joined {new Date(profileUser.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
