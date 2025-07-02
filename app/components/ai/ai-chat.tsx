
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Sparkles,
  Zap,
  MessageSquare,
  Settings,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  module?: string;
  isStreaming?: boolean;
}

interface AIChatProps {
  module?: 'ANALYTICS' | 'FINANCE' | 'PROJECT' | 'GENERAL';
  context?: any;
  className?: string;
}

export function AIChat({ module = 'GENERAL', context, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      module
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (useStreaming) {
        await handleStreamingResponse(messageText, abortController);
      } else {
        await handleRegularResponse(messageText, abortController);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.',
          role: 'assistant',
          timestamp: new Date(),
          module
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStreamingResponse = async (messageText: string, abortController: AbortController) => {
    const assistantMessageId = Date.now().toString();
    
    // Create initial empty assistant message
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      module,
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context,
          module,
          conversationId: conversationId || undefined
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Mark streaming as complete
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullContent += content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: 'Entschuldigung, es gab einen Fehler beim Streaming der Antwort.',
                  isStreaming: false
                }
              : msg
          )
        );
      }
      throw error;
    }
  };

  const handleRegularResponse = async (messageText: string, abortController: AbortController) => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context,
          module,
          conversationId: conversationId || undefined
        }),
        signal: abortController.signal
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: data.data.message || 'Entschuldigung, ich konnte keine Antwort generieren.',
          role: 'assistant',
          timestamp: new Date(),
          module
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation ID if provided
        if (data.data.conversationId && !conversationId) {
          setConversationId(data.data.conversationId);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getModuleIcon = () => {
    switch (module) {
      case 'ANALYTICS': return <TrendingUp className="w-4 h-4" />;
      case 'FINANCE': return <DollarSign className="w-4 h-4" />;
      case 'PROJECT': return <FolderOpen className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getModuleColor = () => {
    switch (module) {
      case 'ANALYTICS': return 'bg-blue-500';
      case 'FINANCE': return 'bg-green-500';
      case 'PROJECT': return 'bg-purple-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="flex-none">
        <CardTitle className="flex items-center gap-2">
          <div className={`p-2 rounded-lg text-white ${getModuleColor()}`}>
            {getModuleIcon()}
          </div>
          <span>KI-Assistent</span>
          <Badge variant="secondary">
            {module === 'GENERAL' ? 'Allgemein' : 
             module === 'ANALYTICS' ? 'Analytics' :
             module === 'FINANCE' ? 'Finance' : 'Projekt'}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            {conversationId && (
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Gespräch aktiv
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        
        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4 mt-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="streaming"
                  checked={useStreaming}
                  onCheckedChange={setUseStreaming}
                />
                <Label htmlFor="streaming" className="text-sm">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Live-Streaming
                </Label>
              </div>
              <Badge variant="outline" className="text-xs">
                {useStreaming ? 'Streaming aktiv' : 'Standard-Modus'}
              </Badge>
            </div>
          </motion.div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-muted-foreground py-8"
              >
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                <p className="text-lg font-medium mb-2">
                  Willkommen beim KI-Assistenten
                </p>
                <p className="text-sm">
                  Stellen Sie Fragen zu Ihren Geschäftsprozessen, Analytics, Finance oder Projekten.
                </p>
              </motion.div>
            )}
            
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`text-white ${getModuleColor()}`}>
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.isStreaming && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-1 text-xs text-blue-500"
                        >
                          <Zap className="w-3 h-3" />
                          Streaming...
                        </motion.div>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                      {message.isStreaming && (
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-2 h-4 bg-current ml-1"
                        />
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.role === 'assistant' && !message.isStreaming && (
                        <Badge variant="outline" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          KI
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`text-white ${getModuleColor()}`}>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    KI denkt nach...
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Stellen Sie eine Frage${useStreaming ? ' (Live-Streaming aktiv)' : ''}...`}
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading && useStreaming ? (
            <Button 
              onClick={stopGeneration}
              variant="destructive"
              size="icon"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          ) : (
            <Button 
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          )}
          {useStreaming && (
            <Badge variant="outline" className="flex items-center px-2">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
