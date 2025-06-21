// src/components/chatbot/ChatbotWidget.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User, Briefcase, UserSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  type?: 'role_selection'; // Special type for role selection message
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [currentChatRole, setCurrentChatRole] = useState<'jobSeeker' | 'employer' | null>(null);
  const [isChatReady, setIsChatReady] = useState(false);
  const [userWasLoggedInOnOpen, setUserWasLoggedInOnOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      const storedUserId = localStorage.getItem('userId');
      const storedUserRole = localStorage.getItem('userRole') as 'jobSeeker' | 'employer' | null;

      if (storedUserId && storedUserRole) {
        setCurrentChatRole(storedUserRole);
        setIsChatReady(true);
        setUserWasLoggedInOnOpen(true);
        setMessages([
          {
            id: 'welcome-logged-in',
            text: `Hello ${storedUserRole === 'jobSeeker' ? 'Job Seeker' : 'Employer'}! How can I assist you today?`,
            sender: 'bot',
          },
        ]);
      } else {
        setUserWasLoggedInOnOpen(false);
        setIsChatReady(false);
        setCurrentChatRole(null); // Explicitly reset if no one is logged in
        setMessages([
          {
            id: 'initial-bot-greeting',
            text: "Hello! I'm JobsAI Assistant.",
            sender: 'bot',
          },
          {
            id: 'role-prompt',
            text: 'To help me best, please select your role:',
            sender: 'bot',
            type: 'role_selection',
          },
        ]);
      }
    } else {
      // Reset role if it was set by an anonymous user during this session
      if (!userWasLoggedInOnOpen) {
        setCurrentChatRole(null);
        setIsChatReady(false);
      }
      // Clear messages or keep history as per preference
      // setMessages([]); // Option to clear history on close
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);


  const handleRoleSelect = (role: 'jobSeeker' | 'employer') => {
    setCurrentChatRole(role);
    setIsChatReady(true);
    // Remove the role selection prompt and add a confirmation
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.type !== 'role_selection')
      .concat({
        id: 'role-selected-confirm',
        text: `Great! As a ${role === 'jobSeeker' ? 'Job Seeker' : 'Employer'}, how can I help you?`,
        sender: 'bot',
      })
    );
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || !isChatReady) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsBotTyping(true);

    setTimeout(() => {
      const botResponseText = currentChatRole
        ? `As a ${currentChatRole}, you asked: "${newUserMessage.text.substring(0, 20)}${newUserMessage.text.length > 20 ? '...' : ''}". I'm processing this with your role context.`
        : `You said: "${newUserMessage.text.substring(0, 20)}${newUserMessage.text.length > 20 ? '...' : ''}". I'm still learning, but real AI responses are coming soon!`;
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
      };
      setIsBotTyping(false);
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 1500);
  };

  const toggleChat = () => setIsOpen(!isOpen);


  if (!mounted) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 z-50",
          "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
        )}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[340px] h-[500px] shadow-2xl rounded-xl z-40 flex flex-col bg-card border-border animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
          <CardHeader className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg font-semibold text-primary">
                JobsAI Assistant {currentChatRole ? `(${currentChatRole === 'jobSeeker' ? 'Job Seeker' : 'Employer'} View)` : ''}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={cn(
                        "flex items-end max-w-[85%] gap-2",
                        msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                      )}
                    >
                      <div className={cn("flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs text-primary-foreground",
                          msg.sender === 'user' ? "bg-accent" : "bg-primary"
                      )}>
                          {msg.sender === 'user' ? <User size={16}/> : <Bot size={16}/>}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm shadow-md",
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-muted-foreground rounded-bl-none'
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                    {msg.type === 'role_selection' && (
                      <div className="mt-2 flex justify-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleSelect('jobSeeker')}
                          className="flex items-center gap-1.5"
                        >
                          <UserSearch size={14} /> I'm a Job Seeker
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleSelect('employer')}
                           className="flex items-center gap-1.5"
                        >
                          <Briefcase size={14} /> I'm an Employer
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex items-end max-w-[85%] gap-2 mr-auto flex-row">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        <Bot size={16}/>
                    </div>
                    <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm shadow-md rounded-bl-none">
                        <span className="animate-pulse">Typing...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t border-border bg-secondary/20">
            <div className="flex w-full items-center gap-2">
              <Input
                type="text"
                placeholder={isChatReady ? "Ask anything..." : "Please select your role above..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-grow h-10 bg-background"
                aria-label="Chat input"
                disabled={!isChatReady}
              />
              <Button onClick={handleSendMessage} size="icon" className="h-10 w-10" aria-label="Send message" disabled={!isChatReady}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
