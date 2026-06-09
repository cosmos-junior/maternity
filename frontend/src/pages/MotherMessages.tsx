import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  RefreshCw,
  Info
} from 'lucide-react';
import { motherApi, authApi } from '../api';
import { SecureMessage } from '../types';
import { extractListData, formatDate } from '../utils';

export default function MotherMessages() {
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadCurrentUser = async () => {
    try {
      const res = await authApi.me();
      setCurrentUserId(res.data.id);
    } catch (err) {
      console.error('Failed to load user ID:', err);
    }
  };

  const loadMessages = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await motherApi.listMessages();
      setMessages(extractListData<SecureMessage>(res.data));
      scrollToBottom();
    } catch (err: any) {
      console.error(err);
      setError('Failed to load messages.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    loadCurrentUser();
    loadMessages(true);

    // Auto-refresh chat every 15 seconds
    const interval = setInterval(() => loadMessages(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setSending(true);
      setError('');
      await motherApi.sendMessage(inputText);
      setInputText('');
      await loadMessages(false);
      scrollToBottom();
    } catch (err: any) {
      console.error(err);
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
      {/* Warm Gradient Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: `
          linear-gradient(135deg, rgba(251, 191, 206, 0.08) 0%, rgba(253, 224, 207, 0.08) 50%, rgba(186, 226, 230, 0.08) 100%)
        `
      }} />

      <div className="relative z-10 p-4 md:p-6 max-w-3xl mx-auto flex flex-col h-[calc(100vh-230px)] md:h-[calc(100vh-160px)] mb-[80px] md:mb-0">
        
        {/* Chat Header */}
        <div className="mb-4 rounded-t-3xl p-6 border border-b-0"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.3) 0%, rgba(253, 224, 207, 0.2) 100%)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.25)'
          }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-pink-300" size={28} />
                Secure Messages
              </h1>
              <p className="text-white/70 text-sm mt-1">
                Connect directly with your consulting nurses and doctors
              </p>
            </div>
            <button 
              onClick={() => loadMessages(false)}
              className="p-2 rounded-xl transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
              aria-label="Refresh messages"
            >
              <RefreshCw size={16} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 rounded-0 p-6 border border-b-0 overflow-y-auto flex flex-col gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.15) 0%, rgba(221, 240, 255, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.25)'
          }}>
          {messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.sender === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  {/* Sender Label */}
                  {!isMe && (
                    <span className="text-xs text-cyan-300 font-bold flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Clinical Staff
                    </span>
                  )}
                  {/* Message Bubble */}
                  <div className="rounded-3xl px-5 py-3 text-sm leading-relaxed max-w-full break-words"
                    style={{
                      background: isMe
                        ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                        : 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: isMe
                        ? '1px solid rgba(255, 255, 255, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      borderRadius: isMe ? '24px 0 24px 24px' : '0 24px 24px 24px'
                    }}>
                    {msg.message}
                  </div>
                  {/* Timestamp */}
                  <span className="text-xs text-white/50">{formatDate(msg.created_at)}</span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60 text-center gap-3 py-10">
              <MessageSquare className="text-white/30" size={40} />
              <div className="text-sm font-semibold">No messages yet</div>
              <p className="text-xs max-w-xs text-white/50 leading-normal">
                Start a conversation by typing a message below
              </p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Send Input Footer */}
        <form onSubmit={handleSend} className="rounded-b-3xl p-4 border border-t-0 flex gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.25) 0%, rgba(253, 224, 207, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.25)'
          }}>
          <input 
            type="text" 
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-2xl text-white text-sm focus:outline-none transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          {error && <div className="text-red-400 text-xs font-semibold self-center whitespace-nowrap">Error sending</div>}
          <button 
            type="submit" 
            disabled={sending || !inputText.trim()}
            className="p-3 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: sending || !inputText.trim()
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
            <Send size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}
