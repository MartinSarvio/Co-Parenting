import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useAppStore } from '@/store';
import { messageId, attachmentId, threadId as generateThreadId } from '@/lib/id';
import { cn, getParentColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send,
  Plus,
  ChevronLeft,
  MoreVertical,
  Image as ImageIcon,
  FileText,
  CheckCheck,
  Check,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Attachment } from '@/types';

export function Kommunikation() {
  const { 
    currentUser, 
    users, 
    children, 
    messages, 
    threads, 
    addMessage,
    addThread,
    deleteThread,
  } = useAppStore();
  
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState<'institution' | 'medicin' | 'samvaer' | 'okonomi' | 'andet'>('institution');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChild = children[0];
  const otherParent = users.find(u => u.id !== currentUser?.id);
  
  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const threadMessages = messages
    .filter(m => m.threadId === selectedThreadId && !m.deletedBy?.includes(currentUser?.id || ''))
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSendMessage = (content: string = newMessage, attachments?: Attachment[]) => {
    if (!selectedThreadId) return;
    const trimmed = content.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;

    addMessage({
      id: messageId(),
      content: trimmed,
      senderId: currentUser?.id || 'u1',
      timestamp: new Date().toISOString(),
      threadId: selectedThreadId,
      attachments,
      readBy: [currentUser?.id || 'u1'],
    });
    
    setNewMessage('');
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Kunne ikke læse filen'));
      reader.readAsDataURL(file);
    });
  };

  const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !selectedThreadId) return;

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      const attachment: Attachment = {
        id: attachmentId(),
        type,
        url: dataUrl,
        name: selectedFile.name
      };
      handleSendMessage('', [attachment]);
      toast.success(type === 'image' ? 'Billede sendt' : 'Fil sendt');
    } catch {
      toast.error('Kunne ikke uploade filen');
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateThread = () => {
    if (newThreadTitle.trim().length < 3) {
      toast.error('Tilføj en tydelig titel til samtalen');
      return;
    }
    
    const newThreadId = generateThreadId();
    addThread({
      id: newThreadId,
      title: newThreadTitle.trim(),
      participants: [currentUser?.id || 'u1', otherParent?.id || 'u2'],
      childId: currentChild?.id,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    });
    
    setNewThreadTitle('');
    setNewThreadCategory('institution');
    setShowNewThread(false);
    setSelectedThreadId(newThreadId);
    toast.success('Samtale oprettet');
  };

  const threadCategoryTemplates = [
    { key: 'institution' as const, label: 'Institution', title: 'Institution: beskeder og info' },
    { key: 'medicin' as const, label: 'Medicin', title: 'Medicin og sundhed' },
    { key: 'samvaer' as const, label: 'Samvær', title: 'Samvær: bytte og tider' },
    { key: 'okonomi' as const, label: 'Økonomi', title: 'Økonomi: udgifter og betalinger' },
    { key: 'andet' as const, label: 'Andet', title: 'Samtaleemne' },
  ];

  const formatMessageDate = (timestamp: string) => {
    const date = parseISO(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `I går ${format(date, 'HH:mm')}`;
    return format(date, 'dd. MMM HH:mm', { locale: da });
  };

  // Thread List View
  if (!selectedThreadId) {
    return (
      <div className="space-y-4 p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-[#2f2f2d]">Kommunikation</h1>
            <p className="text-[#75736b]">Strukturerede samtaler med tydelig titel</p>
          </div>
          <Button 
            size="icon"
            onClick={() => setShowNewThread(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* New Thread Dialog */}
        {showNewThread && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-[#f3c59d] bg-[#fff2e6]">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {threadCategoryTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => {
                        setNewThreadCategory(template.key);
                        if (!newThreadTitle.trim()) {
                          setNewThreadTitle(template.title);
                        }
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        newThreadCategory === template.key
                          ? "border-[#f3c59d] bg-white text-[#2f2f2d]"
                          : "border-[#e4cdb7] bg-[#fff7ef] text-[#946539]"
                      )}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
                <Input
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Titel på samtalen (fx Institution: sygedage)"
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewThread(false)}
                    className="flex-1"
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleCreateThread}
                    disabled={!newThreadTitle.trim()}
                    className="flex-1"
                  >
                    Opret
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Thread List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {threads.filter(t => !t.deletedBy?.includes(currentUser?.id || '')).map((thread, index) => {
            const lastMessage = messages
              .filter(m => m.threadId === thread.id && !m.deletedBy?.includes(currentUser?.id || ''))
              .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())[0];
            
            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <Card className="border-slate-200 hover:border-[#f3c59d] cursor-pointer transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#fff2e6] flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-[#bf6722]">
                          {thread.title[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 truncate">{thread.title}</h3>
                          {lastMessage && (
                            <span className="text-xs text-slate-400">
                              {formatMessageDate(lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {lastMessage ? (
                          <p className="text-sm text-slate-500 truncate mt-1">
                            <span className="font-medium">
                              {users.find(u => u.id === lastMessage.senderId)?.name}:
                            </span>{' '}
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 mt-1">Ingen beskeder endnu</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-[#2f2f2f] text-white">
                            {thread.unreadCount}
                          </Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser) {
                              deleteThread(thread.id, currentUser.id);
                              toast.success('Samtale skjult for dig');
                            }
                          }}
                          className="p-1.5 rounded-full text-[#c5c4be] hover:text-[#ef4444] hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {threads.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">Ingen samtaler endnu</p>
              <p className="text-sm text-slate-400">Start en ny samtale ved at trykke på +</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSelectedThreadId(null)}
          className="-ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-[#fff2e6] flex items-center justify-center">
          <span className="font-bold text-[#bf6722]">{selectedThread?.title[0]}</span>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">{selectedThread?.title}</h2>
          <p className="text-xs text-slate-500">
            Med {otherParent?.name}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {threadMessages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUser?.id;
            const sender = users.find(u => u.id === message.senderId);
            const showAvatar = index === 0 || threadMessages[index - 1].senderId !== message.senderId;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-2",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && showAvatar && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={sender?.avatar} />
                    <AvatarFallback 
                      className="text-xs"
                      style={{ 
                        backgroundColor: sender ? getParentColor(sender.color) + '30' : undefined,
                        color: sender ? getParentColor(sender.color) : undefined
                      }}
                    >
                      {sender?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isCurrentUser && !showAvatar && <div className="w-8" />}
                
                <div className={cn("max-w-[75%]", isCurrentUser ? "items-end" : "items-start")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl",
                    isCurrentUser 
                      ? "bg-[#2f2f2f] text-white rounded-br-md" 
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                  )}>
                    {message.attachments?.map((attachment) => (
                      <div key={attachment.id} className="mb-2 last:mb-0">
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="max-h-52 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm",
                              isCurrentUser ? "border-white/30 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                            )}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{attachment.name}</span>
                          </a>
                        )}
                      </div>
                    ))}
                    {message.content && <p className="text-sm">{message.content}</p>}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-xs text-slate-400">
                      {formatMessageDate(message.timestamp)}
                    </span>
                    {isCurrentUser && (
                      message.readBy.length > 1 ? (
                        <CheckCheck className="w-3 h-3 text-[#f58a2d]" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400" />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-slate-200 bg-white"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void handleAttachmentSelect(event, 'image');
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => {
            void handleAttachmentSelect(event, 'document');
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Skriv en besked..."
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
