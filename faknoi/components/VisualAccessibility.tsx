"use client";

/**
 * VisualAccessibility — floating widget สำหรับโหมดผู้พิการทางสายตา
 * - TTS: แตะข้อความใดก็ได้ → อ่านออกเสียง (ใช้ Web Speech API)
 * - STT: กดปุ่ม mic → พูด → พิมพ์ลง input ที่ focus อยู่
 *
 * mount เมื่อ udVisual = true เท่านั้น
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

// Web Speech API type shims (not in default TS lib)
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
}
interface ISpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: { length: number; [index: number]: ISpeechRecognitionResult };
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface Props {
  lang: string; // "th" | "en" | "zh" | "hi"
}

// Map lang → BCP-47 for speech APIs
const LANG_MAP: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  zh: "zh-CN",
  hi: "hi-IN",
};

// Grab meaningful text from a click target — walk up DOM until we find real text
function getReadableText(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    // skip icons / svg
    if (node.tagName === "SVG" || node.tagName === "PATH") {
      node = node.parentElement;
      continue;
    }
    const text = (node.innerText || node.textContent || "").trim();
    // must be at least 3 chars and not just whitespace/emoji
    if (text.length >= 3) return text.slice(0, 300); // cap at 300 chars
    node = node.parentElement;
  }
  return "";
}

export default function VisualAccessibility({ lang }: Props) {
  const speechLang = LANG_MAP[lang] ?? "th-TH";
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const lastFocusedInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Track last focused input/textarea
  useEffect(() => {
    function onFocus(e: FocusEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") {
        lastFocusedInput.current = t as HTMLInputElement | HTMLTextAreaElement;
      }
    }
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  // Check STT support
  useEffect(() => {
    setSttSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // TTS click handler — reads meaningful text
  const handleTTSClick = useCallback((e: MouseEvent) => {
    if (!ttsEnabled) return;
    // don't read when clicking mic button itself
    const target = e.target as HTMLElement;
    if (target.closest("[data-va-widget]")) return;
    const text = getReadableText(target);
    if (!text) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = speechLang;
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }
  }, [ttsEnabled, speechLang]);

  useEffect(() => {
    document.addEventListener("click", handleTTSClick);
    return () => {
      document.removeEventListener("click", handleTTSClick);
      window.speechSynthesis?.cancel();
    };
  }, [handleTTSClick]);

  // STT
  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = final || interim;
      setTranscript(current);

      // inject into focused input
      if (final && lastFocusedInput.current) {
        const input = lastFocusedInput.current;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(input, (input.value || "") + final);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div data-va-widget className="fixed bottom-24 right-4 md:bottom-6 z-[9999] flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {transcript && (
        <div className="max-w-[200px] bg-black/80 text-white text-xs rounded-2xl px-3 py-2 text-right animate-pop">
          {transcript}
        </div>
      )}

      {/* Buttons row */}
      <div className="flex gap-2">
        {/* TTS toggle */}
        <button
          onClick={() => {
            setTtsEnabled(!ttsEnabled);
            if (ttsEnabled) window.speechSynthesis?.cancel();
          }}
          title={ttsEnabled ? "ปิดเสียงอ่าน" : "เปิดเสียงอ่าน"}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-blue-md transition-all active:scale-95"
          style={{ background: ttsEnabled ? "linear-gradient(135deg,#5478FF,#53CBF3)" : "#374151" }}>
          {ttsEnabled
            ? <Volume2 className="w-5 h-5 text-white" />
            : <VolumeX className="w-5 h-5 text-white" />}
        </button>

        {/* STT mic */}
        {sttSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            title={listening ? "หยุดฟัง" : "พูดเพื่อพิมพ์"}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-blue-md transition-all active:scale-95"
            style={{
              background: listening
                ? "linear-gradient(135deg,#ef4444,#f97316)"
                : "linear-gradient(135deg,#111FA2,#5478FF)",
              boxShadow: listening ? "0 0 0 4px rgba(239,68,68,0.3)" : undefined,
            }}>
            {listening
              ? <MicOff className="w-5 h-5 text-white" />
              : <Mic className="w-5 h-5 text-white" />}
          </button>
        )}
      </div>

      {/* Status label */}
      <p className="text-[10px] text-white/80 bg-black/50 rounded-full px-2 py-0.5">
        {listening ? "🎙️ กำลังฟัง..." : ttsEnabled ? "👆 แตะข้อความเพื่อฟัง" : "🔇 ปิดเสียง"}
      </p>
    </div>
  );
}
