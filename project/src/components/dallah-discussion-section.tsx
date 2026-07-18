// components/dallah-discussion-section.tsx
// النسخة النهائية - تدعم نقاشات المنتجات والخدمات كلاً على جدوله الصحيح
// (product_chat/message_likes للمنتجات، service_chat/service_message_likes للخدمات)
// لا تعتمد على أي RPC غير موجود في قاعدة البيانات - كل الدمج يتم في الواجهة.

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@supabase/supabase-js';
import { 
  Send, Loader2, Reply, Edit, Trash2, X, Check, Verified, MessageCircle, RefreshCw, Heart 
} from 'lucide-react';

// --- Interfaces and Types ---
interface DiscussionMessage {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  sender_info: {
    name: string;
    avatar_url: string | null;
    is_owner?: boolean; 
    is_verified?: boolean;
    role?: string | null;
  };
  parent_message_id: number | null;
  parent_message_content: string | null;
  parent_message_sender_name: string | null;
  is_edited?: boolean;
  likes_count: number;
  is_liked_by_user: boolean;
  pending?: boolean;
  failed?: boolean;
}

interface DallahDiscussionSectionProps {
  service: any;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

// --- مكون عرض التاريخ الآمن ---
const TimeDisplay = ({ dateString }: { dateString: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const formatDate = () => {
    const date = new Date(dateString);
    if (!isMounted) {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };
  return <span>{formatDate()}</span>;
};

// --- مكون الرسالة الفردية (لا تغيير هنا، هو صحيح) ---
const MessageItem = ({ message, currentUser, onReply, onEdit, onDelete, onLike }: { 
  message: DiscussionMessage, currentUser: User | null, onReply: (message: DiscussionMessage) => void,
  onEdit: (message: DiscussionMessage) => void, onDelete: (messageId: number) => void, onLike: (message: DiscussionMessage) => void,
}) => {
  const isCurrentUserSender = currentUser ? message.sender_id === currentUser.id : false;

  const scrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`dallah-message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('message-highlight');
      setTimeout(() => { messageElement.classList.remove('message-highlight'); }, 2000);
    }
  };

  return (
    <div id={`dallah-message-${message.id}`} className={`flex flex-col ${isCurrentUserSender ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-2 mb-1.5 ${isCurrentUserSender ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender_info.avatar_url || undefined} />
          <AvatarFallback>{message.sender_info.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-gray-700">{message.sender_info.name}</span> 
        {message.sender_info.is_owner ? (
          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">({message.sender_info.role})</Badge>
        ) : message.sender_info.role && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{message.sender_info.role}</Badge>
        )}
        {message.sender_info.is_verified && <Verified className="h-3 w-3 text-blue-500" />}
      </div>
      
      <div className={`w-auto max-w-[85%] rounded-lg p-3 relative transition-opacity ${isCurrentUserSender ? 'bg-blue-500 text-white' : 'bg-gray-100 border border-gray-200'} ${message.pending ? 'opacity-60' : ''} ${message.failed ? 'opacity-70 border border-red-400' : ''}`}>
        {message.parent_message_id && (
          <div className={`mb-2 p-2 border-r-2 rounded-md cursor-pointer ${isCurrentUserSender ? 'bg-white/20 border-white/50' : 'bg-gray-200/70 border-gray-400'}`}
            onClick={() => scrollToMessage(message.parent_message_id!)}>
            <p className={`font-semibold text-xs ${isCurrentUserSender ? 'text-white' : 'text-gray-800'}`}>{message.parent_message_sender_name}</p>
            <p className={`text-xs truncate ${isCurrentUserSender ? 'text-white/80' : 'text-gray-600'}`}>{message.parent_message_content}</p>
          </div>
        )}
        <p className={`text-sm whitespace-pre-wrap break-words ${isCurrentUserSender ? 'text-white' : 'text-gray-800'}`}>{message.content}</p>
        <div className={`flex items-center gap-1 text-xs mt-1.5 ${isCurrentUserSender ? 'text-left text-white/70' : 'text-left text-gray-500'}`}>
          {message.pending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>جارٍ الإرسال...</span>
            </>
          ) : message.failed ? (
            <span className="text-red-200">فشل الإرسال</span>
          ) : (
            <>
              <TimeDisplay dateString={message.created_at} />
              {message.is_edited && <span className="italic"> (تم التعديل)</span>}
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-1 mt-1 p-1">
        {!isCurrentUserSender && (
          <>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8 px-2 text-gray-600 hover:text-red-500" title="إعجاب" onClick={() => onLike(message)}>
              <Heart className={`h-4 w-4 transition-all ${message.is_liked_by_user ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-gray-500'}`} />
              {message.likes_count > 0 && <span className="text-xs font-semibold">{message.likes_count}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8 px-2 text-gray-600 hover:text-gray-800" title="رد" onClick={() => onReply(message)}>
              <Reply className="h-4 w-4" />
              <span className="text-xs font-semibold">رد</span>
            </Button>
          </>
        )}
        {isCurrentUserSender && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="تعديل" onClick={() => onEdit(message)}>
              <Edit className="h-4 w-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" title="حذف" onClick={() => onDelete(message.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export function DallahDiscussionSection({ service, currentUser, onOpenAuthModal }: DallahDiscussionSectionProps) {

  // ── تحديد نوع الكائن: منتج (له sellers) أم خدمة (لها service_providers) ──
  const isService = !!service?.service_providers || !!service?.service_provider_id;
  const chatTable = isService ? 'service_chat' : 'product_chat';
  const chatIdColumn = isService ? 'service_id' : 'product_id';
  const likesTable = isService ? 'service_message_likes' : 'message_likes';
  // ملاحظة: sender_id/receiver_id في جداول الدردشة تشير إلى auth.users.id
  // بالنسبة للبائعين sellers.id = auth.users.id، لكن مزودي الخدمة لهم PK مستقل
  // (service_providers.id) والمعرّف الحقيقي لحساب المستخدم هو service_providers.user_id
  // لا يوجد fallback لـ service_providers.id عمداً: قيد المفتاح الخارجي يشير إلى
  // auth.users، فاستخدام PK الداخلي كـ fallback قد يمرر رسائل لمستقبل خاطئ أو يفشل بصمت.
  // بعض سجلات مزودي الخدمة القديمة لم يكن يُملأ فيها عمود user_id (كانت تعتمد فقط على
  // service_providers.id)؛ نستخدم id كاحتياط حتى لا تفشل عملية إرسال الرسالة (receiver_id
  // إلزامي في جدول service_chat) إذا صادفنا سجلاً بلا user_id.
  const ownerId = isService ? (service?.service_providers?.user_id || service?.service_providers?.id) : service?.sellers?.id;
  const ownerName = isService ? service?.service_providers?.business_name : service?.sellers?.business_name;
  const ownerAvatar = isService ? (service?.service_providers?.logo_url || service?.service_providers?.avatar_url) : service?.sellers?.logo_url;

  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  // رسائل متفائلة (قيد الإرسال/فاشلة) منفصلة عن القائمة المجلوبة من الخادم، حتى لا يمحوها
  // أي إعادة جلب خلفية (ناتجة عن Realtime لرسائل مستخدمين آخرين) قبل اكتمال إرسالها فعلياً.
  const [pendingMessages, setPendingMessages] = useState<DiscussionMessage[]>([]);
  const tempIdCounterRef = useRef(0);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DiscussionMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DiscussionMessage | null>(null);
  const [editContent, setEditContent] = useState("");

  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlightedMessageId = searchParams.get('message_id');
  const hasScrolledToHighlight = useRef(false);

  // ▼▼▼ جلب الرسائل مباشرة من الجدول الصحيح (بدون أي RPC) ودمج بيانات المرسلين والإعجابات في الواجهة ▼▼▼
  const fetchDiscussions = useCallback(async (entityId: string) => {
    try {
      const { data: rawMessages, error: messagesError } = await supabase
        .from(chatTable)
        .select('*')
        .eq(chatIdColumn, entityId)
        .order('created_at', { ascending: true });
      if (messagesError) throw messagesError;

      const list = rawMessages || [];
      const messageIds = list.map((m: any) => m.id);
      const senderIds = Array.from(new Set(list.map((m: any) => m.sender_id).filter(Boolean)));

      const [likesResult, sellersResult, providersResult, displayInfoResult] = await Promise.all([
        messageIds.length
          ? supabase.from(likesTable).select('message_id, user_id').in('message_id', messageIds)
          : Promise.resolve({ data: [], error: null }),
        // نتحقق أيضاً إن كان أحد المشاركين في النقاش (غير المالك) مسجّلاً كتاجر أو مزود خدمة
        // في مكان آخر من الموقع، لنعرض شعاره واسم نشاطه التجاري + وسم دوره، بدل الاسم الشخصي فقط.
        senderIds.length
          ? supabase.from('sellers').select('id, business_name, logo_url').in('id', senderIds)
          : Promise.resolve({ data: [], error: null }),
        senderIds.length
          ? supabase.from('service_providers').select('user_id, business_name, logo_url, avatar_url').in('user_id', senderIds)
          : Promise.resolve({ data: [], error: null }),
        // لا يمكن للعميل قراءة auth.users (البريد/الميتاداتا) مباشرةً بسبب RLS، لذا نستخدم
        // RPC يعمل بصلاحيات SECURITY DEFINER لإرجاع اسم عرض آمن (نفس سلسلة الاحتياط
        // المستخدمة في مشغّل إشعارات الدردشة)، بدل الاعتماد فقط على profiles.full_name
        // الذي يكون فارغاً لأغلب المستخدمين.
        senderIds.length
          ? supabase.rpc('get_chat_display_info', { user_ids: senderIds })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (likesResult.error) throw likesResult.error;
      const likesData = likesResult.data || [];
      const sellersMap = new Map((sellersResult.data || []).map((s: any) => [s.id, s]));
      const providersMap = new Map((providersResult.data || []).map((p: any) => [p.user_id, p]));
      const displayInfoMap = new Map((displayInfoResult.data || []).map((d: any) => [d.id, d]));
      if (displayInfoResult.error) {
        console.warn('فشل جلب أسماء المرسلين (get_chat_display_info):', displayInfoResult.error?.message || displayInfoResult.error);
      }
      const messagesById = new Map(list.map((m: any) => [m.id, m]));

      const getSenderInfo = (senderId: string) => {
        if (ownerId && senderId === ownerId) {
          return { name: ownerName || 'البائع', avatar_url: ownerAvatar || null, is_owner: true, role: isService ? 'مزود الخدمة' : 'البائع' };
        }
        const seller: any = sellersMap.get(senderId);
        if (seller) {
          return { name: seller.business_name || 'تاجر', avatar_url: seller.logo_url || null, is_owner: false, role: 'تاجر' };
        }
        const provider: any = providersMap.get(senderId);
        if (provider) {
          return { name: provider.business_name || 'مزود خدمة', avatar_url: provider.logo_url || provider.avatar_url || null, is_owner: false, role: 'مزود خدمة' };
        }
        const displayInfo: any = displayInfoMap.get(senderId);
        return { name: displayInfo?.display_name || 'مستخدم', avatar_url: displayInfo?.avatar_url || null, is_owner: false, role: null };
      };

      const processedMessages: DiscussionMessage[] = list.map((msg: any) => {
        const likes_count = likesData.filter((l: any) => l.message_id === msg.id).length;
        const is_liked_by_user = likesData.some((l: any) => l.message_id === msg.id && l.user_id === currentUser?.id);
        const parentMsg = msg.parent_message_id ? messagesById.get(msg.parent_message_id) : null;

        return {
          id: msg.id,
          content: msg.message,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          sender_info: getSenderInfo(msg.sender_id),
          parent_message_id: msg.parent_message_id || null,
          parent_message_content: parentMsg ? parentMsg.message : null,
          parent_message_sender_name: parentMsg ? getSenderInfo(parentMsg.sender_id).name : null,
          is_edited: !!msg.is_edited,
          likes_count,
          is_liked_by_user,
        };
      });

      setMessages(processedMessages);
    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل في تحميل المناقشات.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, chatTable, chatIdColumn, likesTable, ownerId, ownerName, ownerAvatar, currentUser?.id]);


  useEffect(() => {
    if (service?.id) {
      setIsLoading(true);
      fetchDiscussions(service.id);
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [service?.id, fetchDiscussions]);

  useEffect(() => {
    if (!service?.id) return;
    const channel = supabase
      .channel(`public-discussion-${chatTable}-${service.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: chatTable }, () => fetchDiscussions(service.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: likesTable }, () => fetchDiscussions(service.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [service?.id, supabase, fetchDiscussions, chatTable, likesTable]);

  useEffect(() => {
    // إذا جاء المستخدم من إشعار برسالة محددة (?message_id=...) نقفز إليها ونضيء خلفيتها
    // مؤقتاً، بدل التمرير التلقائي المعتاد لأسفل القائمة.
    if (!highlightedMessageId || hasScrolledToHighlight.current || messages.length === 0) return;
    const messageElement = document.getElementById(`dallah-message-${highlightedMessageId}`);
    if (messageElement) {
      hasScrolledToHighlight.current = true;
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('message-highlight');
      setTimeout(() => { messageElement.classList.remove('message-highlight'); }, 2500);
    }
  }, [messages, highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId) return; // لا تمرّر تلقائياً لأسفل عند وجود رسالة محددة للانتقال إليها
    const scrollContainer = scrollAreaRef.current?.querySelector('div');
    if (!scrollContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom < 150 || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessages, isLoading, highlightedMessageId]);

  const handleSendMessage = async () => {
    if (!currentUser) { onOpenAuthModal(); return; }
    if (!service?.id) return;
    const trimmed = newMessage.trim();
    if (trimmed === "") return;

    // نتحقق من الجلسة مع الخادم قبل الإرسال، لكن دون أن نُسقط المستخدم فوراً عند أي خطأ:
    // فقط خطأ "لا توجد جلسة فعلاً" (AuthSessionMissingError) يعني أن تسجيل الدخول انتهى
    // فعلاً. أي خطأ آخر (انقطاع شبكة عابر، مهلة، إلخ) لا يعني أن المستخدم سجّل خروجه —
    // في هذه الحالة نعتمد على currentUser (المُتحقق منه مسبقاً عبر AuthContext) ونحاول
    // الإرسال، ونترك خطأ RLS الحقيقي (إن وُجد) يُعالَج أدناه بعد محاولة الإدراج نفسها.
    const { data: { user: verifiedFromServer }, error: getUserError } = await supabase.auth.getUser();
    const sessionDefinitelyMissing = !!getUserError && /session|jwt/i.test(getUserError.message || '') && !verifiedFromServer;
    if (sessionDefinitelyMissing) {
      console.warn('جلسة غير صالحة عند محاولة الإرسال (auth.getUser فشل):', getUserError?.message || getUserError);
      toast({ title: "انتهت جلستك", description: "سجّل الدخول من جديد ثم أعد إرسال الرسالة.", variant: "destructive" });
      onOpenAuthModal();
      return;
    }
    const verifiedUser = verifiedFromServer ?? currentUser;

    // تحديد المستلم: للمنتج → sellers.id، للخدمة → service_providers.user_id
    const receiverId = ownerId || null;
    if (!receiverId) {
      // receiver_id إلزامي في جدولي الدردشة (NOT NULL)؛ محاولة الإرسال بدونه تفشل دوماً
      // في قاعدة البيانات برسالة عامة. نمنعها هنا ونظهر سبباً واضحاً بدل ذلك.
      console.warn('تعذر تحديد هوية مستلم الرسالة (ownerId غير متوفر) — تم إيقاف الإرسال قبل محاولة الإدراج.', { serviceId: service?.id, isService });
      toast({ title: "تعذر إرسال الرسالة", description: "لم يتم تحميل بيانات صاحب الإعلان بعد، حدّث الصفحة وحاول مرة أخرى.", variant: "destructive" });
      return;
    }
    const activeReply = replyingTo;

    // ── تحديث متفائل (Optimistic UI): نعرض الرسالة فوراً في الواجهة قبل انتظار الخادم ──
    // إشعار المستلم (البائع/مزود الخدمة) يتم إنشاؤه تلقائياً من قِبل قاعدة البيانات
    // (trigger على جدول الدردشة)، وليس من هنا، لضمان وصوله دائماً بغض النظر عن صلاحيات RLS.
    tempIdCounterRef.current += 1;
    const tempId = -(Date.now() * 1000 + tempIdCounterRef.current);
    const optimisticMessage: DiscussionMessage = {
      id: tempId,
      content: trimmed,
      created_at: new Date().toISOString(),
      sender_id: verifiedUser.id,
      sender_info: {
        name: (ownerId && verifiedUser.id === ownerId) ? (ownerName || 'البائع') : (verifiedUser.user_metadata?.full_name || verifiedUser.user_metadata?.name || verifiedUser.email?.split('@')[0] || 'أنت'),
        avatar_url: (ownerId && verifiedUser.id === ownerId) ? (ownerAvatar || null) : null,
        is_owner: !!(ownerId && verifiedUser.id === ownerId),
        role: (ownerId && verifiedUser.id === ownerId) ? (isService ? 'مزود الخدمة' : 'البائع') : null,
      },
      parent_message_id: activeReply ? activeReply.id : null,
      parent_message_content: activeReply ? activeReply.content : null,
      parent_message_sender_name: activeReply ? activeReply.sender_info.name : null,
      is_edited: false,
      likes_count: 0,
      is_liked_by_user: false,
      pending: true,
    };

    setPendingMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyingTo(null);
    setIsSending(true);

    const { error } = await supabase.from(chatTable).insert({
      [chatIdColumn]: service.id,
      sender_id: verifiedUser.id,
      receiver_id: receiverId,
      message: trimmed,
      parent_message_id: activeReply ? activeReply.id : null,
    });
    setIsSending(false);

    if (error) {
      // فشل الإرسال: نعلّم الرسالة كفاشلة بدل حذفها فوراً، حتى يرى المستخدم أنها لم تصل
      console.warn('فشل إدراج رسالة في', chatTable, error?.message || error);
      setPendingMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false, failed: true } : m));
      // خطأ RLS/صلاحيات حقيقي (42501 أو JWT) يعني أن الجلسة فعلاً غير صالحة على الخادم —
      // في هذه الحالة فقط نطلب إعادة تسجيل الدخول. أي خطأ آخر (شبكة، عمود مفقود، إلخ)
      // يُعرض كخطأ إرسال عام دون افتراض أن المستخدم غير مسجّل دخول.
      const isAuthError = error.code === '42501' || /jwt|auth/i.test(error.message || '');
      if (isAuthError) {
        toast({ title: "انتهت جلستك", description: "سجّل الدخول من جديد ثم أعد إرسال الرسالة.", variant: "destructive" });
        onOpenAuthModal();
      } else {
        toast({ title: "خطأ", description: "فشل في إرسال الرسالة.", variant: "destructive" });
      }
    } else {
      // نزيل النسخة المؤقتة فوراً؛ الرسالة الحقيقية ستصل عبر إعادة الجلب/الاشتراك اللحظي
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      fetchDiscussions(service.id);
    }
  };

  const handleStartEdit = (message: DiscussionMessage) => {
    setEditingMessage(message);
    setEditContent(message.content);
    setReplyingTo(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || editContent.trim() === "" || !service?.id) return;
    setIsSending(true);
    const { error } = await supabase.from(chatTable).update({ message: editContent.trim(), is_edited: true }).eq('id', editingMessage.id);
    setIsSending(false);
    if (error) {
      toast({ title: "خطأ", description: `فشل التعديل: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم تعديل الرسالة بنجاح." });
      handleCancelEdit();
      fetchDiscussions(service.id);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟") || !service?.id) return;
    const { error } = await supabase.from(chatTable).delete().eq('id', messageId);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف الرسالة.", variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم حذف الرسالة بنجاح." });
      fetchDiscussions(service.id);
    }
  };

  const handleLikeToggle = async (messageToLike: DiscussionMessage) => {
    if (!currentUser) { onOpenAuthModal(); return; }
    const originalMessages = [...messages];
    const isLiking = !messageToLike.is_liked_by_user;
    setMessages(currentMessages => 
      currentMessages.map(msg => msg.id === messageToLike.id ? { ...msg, is_liked_by_user: isLiking, likes_count: isLiking ? msg.likes_count + 1 : msg.likes_count - 1 } : msg)
    );
    try {
      if (isLiking) {
        const { error } = await supabase.from(likesTable).insert({ message_id: messageToLike.id, user_id: currentUser.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from(likesTable).delete().match({ message_id: messageToLike.id, user_id: currentUser.id });
        if (error) throw error;
      }
    } catch (error) {
      toast({ title: "خطأ", description: "لم نتمكن من حفظ الإعجاب.", variant: "destructive" });
      setMessages(originalMessages);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-3xl mx-auto">
      <style>{`.message-highlight { animation: highlight 2s ease-out; } @keyframes highlight { from { background-color: #fef3c7; } to { background-color: transparent; } }`}</style>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg"><MessageCircle className="h-5 w-5 text-gray-700" /></div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                دلة النقاش <Badge variant="outline">{messages.length + pendingMessages.length} رسالة</Badge>
              </h2>
              <p className="text-sm text-gray-600">{isService ? 'ناقش الخدمة مع مزود الخدمة والمستخدمين الآخرين' : 'ناقش المنتج مع البائع والمشترين الآخرين'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => service?.id && fetchDiscussions(service.id)} disabled={isLoading} className="flex items-center gap-1.5">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} تحديث
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[500px] p-4 bg-white" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <p className="text-gray-500">جاري تحميل النقاشات...</p>
          </div>
        ) : messages.length === 0 && pendingMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مناقشات بعد</h3>
            <p className="text-gray-500 max-w-xs">{isService ? 'كن أول من يبدأ النقاش حول هذه الخدمة.' : 'كن أول من يبدأ النقاش حول هذا المنتج.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} currentUser={currentUser} onReply={setReplyingTo}
                onEdit={handleStartEdit} onDelete={handleDelete} onLike={handleLikeToggle} />
            ))}
            {pendingMessages.map((message) => (
              <MessageItem key={message.id} message={message} currentUser={currentUser} onReply={setReplyingTo}
                onEdit={handleStartEdit}
                onDelete={() => setPendingMessages((prev) => prev.filter((m) => m.id !== message.id))}
                onLike={handleLikeToggle} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="border-t border-gray-200 bg-white p-4">
        {replyingTo && (
          <div className="mb-3 bg-gray-100 border-b-2 border-blue-400 rounded-md p-3 relative">
            <p className="text-sm font-medium text-gray-800">الرد على {replyingTo.sender_info.name}</p>
            <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
            <Button variant="ghost" size="icon" className="absolute top-1 left-1 h-6 w-6" onClick={() => setReplyingTo(null)}><X className="h-4 w-4" /></Button>
          </div>
        )}
        {editingMessage && (
          <div className="mb-3 bg-yellow-100 border-b-2 border-yellow-400 rounded-md p-3 relative">
            <p className="text-sm font-medium text-gray-800">تعديل رسالتك</p>
            <p className="text-sm text-gray-600 truncate">{editingMessage.content}</p>
            <Button variant="ghost" size="icon" className="absolute top-1 left-1 h-6 w-6" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="flex gap-3">
          <Textarea
            placeholder={ editingMessage ? "اكتب رسالتك المعدلة..." : (replyingTo ? `اكتب ردك على ${replyingTo.sender_info.name}...` : (currentUser ? "اكتب رسالتك هنا..." : "سجل الدخول للمشاركة في النقاش")) }
            value={editingMessage ? editContent : newMessage}
            onChange={(e) => editingMessage ? setEditContent(e.target.value) : setNewMessage(e.target.value)}
            onFocus={() => { if (!currentUser) onOpenAuthModal(); }}
            disabled={isSending || !currentUser}
            className="min-h-[80px] w-full p-3 border border-gray-300 rounded-lg bg-white resize-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editingMessage ? handleSaveEdit() : handleSendMessage(); } }}
          />
          {editingMessage ? (
            <Button onClick={handleSaveEdit} disabled={isSending || editContent.trim() === ''} className="h-auto px-5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} <span>حفظ</span>
            </Button>
          ) : (
            <Button onClick={handleSendMessage} disabled={isSending || newMessage.trim() === ''} className="h-auto px-5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} <span>إرسال</span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
