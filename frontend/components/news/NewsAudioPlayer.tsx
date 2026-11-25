"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from "lucide-react";
import { type NewsItem, formatNewsDate } from "@/lib/news/types";

export interface PlayerState {
  queue: NewsItem[];
  index: number;
  mode: "single" | "queue";
  playing: boolean;
  label: string;
  phase: "item" | "next" | "end";
}

interface NewsAudioPlayerProps {
  player: PlayerState;
  voice: "female" | "male";
  rate: number;
  onVoiceChange: (v: "female" | "male") => void;
  onRateChange: (r: number) => void;
  onJumpToItem: (item: NewsItem) => void;
  onStateChange: (next: PlayerState) => void;
}

function splitSpeechChunks(text: string): string[] {
  const sentences = (text || "").split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (!s.trim()) continue;
    if ((cur + " " + s).length > 180 && cur) {
      out.push(cur);
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) out.push(cur);
  return out.flatMap((c) => (c.length <= 220 ? [c] : c.match(/.{1,200}(\s|$)/g) || [c]));
}

function pickVietnameseVoice(gender: "female" | "male"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  try {
    const voices = window.speechSynthesis.getVoices();
    const vi = voices.filter((v) => /^vi/i.test(v.lang));
    if (!vi.length) return null;
    if (gender === "male") {
      return (
        vi.find((v) => /nam|male|minh|an\b/i.test(v.name)) ||
        vi[vi.length - 1] ||
        vi[0]
      );
    }
    return (
      vi.find((v) => /hoai|my|nu|female|linh|mai|natural|neural/i.test(v.name)) ||
      vi[0]
    );
  } catch {
    return null;
  }
}

