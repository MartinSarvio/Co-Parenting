import { useState, useRef, useEffect, useMemo, memo, type ChangeEvent } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { attachmentId } from '@/lib/id';
import { cn, getParentColor, getEffectiveColor } from '@/lib/utils';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send,
  Image as ImageIcon,
  FileText,
  CheckCheck,
  Check,
  Trash2,
  MessageSquarePlus,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Attachment } from '@/types';

function formatMessageDate(timestamp: string) {
  const date = parseISO(timestamp);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `I går ${format(date, 'HH:mm')}`;
  return format(date, 'dd. MMM HH:mm', { locale: da });
}

export function Kommunikation() {
  const {
    currentUser,
    users,
    children,
    messages,
    threads,
    kommunikationThreadId,
    setKommunikationThreadId,
    isProfessionalView,
  } = useAppStore();
  const { createThread, sendMessage, deleteThread } = useApiActions();

  const selectedThreadId = kommunikationThreadId;
  const setSelectedThreadId = setKommunikationThreadId;
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState<string>('institution');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChild = children[0];
  const otherParent = users.find(u => u.id !== currentUser?.id);

  // Handle TopBar-triggered actions via store
  const kommunikationAction = useAppStore(s => s.kommunikationAction);
  useEffect(() => {
    if (!kommunikationAction) return;
    if (kommunikationAction === 'new-thread') setShowNewThread(true);
    useAppStore.getState().setKommunikationAction(null);
  }, [kommunikationAction]);

  const threadMessages = useMemo(() =>
    messages
      .filter(m => m.threadId === selectedThreadId && !m.deletedBy?.includes(currentUser?.id || ''))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()),
    [messages, selectedThreadId, currentUser?.id]
  );

  // Pre-compute visible threads and last messages (avoid N+1 in render)
  const visibleThreads = useMemo(() =>
    threads.filter(t => !t.deletedBy?.includes(currentUser?.id || '')),
    [threads, currentUser?.id]
  );

  const lastMessageMap = useMemo(() => {
    const map: Record<string, typeof messages[0] | undefined> = {};
    for (const thread of visibleThreads) {
      map[thread.id] = messages
        .filter(m => m.threadId === thread.id && !m.deletedBy?.includes(currentUser?.id || ''))
        .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())[0];
    }
    return map;
  }, [visibleThreads, messages, currentUser?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSendMessage = (content: string = newMessage, _attachments?: Attachment[]) => {
    if (!selectedThreadId) return;
    const trimmed = content.trim();
    if (!trimmed && (!_attachments || _attachments.length === 0)) return;

    sendMessage(selectedThreadId, trimmed).catch(() => {});

    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor. Maksimum er 10 MB.');
      event.target.value = '';
      return;
    }

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

  const handleCreateThread = async () => {
    if (newThreadTitle.trim().length < 3) {
      toast.error('Tilføj en tydelig titel til samtalen');
      return;
    }
    setIsSaving(true);
    try {
      const thread = await createThread({
        title: newThreadTitle.trim(),
        participants: [currentUser?.id || 'u1', otherParent?.id || 'u2'],
        childId: currentChild?.id,
      });

      toast.success('Samtale oprettet');
      setNewThreadTitle('');
      setNewThreadCategory('institution');
      setShowNewThread(false);
      if (thread) {
        setSelectedThreadId(thread.id);
      }
    } catch {
      toast.error('Kunne ikke oprette samtale');
    } finally {
      setIsSaving(false);
    }
  };

  const threadCategoryTemplates = [
    { key: 'institution' as const, label: 'Institution', title: 'Institution: beskeder og info' },
    { key: 'medicin' as const, label: 'Medicin', title: 'Medicin og sundhed' },
    { key: 'samvaer' as const, label: 'Samvær', title: 'Samvær: bytte og tider' },
    { key: 'okonomi' as const, label: 'Økonomi', title: 'Økonomi: udgifter og betalinger' },
    { key: 'skole' as const, label: 'Skole', title: 'Skole: lektier og arrangementer' },
    { key: 'aktiviteter' as const, label: 'Aktiviteter', title: 'Aktiviteter: sport og fritid' },
    { key: 'ferie' as const, label: 'Ferie', title: 'Ferie: planlægning og aftaler' },
    { key: 'toej' as const, label: 'Tøj', title: 'Tøj: indkøb og størrelse' },
    { key: 'andet' as const, label: 'Andet', title: 'Samtaleemne' },
  ];

  // New Thread — fullscreen page
  if (showNewThread) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-background"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <ConfirmCloseDialog
          open={confirmClose}
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => { setConfirmClose(false); setShowNewThread(false); setNewThreadTitle(''); setNewThreadCategory('institution'); }}
        />
        {/* Header: < | Ny samtale | Gem */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => {
              if (newThreadTitle.trim()) {
                setConfirmClose(true);
              } else {
                setShowNewThread(false);
              }
            }}
            className="w-9 flex items-center justify-center text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-[17px] font-semibold text-foreground">Ny samtale</h2>
          <button
            onClick={handleCreateThread}
            disabled={!newThreadTitle.trim() || isSaving}
            className="text-[15px] font-semibold text-foreground disabled:opacity-30"
          >
            Gem
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 mx-auto w-full max-w-[430px]">

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Kategori</p>
              <div className="flex gap-2 flex-wrap">
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
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium",
                      newThreadCategory === template.key
                        ? "border-orange-tint bg-card text-foreground"
                        : "border-[#e4cdb7] bg-orange-tint text-[#f58a2d]"
                    )}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Titel</p>
              <Input
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Titel på samtalen (fx Institution: sygedage)"
                className="bg-card rounded-[8px]"
                autoFocus
              />
            </div>
          </div>
        </div>

        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // Thread List View
  if (!selectedThreadId) {
    return (
      <div className="-mx-3 sm:-mx-4">
        {/* Thread List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className=""
        >
          {visibleThreads.map((thread, index) => {
            const lastMessage = lastMessageMap[thread.id];

            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden"
              >
                {/* Delete background */}
                <div className="absolute inset-0 flex items-center justify-end pr-5 bg-[#ef4444]">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                {/* Swipeable card */}
                <motion.div
                  drag="x"
                  dragConstraints={{ right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -100 && currentUser) {
                      void deleteThread(thread.id, currentUser.id);
                      toast.success('Samtale skjult for dig');
                    }
                  }}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className="relative flex items-start gap-3 px-3 sm:px-4 py-3.5 border-b border-border cursor-pointer bg-background active:bg-card transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-orange-tint flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[#bf6722]">
                      {thread.title[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-foreground truncate">{thread.title}</h3>
                      {lastMessage && (
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                          {formatMessageDate(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {lastMessage ? (
                      <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                        <span className="font-medium text-muted-foreground">
                          {users.find(u => u.id === lastMessage.senderId)?.name}:
                        </span>{' '}
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground mt-0.5">Ingen beskeder endnu</p>
                    )}
                  </div>
                  {thread.unreadCount > 0 && (
                    <Badge className="bg-primary text-white shrink-0 self-center">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
          
          {visibleThreads.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-orange-tint flex items-center justify-center mb-4">
                <MessageSquarePlus className="w-10 h-10 text-[#f58a2d]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Ingen samtaler endnu</h3>
              <p className="text-sm text-muted-foreground mb-5">Opret en ny chat for at starte en samtale</p>
              <Button
                onClick={() => setShowNewThread(true)}
                className="rounded-full bg-primary text-white hover:bg-primary px-6"
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Opret ny chat
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Chat View — fullscreen overlay
  return (
    <div
      className="fixed inset-x-0 top-0 bottom-0 z-40 flex flex-col bg-background"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 58px)' }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2 mx-auto w-full max-w-[430px]">
        <AnimatePresence>
          {threadMessages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUser?.id}
              sender={users.find(u => u.id === message.senderId)}
              showAvatar={index === 0 || threadMessages[index - 1].senderId !== message.senderId}
              currentUserId={currentUser?.id}
              isProfessionalView={isProfessionalView}
              threadParticipants={visibleThreads.find(t => t.id === selectedThreadId)?.participants}
              allUsers={users}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating input bar */}
      <div
        className="px-3 pb-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
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
        <div className="flex items-end gap-2 rounded-[22px] bg-card/90 backdrop-blur-md border border-border/60 shadow-[0_2px_16px_rgba(0,0,0,0.08)] px-2 py-1.5">
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground active:scale-95 transition-all"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Tilføj billede"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground active:scale-95 transition-all"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Tilføj dokument"
          >
            <FileText className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Skriv en besked..."
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-[120px] leading-5"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f58a2d] text-white shadow-sm active:scale-95 transition-all disabled:opacity-40"
            aria-label="Send besked"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SavingOverlay open={isSaving} />
    </div>
  );
}

/** Memoized message bubble — prevents re-render when sibling messages change */
const MessageBubble = memo(function MessageBubble({
  message,
  isCurrentUser,
  sender,
  showAvatar,
  currentUserId,
  isProfessionalView,
  threadParticipants,
  allUsers,
}: {
  message: { id: string; content: string; timestamp: string; readBy: string[]; attachments?: Attachment[] };
  isCurrentUser: boolean;
  sender: { id: string; name: string; avatar?: string; color: string } | undefined;
  showAvatar: boolean;
  currentUserId?: string;
  isProfessionalView?: boolean;
  threadParticipants?: string[];
  allUsers?: { id: string; name: string; avatar?: string }[];
}) {
  const senderColor = sender ? getParentColor(getEffectiveColor(sender, currentUserId)) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isCurrentUser ? "justify-end" : "justify-start")}
    >
      {!isCurrentUser && showAvatar && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback
            className="text-xs"
            style={{ backgroundColor: senderColor ? senderColor + '30' : undefined, color: senderColor }}
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
            ? "bg-primary text-white rounded-br-md"
            : "bg-card border border-border text-foreground rounded-bl-md"
        )}>
          {message.attachments?.map((attachment) => (
            <div key={attachment.id} className="mb-2 last:mb-0">
              {attachment.type === 'image' ? (
                <img src={attachment.url} alt={attachment.name} className="max-h-52 w-full rounded-xl object-cover" />
              ) : (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm",
                    isCurrentUser ? "border-white/30 bg-card/10 text-white" : "border-border bg-background text-foreground"
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
        <div className={cn("flex items-center gap-1 mt-1", isCurrentUser ? "justify-end" : "justify-start")}>
          <span className="text-xs text-muted-foreground">{formatMessageDate(message.timestamp)}</span>
          {isCurrentUser && (
            message.readBy.length > 1
              ? <CheckCheck className="w-3 h-3 text-[#f58a2d]" />
              : <Check className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
        {/* Per-parent read receipts for professional view */}
        {isProfessionalView && isCurrentUser && threadParticipants && allUsers && (
          <div className="flex items-center gap-2 mt-1 justify-end">
            {threadParticipants
              .filter(pid => pid !== currentUserId)
              .map(pid => {
                const parent = allUsers.find(u => u.id === pid);
                const hasRead = message.readBy.includes(pid);
                return (
                  <div key={pid} className="flex items-center gap-1">
                    <span className={`text-[10px] ${hasRead ? 'text-[#1a7a3a]' : 'text-muted-foreground'}`}>
                      {parent?.name?.split(' ')[0] || 'Ukendt'}
                    </span>
                    {hasRead ? (
                      <CheckCheck className="w-3 h-3 text-[#1a7a3a]" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </motion.div>
  );
});
