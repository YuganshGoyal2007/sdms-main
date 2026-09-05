import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Send,
  Inbox,
  Users,
  Building,
  GraduationCap,
  Globe,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  CheckCheck,
  Calendar,
} from 'lucide-react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import {
  getInbox,
  getRecipients,
  getSent,
  markMessageRead,
  markAllMessagesRead,
  deleteMessage,
  sendUnifiedMessage,
  type MessageNotification,
  type RecipientsPayload,
} from '../../lib/user.api';
import { safeErrorMessage } from '../../utils/safeError';

type TargetType = 'class-students' | 'all-assigned-classes' | 'class-coordinator' | 'admin';

const FacultyMessages = () => {
  const [tab, setTab] = useState<'compose' | 'inbox' | 'sent'>('compose');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [inbox, setInbox] = useState<MessageNotification[]>([]);
  const [sent, setSent] = useState<MessageNotification[]>([]);
  const [recipients, setRecipients] = useState<RecipientsPayload | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<TargetType>('class-students');
  const [selectedClassKey, setSelectedClassKey] = useState<string>('');
  const [studentMode, setStudentMode] = useState<'entire-class' | 'specific-students'>('entire-class');
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Search filter for inbox/sent
  const [listSearch, setListSearch] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [iRes, sRes, rRes] = await Promise.allSettled([getInbox(), getSent(), getRecipients()]);
      if (iRes.status === 'fulfilled') setInbox(iRes.value.messages || []);
      if (sRes.status === 'fulfilled') setSent(sRes.value.messages || []);
      if (rRes.status === 'fulfilled') {
        const rec = rRes.value.recipients || null;
        setRecipients(rec);
        if (rec?.classes && rec.classes.length > 0 && !selectedClassKey) {
          setSelectedClassKey(rec.classes[0].classKey);
        }
      }
    } catch {
      toast.error('Failed to load messaging data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignedClasses = useMemo(() => recipients?.classes || [], [recipients]);

  // Students for currently selected class
  const classStudents = useMemo(() => {
    if (!selectedClassKey || !recipients?.students) return [];
    return recipients.students.filter((s: any) => s.classKey === selectedClassKey);
  }, [selectedClassKey, recipients]);

  const filteredClassStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(
      (s: any) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  // Coordinators for currently selected class
  const classCoordinator = useMemo(() => {
    if (!selectedClassKey || !recipients?.coordinators) return null;
    return recipients.coordinators.find((c: any) => c.classKey === selectedClassKey) || null;
  }, [selectedClassKey, recipients]);

  const handleToggleStudent = (userId: number) => {
    setSelectedStudentUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentUserIds.length === classStudents.length) {
      setSelectedStudentUserIds([]);
    } else {
      setSelectedStudentUserIds(classStudents.map((s: any) => s.userId).filter(Boolean));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter a message.');
      return;
    }

    const payload: any = {
      content: content.trim(),
    };

    if (targetType === 'class-students') {
      if (!selectedClassKey) {
        toast.error('Please select an assigned class.');
        return;
      }
      if (studentMode === 'specific-students') {
        if (!selectedStudentUserIds.length) {
          toast.error('Please select at least one student.');
          return;
        }
        payload.recipientType = 'users';
        payload.recipientIds = selectedStudentUserIds;
      } else {
        payload.recipientType = 'class-students';
        payload.classKey = selectedClassKey;
      }
    } else if (targetType === 'all-assigned-classes') {
      payload.recipientType = 'all-assigned-classes';
    } else if (targetType === 'class-coordinator') {
      if (!selectedClassKey) {
        toast.error('Please select a class.');
        return;
      }
      payload.recipientType = 'class-coordinator';
      payload.classKey = selectedClassKey;
    } else if (targetType === 'admin') {
      payload.recipientType = 'admin';
    }

    setSending(true);
    try {
      const res = await sendUnifiedMessage(payload);
      toast.success(res?.message || 'Message sent successfully!');
      setContent('');
      setSelectedStudentUserIds([]);
      await loadData();
      setTab('sent');
    } catch (err: any) {
      toast.error(safeErrorMessage(err, 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    setInbox((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    try {
      await markMessageRead(id);
    } catch {
      // ignore
    }
  };

  const handleDeleteMsg = async (id: number) => {
    try {
      await deleteMessage(id);
      setInbox((prev) => prev.filter((m) => m.id !== id));
      setSent((prev) => prev.filter((m) => m.id !== id));
      toast.success('Message deleted.');
    } catch (err: any) {
      toast.error(safeErrorMessage(err, 'Failed to delete message.'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllMessagesRead();
      setInbox((prev) => prev.map((m) => ({ ...m, read: true })));
      toast.success('All marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const unreadCount = useMemo(() => inbox.filter((m) => !m.read).length, [inbox]);

  const filteredInbox = useMemo(() => {
    if (!listSearch.trim()) return inbox;
    const q = listSearch.toLowerCase();
    return inbox.filter(
      (m) =>
        m.message?.toLowerCase().includes(q) ||
        m.data?.fromName?.toLowerCase().includes(q) ||
        m.data?.fromRole?.toLowerCase().includes(q)
    );
  }, [inbox, listSearch]);

  const filteredSent = useMemo(() => {
    if (!listSearch.trim()) return sent;
    const q = listSearch.toLowerCase();
    return sent.filter(
      (m) =>
        m.message?.toLowerCase().includes(q) ||
        m.toRole?.toLowerCase().includes(q) ||
        m.data?.classKey?.toLowerCase().includes(q)
    );
  }, [sent, listSearch]);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="messages" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7b3b5a] flex items-center justify-center font-bold">
              <Send size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Faculty Communication</h1>
              <p className="text-xs text-gray-500">
                Message students, class coordinators, administration, or all your classes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 flex gap-4">
          <button
            onClick={() => setTab('compose')}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              tab === 'compose'
                ? 'border-[#7b3b5a] text-[#7b3b5a]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send size={15} />
            Compose Message
          </button>
          <button
            onClick={() => setTab('inbox')}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              tab === 'inbox'
                ? 'border-[#7b3b5a] text-[#7b3b5a]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox size={15} />
            Inbox
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[#7b3b5a] text-white rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              tab === 'sent'
                ? 'border-[#7b3b5a] text-[#7b3b5a]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send size={15} className="rotate-45" />
            Sent History ({sent.length})
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6">
          {tab === 'compose' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <form onSubmit={handleSend} className="bg-white border border-[#d9d9d9] rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Send a New Message</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose recipient audience and write your announcement or query.
                  </p>
                </div>

                {/* Target Selection Pills */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Recipient Group
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Option 1: Students of a class */}
                    <button
                      type="button"
                      onClick={() => setTargetType('class-students')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        targetType === 'class-students'
                          ? 'border-[#7b3b5a] bg-purple-50/50 text-[#7b3b5a] ring-2 ring-[#7b3b5a]/20'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <GraduationCap size={16} />
                        Class Students
                      </div>
                      <span className="text-[11px] text-gray-500">Target a specific class</span>
                    </button>

                    {/* Option 2: Universal broadcast */}
                    <button
                      type="button"
                      onClick={() => setTargetType('all-assigned-classes')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        targetType === 'all-assigned-classes'
                          ? 'border-[#7b3b5a] bg-purple-50/50 text-[#7b3b5a] ring-2 ring-[#7b3b5a]/20'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <Globe size={16} />
                        All My Classes
                      </div>
                      <span className="text-[11px] text-gray-500">Universal broadcast</span>
                    </button>

                    {/* Option 3: Class Coordinator */}
                    <button
                      type="button"
                      onClick={() => setTargetType('class-coordinator')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        targetType === 'class-coordinator'
                          ? 'border-[#7b3b5a] bg-purple-50/50 text-[#7b3b5a] ring-2 ring-[#7b3b5a]/20'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <Users size={16} />
                        Class Coordinator
                      </div>
                      <span className="text-[11px] text-gray-500">Coordinator of a class</span>
                    </button>

                    {/* Option 4: Admin */}
                    <button
                      type="button"
                      onClick={() => setTargetType('admin')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        targetType === 'admin'
                          ? 'border-[#7b3b5a] bg-purple-50/50 text-[#7b3b5a] ring-2 ring-[#7b3b5a]/20'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <Building size={16} />
                        Administration
                      </div>
                      <span className="text-[11px] text-gray-500">Direct to Admin desk</span>
                    </button>
                  </div>
                </div>

                {/* Class selector dropdown (if class-students or class-coordinator) */}
                {(targetType === 'class-students' || targetType === 'class-coordinator') && (
                  <div className="space-y-2 bg-[#f8f9fa] border border-gray-200 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-gray-800">
                      Select Assigned Class:
                    </label>
                    {assignedClasses.length === 0 ? (
                      <p className="text-xs text-amber-700">
                        You have no classes currently assigned. An admin needs to assign classes to your account.
                      </p>
                    ) : (
                      <select
                        value={selectedClassKey}
                        onChange={(e) => {
                          setSelectedClassKey(e.target.value);
                          setSelectedStudentUserIds([]);
                        }}
                        className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]"
                      >
                        {assignedClasses.map((cls: any) => (
                          <option key={cls.classKey} value={cls.classKey}>
                            {cls.label || `${cls.program} ${cls.batch} — ${cls.specialization}`}
                          </option>
                        ))}
                      </select>
                    )}

                    {targetType === 'class-coordinator' && classCoordinator && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-semibold text-gray-800">Assigned Coordinator:</span>
                        <span>{classCoordinator.name} ({classCoordinator.email})</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Individual Student Filter / Selection (if class-students) */}
                {targetType === 'class-students' && selectedClassKey && (
                  <div className="space-y-3 bg-[#f8f9fa] border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-800">
                        Class Delivery Scope:
                      </label>
                      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setStudentMode('entire-class')}
                          className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                            studentMode === 'entire-class'
                              ? 'bg-[#7b3b5a] text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          All Class Students ({classStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentMode('specific-students')}
                          className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                            studentMode === 'specific-students'
                              ? 'bg-[#7b3b5a] text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Pick Specific Students ({selectedStudentUserIds.length})
                        </button>
                      </div>
                    </div>

                    {studentMode === 'specific-students' && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                            <input
                              type="text"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder="Search student by name or roll number..."
                              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSelectAllStudents}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shrink-0 font-medium"
                          >
                            {selectedStudentUserIds.length === classStudents.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg">
                          {filteredClassStudents.length === 0 ? (
                            <div className="p-3 text-center text-xs text-gray-500">
                              No students found.
                            </div>
                          ) : (
                            filteredClassStudents.map((st: any) => {
                              const checked = selectedStudentUserIds.includes(st.userId);
                              return (
                                <label
                                  key={st.id}
                                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleStudent(st.userId)}
                                    className="rounded border-gray-300 text-[#7b3b5a] focus:ring-[#7b3b5a]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{st.fullName}</div>
                                    <div className="text-[11px] text-gray-500 font-mono">{st.rollNo} · {st.email}</div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Message Content
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your announcement, assignment instruction, or query here..."
                    className="w-full p-3.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]"
                    required
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{content.length} characters</span>
                    <span>Supports multi-line text</span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7b3b5a] hover:bg-[#5e2a44] text-white text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={15} className={sending ? 'animate-spin' : ''} />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'inbox' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search inbox..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {filteredInbox.length === 0 ? (
                <div className="bg-white border border-[#d9d9d9] rounded-2xl p-12 text-center text-gray-500">
                  <Inbox className="mx-auto mb-2 text-gray-400" size={40} />
                  <h3 className="font-semibold text-gray-800">Inbox is empty</h3>
                  <p className="text-xs text-gray-500 mt-1">No incoming messages at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInbox.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => !msg.read && handleMarkRead(msg.id)}
                      className={`bg-white border rounded-xl p-4 transition shadow-xs ${
                        msg.read ? 'border-gray-200' : 'border-purple-300 bg-purple-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-gray-900">
                              {msg.data?.fromName || 'System'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase font-medium">
                              {msg.data?.fromRole || 'sender'}
                            </span>
                            {!msg.read && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7b3b5a] text-white font-bold">
                                Unread
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mt-2">
                            {msg.message}
                          </p>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 pt-2">
                            <Calendar size={11} />
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMsg(msg.id);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'sent' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search sent messages..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              {filteredSent.length === 0 ? (
                <div className="bg-white border border-[#d9d9d9] rounded-2xl p-12 text-center text-gray-500">
                  <Send className="mx-auto mb-2 text-gray-400 rotate-45" size={40} />
                  <h3 className="font-semibold text-gray-800">No sent messages</h3>
                  <p className="text-xs text-gray-500 mt-1">Messages you compose will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSent.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 transition shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-gray-900">
                              To: {msg.toRole ? msg.toRole.toUpperCase() : 'Student/User'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7b3b5a] font-medium border border-purple-200">
                              Scope: {msg.scope || 'direct'}
                            </span>
                            {msg.data?.classKey && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                                {msg.data.classKey}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mt-2">
                            {msg.message}
                          </p>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 pt-2">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Sent on {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMsg(msg.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FacultyMessages;