export function NewsAudioPlayer({
  player,
  voice,
  rate,
  onVoiceChange,
  onRateChange,
  onJumpToItem,
  onStateChange,
}: NewsAudioPlayerProps) {
  const [chunkProgress, setChunkProgress] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const tokenRef = useRef(0);
  const playerRef = useRef(player);
  const voiceRef = useRef(voice);
  const rateRef = useRef(rate);

  playerRef.current = player;
  voiceRef.current = voice;
  rateRef.current = rate;

  const currentItem = player.index >= 0 ? player.queue[player.index] : null;

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setTtsSupported(ok);
    if (ok) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    }
    return () => {
      tokenRef.current++;
      if (ok) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopSpeech = useCallback(() => {
    tokenRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const speakText = useCallback(
    (text: string, onDone: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onDone();
        return;
      }
      stopSpeech();
      const myToken = tokenRef.current;
      const parts = splitSpeechChunks(text);
      if (!parts.length) {
        onDone();
        return;
      }
      let idx = 0;
      const speakNext = () => {
        if (myToken !== tokenRef.current) return;
        if (idx >= parts.length) {
          setChunkProgress(100);
          onDone();
          return;
        }
        setChunkProgress(Math.round(((idx + 1) / parts.length) * 100));
        const utter = new SpeechSynthesisUtterance(parts[idx++]);
        utter.lang = "vi-VN";
        const selectedVoice = pickVietnameseVoice(voiceRef.current);
        if (selectedVoice) utter.voice = selectedVoice;
        utter.rate = rateRef.current;
        utter.onend = speakNext;
        utter.onerror = (e) => {
          if (e.error !== "interrupted" && e.error !== "canceled") {
            speakNext();
          }
        };
        window.speechSynthesis.speak(utter);
      };
      speakNext();
    },
    [stopSpeech]
  );

  // Trigger speech whenever active item or playing state changes
  const activeId = currentItem?.id ?? null;
  const isPlaying = player.playing;
  const activeIndex = player.index;

  useEffect(() => {
    if (!currentItem || !isPlaying) {
      return;
    }
    setChunkProgress(0);
    const runItem = () => {
      const text = currentItem.speech_text || `${currentItem.title}. ${currentItem.summary}`;
      speakText(text, () => {
        const cur = playerRef.current;
        if (cur.mode === "queue" && cur.index < cur.queue.length - 1) {
          const nextIdx = cur.index + 1;
          onStateChange({
            ...cur,
            index: nextIdx,
            phase: "next",
            playing: true,
          });
        } else {
          onStateChange({
            ...cur,
            playing: false,
            phase: "end",
          });
        }
      });
    };

    if (player.phase === "next") {
      speakText("Tin tiếp theo.", () => {
        const cur = playerRef.current;
        if (cur.playing && cur.index === activeIndex) {
          onStateChange({ ...cur, phase: "item" });
          runItem();
        }
      });
    } else {
      runItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, activeIndex, isPlaying, voice, rate]);

  const togglePause = useCallback(() => {
    const cur = playerRef.current;
    if (!cur.queue.length || cur.index < 0) return;
    if (cur.playing) {
      stopSpeech();
      onStateChange({ ...cur, playing: false });
    } else {
      onStateChange({ ...cur, playing: true, phase: "item" });
    }
  }, [onStateChange, stopSpeech]);

  const stopAll = useCallback(() => {
    stopSpeech();
    setChunkProgress(0);
    onStateChange({
      queue: [],
      index: -1,
      mode: "single",
      playing: false,
      label: "",
      phase: "item",
    });
  }, [onStateChange, stopSpeech]);

  const stepItem = useCallback(
    (delta: number) => {
      const cur = playerRef.current;
      const next = cur.index + delta;
      if (next < 0 || next >= cur.queue.length) return;
      stopSpeech();
      onStateChange({ ...cur, index: next, playing: true, phase: "item" });
    },
    [onStateChange, stopSpeech]
  );

  // Keyboard shortcuts: Space (play/pause), ArrowLeft/ArrowRight (prev/next item)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!playerRef.current.queue.length) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === " ") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepItem(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepItem(1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepItem, togglePause]);

  if (!currentItem) return null;

  const isQueue = player.mode === "queue" && player.queue.length > 1;
  const episodePercent = isQueue
    ? Math.round(((player.index + chunkProgress / 100) / player.queue.length) * 100)
    : chunkProgress;

  return (
    <div
      role="region"
      aria-label="Trình phát Podcast tin tức AI"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md"
    >
      {/* Overall Episode / Item Progress */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(2, episodePercent))}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={() => onJumpToItem(currentItem)}
          className="min-w-0 flex-1 text-left hover:opacity-90"
          title="Cuộn tới bài đang đọc"
        >
          <div className="flex items-center gap-2 text-[11px] font-medium text-amber-300">
            <Volume2 className="size-3.5 shrink-0" />
            <span>
              {isQueue ? `${player.label} · ${player.index + 1}/${player.queue.length}` : "Đọc bài đơn"}
            </span>
            <span className="text-slate-400">· {formatNewsDate(currentItem.date)}</span>
            {!ttsSupported && (
              <span className="text-rose-300">· Trình duyệt không hỗ trợ SpeechSynthesis</span>
            )}
          </div>
          <div className="truncate text-sm font-semibold text-white">{currentItem.title}</div>
          <div className="truncate text-xs text-slate-400">
            {currentItem.section} · {currentItem.source_label || currentItem.source}
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={player.index <= 0}
            onClick={() => stepItem(-1)}
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35"
            title="Bài trước (←)"
            aria-label="Bài trước"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onStateChange({ ...player, playing: true, phase: "item" });
            }}
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            title="Đọc lại từ đầu bài"
            aria-label="Đọc lại từ đầu"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={togglePause}
            className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-400"
            title={player.playing ? "Tạm dừng (Space)" : "Tiếp tục (Space)"}
            aria-label={player.playing ? "Tạm dừng" : "Tiếp tục"}
          >
            {player.playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-0.5" />}
          </button>
          <button
            type="button"
            disabled={player.index >= player.queue.length - 1}
            onClick={() => stepItem(1)}
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35"
            title="Qua bài kế (→)"
            aria-label="Bài sau"
          >
            <SkipForward className="size-4" />
          </button>
          <button
            type="button"
            disabled={player.index >= player.queue.length - 1}
            onClick={() => stepItem(1)}
            className="hidden size-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35 sm:flex"
            title="Chuyển nhanh bài tiếp"
            aria-label="Chuyển nhanh"
          >
            <RotateCw className="size-3.5" />
          </button>

          <select
            value={voice}
            onChange={(e) => onVoiceChange(e.target.value === "male" ? "male" : "female")}
            aria-label="Giọng đọc"
            className="hidden rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 sm:block"
          >
            <option value="female">🎙 Nữ</option>
            <option value="male">🎙 Nam</option>
          </select>

          <select
            value={String(rate)}
            onChange={(e) => onRateChange(parseFloat(e.target.value) || 1)}
            aria-label="Tốc độ đọc"
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
          >
            <option value="0.75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="1.75">1.75×</option>
            <option value="2">2×</option>
          </select>

          <button
            type="button"
            onClick={stopAll}
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white"
            title="Dừng phát"
            aria-label="Dừng phát"
          >
            <Square className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
