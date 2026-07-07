import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User } from '../types';

export default function ChatList() {
  const [users, setUsers] = useState<User[]>([]);
  const { token, user: currentUser } = useStore();

  useEffect(() => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // Filter out current user
        setUsers(data.filter((u: User) => u.id !== currentUser?.id));
      });
  }, [token, currentUser]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Chats</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {users.map(user => (
          <Link 
            key={user.id} 
            to={`/chat/${user.id}`}
            className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="avatar" className="w-12 h-12 rounded-full mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">{user.username}</h3>
              <p className="text-sm text-gray-500">Tap to chat</p>
            </div>
          </Link>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No other users found. Invite some friends!</div>
        )}
      </div>
    </div>
  );
}
