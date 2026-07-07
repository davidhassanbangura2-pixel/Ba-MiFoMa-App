import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Post } from '../types';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const { token, user } = useStore();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setPosts(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      setContent('');
      fetchPosts(); // Refresh
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            placeholder="What's on your mind?"
          />
          <div className="flex justify-end mt-3">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
              Post News
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-5 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <img src={post.author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} alt="avatar" className="w-10 h-10 rounded-full mr-3" />
              <div>
                <h3 className="font-bold text-gray-900">{post.author?.username || 'Unknown'}</h3>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-10">No posts yet. Be the first to post!</div>
        )}
      </div>
    </div>
  );
}
