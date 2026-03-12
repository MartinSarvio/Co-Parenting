import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Users,
  Lock,
  Heart,
  MessageCircle,
  Send,
  Plus,
  ImagePlus,
  X,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Search,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Types ─── */

interface ForumComment {
  id: string;
  userId: string;
  name: string;
  text: string;
  time: string;
}

interface GroupPost {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: number;
  commentsList: ForumComment[];
  image: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'member';
}

interface PendingRequest {
  userId: string;
  name: string;
  avatar: string;
}

interface GroupInfo {
  id: string;
  name: string;
  image: string;
  description: string;
  type: 'open' | 'closed';
  members: number;
  rules?: string;
  ownerId: string;
}

/* (demo data removed — fetched from Supabase) */

export function GroupDetailView() {
  const { viewGroupId, currentUser, setViewProfileUserId, setActiveTab, groupDetailSearchOpen, addNotification } = useAppStore();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Reset search when closed
  useEffect(() => {
    if (!groupDetailSearchOpen) setSearchText('');
  }, [groupDetailSearchOpen]);
  const postImageRef = useRef<HTMLInputElement>(null);

  // Fetch group data from Supabase
  useEffect(() => {
    if (!viewGroupId) return;
    const uid = currentUser?.id;

    (async () => {
      setIsLoading(true);

      // Fetch group info
      const { data: groupData } = await supabase
        .from('forum_groups')
        .select('*')
        .eq('id', viewGroupId)
        .single();

      if (groupData) {
        setGroup({
          id: groupData.id,
          name: groupData.name,
          image: groupData.image || '',
          description: groupData.description || '',
          type: groupData.type || 'open',
          members: groupData.member_count || 0,
          ownerId: groupData.owner_id,
          rules: groupData.rules || undefined,
        });
      }

      // Fetch posts with author profiles
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('*, profiles:user_id(name, avatar)')
        .eq('group_id', viewGroupId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsData && postsData.length > 0) {
        const postIds = postsData.map((p: { id: string }) => p.id);

        const { data: likedData } = uid
          ? await supabase.from('forum_post_likes').select('post_id').eq('user_id', uid).in('post_id', postIds)
          : { data: [] };
        const likedSet = new Set((likedData || []).map((l: { post_id: string }) => l.post_id));

        const { data: commentsData } = await supabase
          .from('forum_comments')
          .select('*, profiles:user_id(name)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        const commentsByPost: Record<string, ForumComment[]> = {};
        for (const c of (commentsData || [])) {
          const pid = (c as { post_id: string }).post_id;
          if (!commentsByPost[pid]) commentsByPost[pid] = [];
          const profile = (c as { profiles: { name: string } | null }).profiles;
          commentsByPost[pid].push({
            id: c.id,
            userId: (c as { user_id: string }).user_id,
            name: profile?.name || 'Ukendt',
            text: c.text,
            time: formatRelativeTime(c.created_at),
          });
        }

        const mapped: GroupPost[] = postsData.map((p: Record<string, unknown>) => {
          const profile = p.profiles as { name: string; avatar?: string } | null;
          return {
            id: p.id as string,
            userId: p.user_id as string,
            name: profile?.name || 'Ukendt',
            avatar: profile?.avatar || '',
            text: p.text as string,
            time: formatRelativeTime(p.created_at as string),
            likes: (p.like_count as number) || 0,
            liked: likedSet.has(p.id as string),
            comments: (p.comment_count as number) || 0,
            commentsList: commentsByPost[p.id as string] || [],
            image: (p.image as string) || '',
          };
        });
        setGroupPosts(mapped);
      } else {
        setGroupPosts([]);
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from('forum_group_members')
        .select('*, profiles:user_id(name, avatar)')
        .eq('group_id', viewGroupId);

      if (membersData) {
        setMembers(membersData.map((m: Record<string, unknown>) => {
          const profile = m.profiles as { name: string; avatar?: string } | null;
          return {
            id: m.user_id as string,
            name: profile?.name || 'Ukendt',
            avatar: profile?.avatar || '',
            role: (m.role as 'owner' | 'member') || 'member',
          };
        }));
      }

      // Fetch pending requests (if owner)
      if (groupData && groupData.owner_id === uid) {
        const { data: requestsData } = await supabase
          .from('forum_join_requests')
          .select('*, profiles:user_id(name, avatar)')
          .eq('group_id', viewGroupId)
          .eq('status', 'pending');

        if (requestsData) {
          setPending(requestsData.map((r: Record<string, unknown>) => {
            const profile = r.profiles as { name: string; avatar?: string } | null;
            return {
              userId: r.user_id as string,
              name: profile?.name || 'Ukendt',
              avatar: profile?.avatar || '',
            };
          }));
        }
      }

      setIsLoading(false);
    })();
  }, [viewGroupId, currentUser?.id]);

  // Apply search filter
  const filteredPosts = searchText.trim()
    ? groupPosts.filter(p => p.text.toLowerCase().includes(searchText.toLowerCase()) || p.name.toLowerCase().includes(searchText.toLowerCase()))
    : groupPosts;

  if (isLoading || !group) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f58a2d] border-t-transparent" />
      </div>
    );
  }

  const isOwner = group.ownerId === currentUser?.id;

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !currentUser?.id) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: GroupPost = {
      id: tempId,
      userId: currentUser.id,
      name: currentUser.name || 'Dig',
      avatar: '',
      text: newPostText.trim(),
      time: 'Lige nu',
      likes: 0,
      liked: false,
      comments: 0,
      commentsList: [],
      image: newPostImage || '',
    };
    setGroupPosts(prev => [optimistic, ...prev]);
    setNewPostText('');
    setNewPostImage(null);
    setShowNewPost(false);

    const { data, error } = await supabase.from('forum_posts').insert({
      group_id: viewGroupId,
      user_id: currentUser.id,
      text: optimistic.text,
      image: optimistic.image,
    }).select('id').single();

    if (data) {
      setGroupPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
    } else if (error) {
      toast.error('Kunne ikke oprette opslag');
      setGroupPosts(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const toggleLike = async (postId: string) => {
    const post = groupPosts.find(p => p.id === postId);
    if (!post || !currentUser?.id) return;

    setGroupPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));

    if (post.liked) {
      await supabase.from('forum_post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    } else {
      await supabase.from('forum_post_likes').insert({ post_id: postId, user_id: currentUser.id });
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !commentPostId || !currentUser?.id) return;
    const text = commentText.trim();
    const tempId = `temp-c-${Date.now()}`;

    setGroupPosts(prev => prev.map(p =>
      p.id === commentPostId
        ? { ...p, comments: p.comments + 1, commentsList: [...p.commentsList, { id: tempId, userId: currentUser.id, name: currentUser.name || 'Dig', text, time: 'Lige nu' }] }
        : p
    ));
    setCommentText('');

    const { data } = await supabase.from('forum_comments').insert({
      post_id: commentPostId,
      user_id: currentUser.id,
      text,
    }).select('id').single();

    if (data) {
      setGroupPosts(prev => prev.map(p => ({
        ...p,
        commentsList: p.commentsList.map(c => c.id === tempId ? { ...c, id: data.id } : c),
      })));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setNewPostImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const approveRequest = async (userId: string) => {
    const req = pending.find(r => r.userId === userId);
    setPending(prev => prev.filter(r => r.userId !== userId));

    // Update join request status + add as member
    await supabase.from('forum_join_requests').update({ status: 'approved' }).eq('group_id', viewGroupId!).eq('user_id', userId);
    await supabase.from('forum_group_members').insert({ group_id: viewGroupId!, user_id: userId, role: 'member' });

    if (req) {
      addNotification({
        id: `notif-group-${Date.now()}`,
        type: 'group_request_approved',
        title: 'Anmodning godkendt',
        message: `Din anmodning om at deltage i "${group.name}" er blevet godkendt.`,
        recipientId: req.userId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const rejectRequest = async (userId: string) => {
    setPending(prev => prev.filter(r => r.userId !== userId));
    await supabase.from('forum_join_requests').update({ status: 'rejected' }).eq('group_id', viewGroupId!).eq('user_id', userId);
  };

  const commentPost = commentPostId ? filteredPosts.find(p => p.id === commentPostId) : null;

  return (
    <div className="-mx-3 sm:-mx-4">
      {/* Group header — sticky banner */}
      <div className="bg-white p-4 space-y-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {group.image ? (
            <img src={group.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#eceae2] flex items-center justify-center shrink-0">
              <Users className="h-7 w-7 text-[#78766d]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[#2f2f2d]">{group.name}</h2>
              {group.type === 'closed' && <Lock className="h-3.5 w-3.5 text-[#9a978f]" />}
            </div>
            <p className="text-[12px] text-[#9a978f]">{group.members} medlemmer · {group.type === 'open' ? 'Åben' : 'Lukket'} gruppe</p>
          </div>
        </div>
        <p className="text-[13px] text-[#5f5d56] leading-relaxed">{group.description}</p>

        {/* Search field (toggled via header icon) */}
        <AnimatePresence>
          {groupDetailSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a978f]" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Søg i opslag..."
                  className="w-full rounded-xl border border-[#e5e3dc] bg-[#f9f9f7] pl-9 pr-8 py-2 text-[13px] text-[#2f2f2d] placeholder:text-[#c5c3ba] focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
                  autoFocus
                />
                {searchText && (
                  <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-[#9a978f]" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rules (collapsible) */}
      {group.rules && (
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full bg-[#faf9f6] border-y border-[#e5e3dc] px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#9a978f]" />
            <span className="text-[13px] font-semibold text-[#5f5d56]">Grupperegler</span>
          </div>
          {showRules ? <ChevronUp className="h-4 w-4 text-[#9a978f]" /> : <ChevronDown className="h-4 w-4 text-[#9a978f]" />}
        </button>
      )}
      <AnimatePresence>
        {showRules && group.rules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#faf9f6] border-b border-[#e5e3dc]"
          >
            <p className="px-4 py-3 text-[13px] text-[#5f5d56] leading-relaxed">{group.rules}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members button */}
      <button
        onClick={() => setShowMembers(!showMembers)}
        className="w-full bg-white border-b border-[#e5e3dc] px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#9a978f]" />
          <span className="text-[13px] font-semibold text-[#5f5d56]">Medlemmer ({group.members})</span>
        </div>
        {showMembers ? <ChevronUp className="h-4 w-4 text-[#9a978f]" /> : <ChevronDown className="h-4 w-4 text-[#9a978f]" />}
      </button>
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b border-[#e5e3dc]"
          >
            <div className="px-4 py-2 space-y-1">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setViewProfileUserId(m.id); setActiveTab('profile'); }}
                  className="w-full flex items-center gap-3 py-2 text-left active:bg-[#f5f4f0] rounded-lg transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="bg-[#eceae2] text-[#5f5d56] text-xs">{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-semibold text-[#2f2f2d] flex-1">{m.name}</span>
                  {m.role === 'owner' && (
                    <span className="text-[11px] font-semibold text-[#f58a2d] bg-[#f58a2d]/10 px-2 py-0.5 rounded-full">Admin</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending requests (owner only, closed groups) */}
      {isOwner && group.type === 'closed' && pending.length > 0 && (
        <div className="bg-[#fff8f0] border-b border-[#f58a2d]/20 px-4 py-3">
          <p className="text-[12px] font-semibold text-[#f58a2d] uppercase tracking-wider mb-2">
            Afventende anmodninger ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(req => (
              <div key={req.userId} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={req.avatar} />
                  <AvatarFallback className="bg-[#eceae2] text-[#5f5d56] text-xs">{req.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-semibold text-[#2f2f2d] flex-1">{req.name}</span>
                <button
                  onClick={() => approveRequest(req.userId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f58a2d] text-[11px] font-semibold text-white"
                >
                  <Check className="h-3 w-3" /> Godkend
                </button>
                <button
                  onClick={() => rejectRequest(req.userId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#e5e3dc] text-[11px] font-semibold text-[#78766d]"
                >
                  <X className="h-3 w-3" /> Afvis
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts section header */}
      <p className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider px-4 pt-4 pb-2">
        Opslag ({filteredPosts.length})
      </p>

      {/* Posts */}
      <div className="space-y-[6px]">
        {filteredPosts.length === 0 && (
          <div className="bg-white px-4 py-8 text-center">
            <p className="text-[14px] text-[#9a978f]">Ingen opslag endnu</p>
            <p className="text-[12px] text-[#c5c3ba] mt-1">Vær den første til at skrive noget!</p>
          </div>
        )}
        {filteredPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 space-y-2.5"
          >
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setViewProfileUserId(post.userId); setActiveTab('profile'); }}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.avatar} />
                  <AvatarFallback className="bg-[#eceae2] text-[#5f5d56] text-xs">{post.name[0]}</AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <button onClick={() => { setViewProfileUserId(post.userId); setActiveTab('profile'); }} className="text-left">
                    <span className="text-[13px] font-semibold text-[#2f2f2d]">{post.name}</span>
                  </button>
                  <span className="text-[10px] text-[#b5b3ab]">·</span>
                  <span className="text-[11px] text-[#9a978f]">{post.time}</span>
                </div>
              </div>
              <button className="p-1 text-[#9a978f]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[14px] text-[#2f2f2d] leading-relaxed">{post.text}</p>

            {post.image && (
              <img src={post.image} alt="" className="w-full rounded-lg object-cover max-h-60" />
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => toggleLike(post.id)}
                className={cn("flex items-center gap-1.5 text-[12px] font-medium transition-colors", post.liked ? "text-[#ef4444]" : "text-[#6b6960]")}
              >
                <Heart className={cn("h-4 w-4", post.liked && "fill-current")} strokeWidth={2} />
                {post.likes}
              </button>
              <button
                onClick={() => setCommentPostId(post.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#6b6960]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                {post.comments}
              </button>
            </div>

            {/* Inline comments preview */}
            {post.commentsList.length > 0 && (
              <div className="pt-1 space-y-2 border-t border-[#f0efea]">
                {post.commentsList.slice(-2).map(c => (
                  <div key={c.id} className="flex gap-2">
                    <button onClick={() => { setViewProfileUserId(c.userId); setActiveTab('profile'); }}>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-[#eceae2] text-[#5f5d56] text-[10px]">{c.name[0]}</AvatarFallback>
                      </Avatar>
                    </button>
                    <div>
                      <span className="text-[12px] font-semibold text-[#2f2f2d]">{c.name}</span>
                      <span className="text-[12px] text-[#5f5d56] ml-1">{c.text}</span>
                    </div>
                  </div>
                ))}
                {post.commentsList.length > 2 && (
                  <button
                    onClick={() => setCommentPostId(post.id)}
                    className="text-[12px] font-semibold text-[#f58a2d]"
                  >
                    Se alle {post.comments} kommentarer
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="h-16" />

      {/* FAB: New post */}
      <button
        onClick={() => setShowNewPost(true)}
        className="fixed left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#f58a2d] text-white shadow-lg hover:bg-[#e07b1f] transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        aria-label="Nyt opslag"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* New post bottom sheet */}
      {createPortal(
        <AnimatePresence>
          {showNewPost && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewPost(false)} className="fixed inset-0 z-[80] bg-black/40" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed inset-x-0 bottom-0 z-[81] rounded-t-2xl bg-white"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-[#d0cec5]" /></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setShowNewPost(false)} className="text-[13px] text-[#78766d]">Annuller</button>
                    <p className="text-[15px] font-semibold text-[#2f2f2d]">Nyt opslag i {group.name}</p>
                    <button onClick={handleCreatePost} disabled={!newPostText.trim()} className="flex items-center gap-1 text-[13px] font-semibold text-[#f58a2d] disabled:opacity-40">
                      <Send className="h-3.5 w-3.5" /> Del
                    </button>
                  </div>
                  <textarea
                    value={newPostText} onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Hvad vil du dele?"
                    className="w-full h-28 rounded-xl border border-[#e5e3dc] bg-[#f9f9f7] px-3 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#c5c3ba] resize-none focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
                    autoFocus
                  />
                  {newPostImage && (
                    <div className="relative">
                      <img src={newPostImage} alt="" className="w-full h-32 rounded-lg object-cover" />
                      <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  <button onClick={() => postImageRef.current?.click()} className="flex items-center gap-2 text-[13px] text-[#78766d] hover:text-[#5f5d56] transition-colors">
                    <ImagePlus className="h-5 w-5" /> Tilføj billede
                  </button>
                  <input ref={postImageRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Comment bottom sheet */}
      {createPortal(
        <AnimatePresence>
          {commentPostId && commentPost && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setCommentPostId(null); setCommentText(''); }} className="fixed inset-0 z-[80] bg-black/40" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed inset-x-0 bottom-0 z-[81] rounded-t-2xl bg-white max-h-[70vh] flex flex-col"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="h-1 w-10 rounded-full bg-[#d0cec5]" /></div>
                <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                  <p className="text-[15px] font-semibold text-[#2f2f2d]">Kommentarer</p>
                  <button onClick={() => { setCommentPostId(null); setCommentText(''); }} className="h-7 w-7 rounded-full bg-[#e8e7e2] flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-[#78766d]" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
                  {commentPost.commentsList.length === 0 && (
                    <p className="text-[13px] text-[#9a978f] text-center py-4">Ingen kommentarer endnu</p>
                  )}
                  {commentPost.commentsList.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <button onClick={() => { setViewProfileUserId(c.userId); setActiveTab('profile'); }}>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-[#eceae2] text-[#5f5d56] text-[10px]">{c.name[0]}</AvatarFallback>
                        </Avatar>
                      </button>
                      <div>
                        <span className="text-[12px] font-semibold text-[#2f2f2d]">{c.name}</span>
                        <span className="text-[11px] text-[#9a978f] ml-1.5">{c.time}</span>
                        <p className="text-[13px] text-[#2f2f2d] mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 border-t border-[#e5e3dc] px-4 py-3 flex items-center gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Skriv en kommentar..."
                    className="flex-1 rounded-full border border-[#e5e3dc] bg-[#f9f9f7] px-3 py-2 text-[13px] text-[#2f2f2d] placeholder:text-[#c5c3ba] focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
                    onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                  />
                  <button
                    onClick={addComment}
                    disabled={!commentText.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f58a2d] text-white disabled:opacity-40 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
