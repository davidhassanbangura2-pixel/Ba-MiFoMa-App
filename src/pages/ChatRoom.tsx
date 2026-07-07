import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Message, User } from '../types';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';

let socket: Socket;

export default function ChatRoom() {
  const { userId: otherUserId } = useParams();
  const { token, user: currentUser } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch other user details
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(users => {
        const u = users.find((u: User) => u.id === otherUserId);
        if (u) setOtherUser(u);
      });

    // Fetch message history
    fetch(`/api/messages/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setMessages(data));

    // Connect socket
    socket = io();
    if (currentUser) {
      socket.emit('join', currentUser.id);
    }

    socket.on('newMessage', (msg: Message) => {
      // Only append if it belongs to this conversation
      if (
        (msg.senderId === currentUser?.id && msg.receiverId === otherUserId) ||
        (msg.senderId === otherUserId && msg.receiverId === currentUser?.id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [otherUserId, currentUser, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser || !otherUserId) return;

    socket.emit('sendMessage', {
      senderId: currentUser.id,
      receiverId: otherUserId,
      content
    });
    setContent('');
  };

  return (
    <div className="flex flex-col h-screen md:h-full bg-white max-w-3xl mx-auto md:border-x border-gray-200">
      <div className="bg-indigo-600 text-white p-4 flex items-center shadow-md z-10 sticky top-0">
        <Link to="/chat" className="mr-4 hover:bg-indigo-700 p-2 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {otherUser && (
          <div className="flex items-center">
            <img src={otherUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} alt="avatar" className="w-8 h-8 rounded-full mr-3 border border-indigo-400" />
            <h2 className="font-semibold">{otherUser.username}</h2>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Say hi to start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex items-center pb-20 md:pb-4">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button 
          type="submit" 
          disabled={!content.trim()}
          className="ml-3 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
