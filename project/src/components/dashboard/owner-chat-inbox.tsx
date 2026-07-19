// components/dashboard/owner-chat-inbox.tsx
// صندوق رسائل موحّد للوحة تحكم التاجر ومزوّد الخدمة: يعرض كل محادثات منتجاته/خدماته
// في مكان واحد، مع إمكانية الرد المباشر من نفس الشاشة (بدون فتح صفحة كل منتج/خدمة).
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, MessageCircle, Inbox, Store, Wrench } from 'lucide-react';
import Link from 'next/link';

interface OwnerChatInboxProps {
  ownerId: string; // auth.users.id الخاص بالتاجر/مزود الخدمة (نفس المعرّف المستخدم كـ sender_id/receiver_id في جداول الدردشة)
  role: 'seller' | 'provider';
  entities: { id: string; name: string }[]; // منتجات التاجر أو خدمات مزود الخدمة المملوكة له
}

interface ChatRow {
  id: number;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string | null;
  is_edited?: boolean;
  entityId: string;
}

interface Conversation {
  key: string; // entityId::otherUserId
  entityId: string;
  entityName: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  otherBadge: string | null; // 'تاجر' | 'مزود خدمة' | null
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  messages: ChatRow[];
}

export function OwnerChatInbox({ ownerId, role, entities }: OwnerChatInboxProps) {
  const chatTable = role === 'seller' ? 'product_chat' : 'service_chat';
  const entityIdColumn = role === 'seller' ? 'product_id' : 'service_id';
  const detailBasePath = role === 'seller' ? '/products' : '/services';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();
  const entityNameById = useMemo(() => new Map(entities.map((e) => [e.id, e.name])), [entities]);
  const entityIds = useMemo(() => entities.map((e) => e.id), [entities]);

  const fetchConversations = useCallback(async () => {
    if (entityIds.length === 0) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data: rows, error } = await supabase
        .from(chatTable)
        .select('*')
        .in(entityIdColumn, entityIds)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const list: ChatRow[] = (rows || []).map((r: any) => ({
        id: r.id,
        message: r.message,
        created_at: r.created_at,
        sender_id: r.sender_id,
        receiver_id: r.receiver_id,
        is_edited: r.is_edited,
        entityId: r[entityIdColumn],
      }));

      // كل محادثة = (منتج/خدمة معيّن + الطرف الآخر غير المالك). نتجاهل رسائل المالك لنفسه (لا يحدث عادة).
      const otherUserIds = new Set<string>();
      const grouped = new Map<string, ChatRow[]>();
      for (const row of list) {
        const otherUserId = row.sender_id === ownerId ? row.receiver_id : row.sender_id;
        if (!otherUserId || otherUserId === ownerId) continue;
        otherUserIds.add(otherUserId);
        const key = `${row.entityId}::${otherUserId}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(row);
      }

      const otherUserIdsList = Array.from(otherUserIds);
      const [profilesResult, sellersResult, providersResult] = await Promise.all([
        otherUserIds.size
          ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherUserIdsList)
          : Promise.resolve({ data: [] as any[] }),
        otherUserIds.size
          ? supabase.from('sellers').select('id, business_name, logo_url').in('id', otherUserIdsList)
          : Promise.resolve({ data: [] as any[] }),
        otherUserIds.size
          ? supabase.from('service_providers').select('user_id, business_name, logo_url, avatar_url').in('user_id', otherUserIdsList)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
      const sellersMap = new Map((sellersResult.data || []).map((s: any) => [s.id, s]));
      const providersMap = new Map((providersResult.data || []).map((p: any) => [p.user_id, p]));

      const getOtherUserInfo = (userId: string) => {
        const seller: any = sellersMap.get(userId);
        if (seller) return { name: seller.business_name || 'تاجر', avatar: seller.logo_url || null, badge: 'تاجر' };
        const provider: any = providersMap.get(userId);
        if (provider) return { name: provider.business_name || 'مزود خدمة', avatar: provider.logo_url || provider.avatar_url || null, badge: 'مزود خدمة' };
        const profile: any = profilesMap.get(userId);
        return { name: profile?.full_name || 'مستخدم', avatar: profile?.avatar_url || null, badge: null };
      };

      const convs: Conversation[] = Array.from(grouped.entries()).map(([key, msgs]) => {
        const [entityId, otherUserId] = key.split('::');
        const sorted = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const last = sorted[sorted.length - 1];
        const info = getOtherUserInfo(otherUserId);
        return {
          key,
          entityId,
          entityName: entityNameById.get(entityId) || 'عنصر محذوف',
          otherUserId,
          otherName: info.name,
          otherAvatar: info.avatar,
          otherBadge: info.badge,
          lastMessage: last?.message || '',
          lastAt: last?.created_at || '',
          // تقدير مبسّط لعدد الرسائل غير المقروءة القادمة من الطرف الآخر (لا يوجد حقل is_read في جدول الدردشة نفسه)
          unreadCount: sorted.filter((m) => m.sender_id === otherUserId).length,
          messages: sorted,
        };
      }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

      setConversations(convs);
    } catch (error: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل الرسائل.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, chatTable, entityIdColumn, entityIds, entityNameById, ownerId]);

  useEffect(() => {
    setIsLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (entityIds.length === 0) return;
    const channel = supabase
      .channel(`owner-inbox-${chatTable}-${ownerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: chatTable }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, chatTable, ownerId, entityIds.length, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedKey, conversations]);

  const selectedConversation = conversations.find((c) => c.key === selectedKey) || null;

  const handleSendReply = async () => {
    if (!selectedConversation) return;
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsSending(true);
    const { error } = await supabase.from(chatTable).insert({
      [entityIdColumn]: selectedConversation.entityId,
      sender_id: ownerId,
      receiver_id: selectedConversation.otherUserId,
      message: trimmed,
    });
    setIsSending(false);
    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إرسال الرد.', variant: 'destructive' });
      return;
    }
    setReplyText('');
    fetchConversations();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <p className="text-gray-500">جاري تحميل الرسائل...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Inbox className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد رسائل بعد</h3>
        <p className="text-gray-500 max-w-xs">
          {role === 'seller' ? 'ستظهر هنا رسائل المهتمين بمنتجاتك.' : 'ستظهر هنا رسائل المهتمين بخدماتك.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border rounded-xl overflow-hidden h-[600px] bg-card">
      {/* قائمة المحادثات */}
      <div className={`border-l md:col-span-1 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b font-semibold text-sm text-gray-700 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> المحادثات ({conversations.length})
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((conv) => (
            <button
              key={conv.key}
              onClick={() => setSelectedKey(conv.key)}
              className={`w-full text-right p-3 border-b flex items-center gap-3 hover:bg-muted transition-colors ${selectedKey === conv.key ? 'bg-muted' : ''}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={conv.otherAvatar || undefined} />
                <AvatarFallback>{conv.otherName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-medium text-sm truncate">{conv.otherName}</span>
                    {conv.otherBadge === 'تاجر' && <Store className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                    {conv.otherBadge === 'مزود خدمة' && <Wrench className="h-3 w-3 text-purple-500 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(conv.lastAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                {conv.otherBadge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${conv.otherBadge === 'تاجر' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {conv.otherBadge}
                  </span>
                )}
                <p className="text-xs text-gray-500 truncate">{conv.entityName}</p>
                <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* المحادثة المختارة */}
      <div className={`md:col-span-2 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            اختر محادثة من القائمة لعرض الرسائل
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedKey(null)}>رجوع</Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedConversation.otherAvatar || undefined} />
                  <AvatarFallback>{selectedConversation.otherName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold">{selectedConversation.otherName}</p>
                    {selectedConversation.otherBadge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedConversation.otherBadge === 'تاجر' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {selectedConversation.otherBadge}
                      </span>
                    )}
                  </div>
                  <Link href={`${detailBasePath}/${selectedConversation.entityId}`} className="text-xs text-blue-600 hover:underline">
                    {selectedConversation.entityName}
                  </Link>
                </div>
              </div>
              <Badge variant="outline">{selectedConversation.messages.length} رسالة</Badge>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {selectedConversation.messages.map((msg) => {
                  const isOwnerMessage = msg.sender_id === ownerId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwnerMessage ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap break-words ${isOwnerMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 border border-gray-200 text-gray-800'}`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك هنا..."
                className="min-h-[44px] max-h-[120px] resize-none text-sm"
                disabled={isSending}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              />
              <Button onClick={handleSendReply} disabled={isSending || replyText.trim() === ''} className="px-4">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
