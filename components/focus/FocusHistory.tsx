"use client";

import { useEffect, useState, useCallback } from "react";
import { getFocusSessions, deleteFocusSession, updateFocusSession } from "@/lib/focus";
import type { FocusSession, DistractionEvent } from "@/types";
import { card, sectionHeader } from "@/lib/theme";
import { Timer, Clock, RotateCcw, Pencil, Trash2, Loader2, Plus, Tag, ChevronDown, ChevronUp, AlertTriangle, Mail, UserX, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function formatDurationSec(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const modeIcons: Record<string, typeof Timer> = {
  pomodoro: Timer,
  stopwatch: Clock,
};

const modeColors: Record<string, string> = {
  pomodoro: "#8b6914",
  stopwatch: "#3b82f6",
};

interface FocusHistoryProps {
  onReuseSession?: (session: FocusSession) => void;
  onNewSession?: () => void;
  refreshKey?: number;
}

export default function FocusHistory({ onReuseSession, onNewSession, refreshKey }: FocusHistoryProps) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState(25);
  const [editBreak, setEditBreak] = useState(5);
  const [saving, setSaving] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    getFocusSessions(20).then((result) => {
      setSessions(result.data);
      setTableMissing(result.tableMissing);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadSessions();
  }, [refreshKey, loadSessions]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteFocusSession(id);
    if (ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  };

  const handleEditOpen = (session: FocusSession) => {
    setEditingSession(session);
    setEditTitle(session.title);
    setEditDuration(session.duration_minutes);
    setEditBreak(session.break_minutes);
  };

  const handleEditSave = async () => {
    if (!editingSession) return;
    setSaving(true);
    const updated = await updateFocusSession(editingSession.id, {
      title: editTitle,
      duration_minutes: editDuration,
      break_minutes: editBreak,
    });
    if (updated) {
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    }
    setEditingSession(null);
    setSaving(false);
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  if (loading) {
    return (
      <div className={card.base}>
        <div className="flex items-center justify-between">
          <h3 className={sectionHeader.title}>Recent Sessions</h3>
          {onNewSession && (
            <button
              onClick={onNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8b6914] text-white hover:bg-[#a07d1a] transition-colors"
            >
              <Plus size={14} />
              New Session
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between">
        <h3 className={sectionHeader.title}>Recent Sessions</h3>
        {onNewSession && (
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8b6914] text-white hover:bg-[#a07d1a] transition-colors"
          >
            <Plus size={14} />
            New Session
          </button>
        )}
      </div>

      {tableMissing ? (
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d" }}>
          <p className="text-sm font-medium" style={{ color: "#92400e" }}>
            Database table not found
          </p>
          <p className="text-xs mt-1" style={{ color: "#a16207" }}>
            Run the focus_sessions SQL migration in Supabase SQL Editor.
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          No focus sessions yet. Start your first one!
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {sessions.map((session) => {
            const Icon = modeIcons[session.mode] || Timer;
            const color = modeColors[session.mode] || "#8b6914";
            const isDeleting = deletingId === session.id;
            const isExpanded = expandedSessionId === session.id;
            const tags = session.tags ?? [];
            const notes = session.notes ?? "";
            const distractionLog = session.distraction_log ?? [];
            const hasDistractions = distractionLog.length > 0;

            return (
              <div
                key={session.id}
                className="rounded-lg border"
                style={{ borderColor: "var(--color-border)" }}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-(--color-surface-hover) transition-colors"
                  onClick={() => (tags.length > 0 || notes || hasDistractions) && toggleExpand(session.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {session.title || "Untitled"}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: session.completed ? "#ecfdf5" : "#fef2f2",
                          color: session.completed ? "#10b981" : "#ef4444",
                        }}
                      >
                        {session.completed ? "Done" : "Partial"}
                      </span>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag size={10} style={{ color: "var(--color-text-muted)" }} />
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: "#8b691420", color: "#8b6914" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes preview */}
                    {notes && !isExpanded && (
                      <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                        {notes}
                      </p>
                    )}

                    {/* Distraction badge */}
                    {hasDistractions && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle size={10} style={{ color: "#d97706" }} />
                        <span className="text-xs" style={{ color: "#d97706" }}>
                          {distractionLog.length} distraction{distractionLog.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="text-right">
                    <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {formatDuration(session.duration_minutes)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatSessionDate(session.started_at)}
                    </div>
                  </div>

                  {/* Expand arrow */}
                  {(tags.length > 0 || notes || hasDistractions) && (
                    <div style={{ color: "var(--color-text-muted)" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {onReuseSession && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onReuseSession(session); }}
                        className="p-1.5 rounded-md hover:bg-(--color-surface-hover) transition-colors"
                        title="Reuse session"
                      >
                        <RotateCcw size={14} style={{ color: "var(--color-text-secondary)" }} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditOpen(session); }}
                      className="p-1.5 rounded-md hover:bg-(--color-surface-hover) transition-colors"
                      title="Edit session"
                    >
                      <Pencil size={14} style={{ color: "var(--color-text-secondary)" }} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete session"
                    >
                      {isDeleting ? (
                        <Loader2 size={14} className="animate-spin" style={{ color: "#ef4444" }} />
                      ) : (
                        <Trash2 size={14} style={{ color: "#ef4444" }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div
                    className="px-3 pb-3 pt-1 border-t"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {/* Notes */}
                    {notes && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                          Notes
                        </h4>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>
                          {notes}
                        </p>
                      </div>
                    )}

                    {/* Distraction Log */}
                    {hasDistractions && (
                      <div>
                        <h4 className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                          Distraction Log
                        </h4>
                        <div className="space-y-2">
                          {distractionLog.map((event, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-lg text-xs"
                              style={{
                                backgroundColor: event.action === "email" ? "#fef2f2" : "#fffbeb",
                              }}
                            >
                              {event.type === "phone" ? (
                                <Phone size={12} style={{ color: event.action === "email" ? "#ef4444" : "#d97706" }} />
                              ) : (
                                <UserX size={12} style={{ color: event.action === "email" ? "#ef4444" : "#d97706" }} />
                              )}
                              <span style={{ color: "var(--color-text)" }}>
                                {event.type === "phone" ? "Phone" : "Absent"}
                              </span>
                              <span style={{ color: "var(--color-text-muted)" }}>
                                {formatDurationSec(event.durationSec)}
                              </span>
                              <span style={{ color: "var(--color-text-muted)" }}>
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                              {event.action === "email" && (
                                <Mail size={10} style={{ color: "#ef4444" }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Overlay */}
      {editingSession && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingSession(null)} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>Edit Session</h2>
              <button onClick={() => setEditingSession(null)} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <span style={{ color: "var(--color-text-secondary)" }}>✕</span>
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Session Title</Label>
                <Input
                  type="text"
                  placeholder="e.g. Deep work, Reading, Study..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Focus (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Break (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={editBreak}
                    onChange={(e) => setEditBreak(Number(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
              </div>

              <Button
                onClick={handleEditSave}
                disabled={saving}
                className="w-full bg-[#8b6914] hover:bg-[#a07d1a] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
