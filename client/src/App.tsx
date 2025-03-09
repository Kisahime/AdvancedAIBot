import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    reasoning?: string;
    sources?: Array<{ title: string; url: string }>;
    browsedContent?: string;
  };
}

interface Conversation {
  _id: string;
  title: string;
  lastActivity: Date;
}

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await axios.get(`/api/chat/history/${conversationId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to UI immediately
    const userMessage: Partial<Message> = {
      content: message,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage as Message]);
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat/message', {
        conversationId: currentConversation,
        message: message,
        userId: 'user123' // In a real app, this would be the authenticated user's ID
      });

      // Update conversation if it's new
      if (!currentConversation) {
        setCurrentConversation(response.data.conversation._id);
        fetchConversations(); // Refresh the conversation list
      }

      // Add bot response to messages
      setMessages(prev => [...prev.filter(m => m._id), response.data.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Partial<Message> = {
        content: 'Sorry, there was an error processing your request.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage as Message]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await axios.delete(`/api/chat/conversation/${conversationId}`);
        
        // Remove the conversation from the state
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        
        // If the deleted conversation was the current one, reset to null
        if (currentConversation === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Advanced AI Chatbot</h1>
      </header>
      <div className="chat-container">
        <div className="sidebar">
          <button onClick={createNewConversation} className="new-chat-btn">
            <i className="fas fa-plus"></i> New Conversation
          </button>
          <div className="conversations-list">
            {conversations.map(conv => (
              <div 
                key={conv._id} 
                className={`conversation-item ${currentConversation === conv._id ? 'active' : ''}`}
              >
                <div className="conversation-title" onClick={() => selectConversation(conv._id)}>
                  {conv.title}
                </div>
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv._id);
                  }}
                  title="Delete conversation"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="chat-area">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={msg._id || index} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
                {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                  <div className="sources">
                    <h4>Sources:</h4>
                    <ul>
                      {msg.metadata.sources.map((source, i) => (
                        <li key={i}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="message assistant loading">
                <div className="loading-indicator">Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              <i className="fas fa-paper-plane"></i> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;