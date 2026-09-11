"use client";

import { useEffect, useRef, useState } from "react";

type SpeechResultEvent = Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: SpeechResultEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; };
type RecognitionConstructor = new () => Recognition;

export function VoiceInput({ onTranscript, className = "", label = "Speak your plan" }: { onTranscript: (transcript: string) => void; className?: string; label?: string }) {
  const [listening, setListening] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => () => recognition.current?.stop(), []);

  function toggleVoice() {
    if (listening) { recognition.current?.stop(); return; }
    const BrowserWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const RecognitionApi = BrowserWindow.SpeechRecognition || BrowserWindow.webkitSpeechRecognition;
    if (!RecognitionApi) { setUnavailable(true); return; }
    const instance = new RecognitionApi();
    instance.continuous = false; instance.interimResults = false; instance.lang = "en-AU";
    instance.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) onTranscript(transcript);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);
    recognition.current = instance; setUnavailable(false); setListening(true); instance.start();
  }

  return <div className="voice-control"><button type="button" onClick={toggleVoice} className={`voice-button ${listening ? "is-listening" : ""} ${className}`} aria-pressed={listening} aria-label={listening ? "Stop listening" : label}>{listening ? <><span className="voice-pulse"/> listening</> : <><span aria-hidden="true">⌁</span> voice</>}</button>{unavailable ? <p className="voice-unavailable">Voice transcription isn&apos;t available in this browser. You can still type.</p> : null}</div>;
}
