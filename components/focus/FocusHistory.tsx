"use client";

import { useEffect, useState, useCallback } from "react";
import { getFocusSessions, deleteFocusSession, updateFocusSession } from "@/lib/focus";
import type { FocusSession } from "@/types";
import { card, sectionHeader } from "@/lib/theme";
import { Timer, Clock, RotateCcw, Pencil, Trash2, Loader2, Plus } from "lucide-react";
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Title</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Mode</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Duration</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Started</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Status</th>
                <th className="text-center py-2 pr-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>Completed</th>
                <th className="py-2 text-right font-medium" style={{ color: "var(--color-text-secondary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const Icon = modeIcons[session.mode] || Timer;
                const color = modeColors[session.mode] || "#8b6914";
                const isDeleting = deletingId === session.id;

                return (
                  <tr
                    key={session.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium" style={{ color: "var(--color-text)" }}>
                        {session.title || "Untitled"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} style={{ color }} />
                        <span className="capitalize" style={{ color: "var(--color-text-secondary)" }}>
                          {session.mode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: "var(--color-text-secondary)" }}>
                      {formatDuration(session.duration_minutes)}
                    </td>
                    <td className="py-3 pr-4" style={{ color: "var(--color-text-muted)" }}>
                      {formatSessionDate(session.started_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: session.completed ? "#ecfdf5" : "#fef2f2",
                          color: session.completed ? "#10b981" : "#ef4444",
                        }}
                      >
                        {session.completed ? "Done" : "Partial"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (session.completed_count ?? 0) > 0 ? "#eff6ff" : "var(--color-surface-hover)",
                          color: (session.completed_count ?? 0) > 0 ? "#3b82f6" : "var(--color-text-muted)",
                        }}
                      >
                        {session.completed_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Reuse */}
                        {onReuseSession && (
                          <button
                            onClick={() => onReuseSession(session)}
                            className="p-1.5 rounded-md hover:bg-(--color-surface-hover) transition-colors"
                            title="Reuse session"
                          >
                            <RotateCcw size={14} style={{ color: "var(--color-text-secondary)" }} />
                          </button>
                        )}
                        {/* Edit */}
                        <button
                          onClick={() => handleEditOpen(session)}
                          className="p-1.5 rounded-md hover:bg-(--color-surface-hover) transition-colors"
                          title="Edit session"
                        >
                          <Pencil size={14} style={{ color: "var(--color-text-secondary)" }} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(session.id)}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
