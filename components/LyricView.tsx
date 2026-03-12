
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Lyric, DisplaySettings } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const LyricView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = db.getCurrentUser();
  const [lyric, setLyric] = useState<Lyric | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    backgroundColor: '#FDFCF0',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const staticAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      const fetchData = async () => {
        const [allLyrics, settings, favs] = await Promise.all([
          db.getLyrics(user.id),
          db.getSettings(user.id),
          db.getFavorites(user.id)
        ]);
        const currentLyric = allLyrics.find(l => l.id === id);
        if (currentLyric) {
          setLyric(currentLyric);
          setIsFavorite(favs.includes(currentLyric.id));
        }
        setDisplaySettings(settings);
      };
      fetchData();
    }
    setInterpretation(null);
  }, [id]);

  const toggleFav = async () => {
    if (!user || !lyric) return;
    const newState = await db.toggleFavorite(user.id, lyric.id);
    setIsFavorite(newState);
  };

  const shareLyric = async () => {
    if (!lyric) return;
    const text = `*${lyric.title}*\n\n${lyric.content}\n\n_کلامِ رضا لائبریری سے بھیجا گیا_`;
    if (navigator.share) {
      try {
        await navigator.share({ title: lyric.title, text: text });
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(text);
      alert("کلام کاپی کر لیا گیا ہے!");
    }
  };

  const exportPDF = async () => {
    if (!exportRef.current || !lyric) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: displaySettings.backgroundColor,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${lyric.title}.pdf`);
    } catch (err) {
      console.error(err);
      alert("پی ڈی ایف بنانے میں غلطی ہوئی");
    } finally {
      setIsExporting(false);
    }
  };

  const getInterpretation = async () => {
    if (!lyric) return;
    setExplaining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an Islamic scholar. Explain the following poetry in beautiful simple Urdu. Focus on spiritual meanings. \n\n${lyric.content}`,
      });
      setInterpretation(response.text);
    } catch (err) {
      setInterpretation("معذرت، تشریح دستیاب نہیں ہو سکی۔");
    } finally {
      setExplaining(false);
    }
  };

  const cleanupAudio = () => {
    if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch(e) {} sourceNodeRef.current = null; }
    if (staticAudioRef.current) { staticAudioRef.current.pause(); staticAudioRef.current = null; }
    if (progressIntervalRef.current) { window.clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
    setIsPlaying(false);
    setProgress(0);
  };

  const playGeminiTts = async (text: string) => {
    setIsBuffering(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio");
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = cleanupAudio;
      playbackStartTimeRef.current = ctx.currentTime;
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = ctx.currentTime - playbackStartTimeRef.current;
        setProgress((elapsed / audioBuffer.duration) * 100);
      }, 100);
    } catch (error) { console.error(error); } finally { setIsBuffering(false); }
  };

  const toggleAudio = async () => {
    if (isPlaying) { cleanupAudio(); return; }
    if (lyric?.audioUrl) {
      setIsBuffering(true);
      const audio = new Audio(lyric.audioUrl);
      staticAudioRef.current = audio;
      audio.onplay = () => { setIsBuffering(false); setIsPlaying(true); };
      audio.onended = cleanupAudio;
      audio.play();
    } else if (lyric?.content) {
      playGeminiTts(lyric.content);
    }
  };

  useEffect(() => { return () => cleanupAudio(); }, [id]);

  if (!lyric) return <div className="text-center p-10 urdu-text">کلام نہیں ملا</div>;
  const rawLines = lyric.content.split('\n').map(l => l.trim()).filter(l => l !== '');

  return (
    <div className="flex flex-col items-center w-full min-h-screen pb-40 pt-6 px-6 relative page-transition" style={{ backgroundColor: displaySettings.backgroundColor }}>
      
      {/* Illuminated Scroll Buttons */}
      <div className="fixed bottom-28 right-6 z-40 flex flex-col gap-4 items-end">
        <button onClick={exportPDF} disabled={isExporting} className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center bg-white border-2 border-[#D4AF37]/40 text-[#064E3B] transition-all active:scale-90">
          {isExporting ? <div className="loading-spinner !w-5 !h-5"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
        </button>

        <button onClick={shareLyric} className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center bg-white border-2 border-[#D4AF37]/40 text-[#064E3B] transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>

        <button onClick={toggleFav} className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center bg-white border-2 border-[#D4AF37]/40 text-[#8B0000] transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>

        <button onClick={getInterpretation} disabled={explaining} className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center bg-white border-2 border-[#D4AF37]/40 text-[#064E3B] transition-all active:scale-90 overflow-hidden relative">
          {explaining ? <div className="loading-spinner !w-5 !h-5"></div> : <span className="text-sm font-bold urdu-text">تشریح</span>}
          {explaining && <div className="absolute inset-0 bg-[#064E3B]/5 animate-pulse"></div>}
        </button>

        <button onClick={toggleAudio} className={`w-18 h-18 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all active:scale-95 border-4 border-[#D4AF37] ${isPlaying ? 'bg-[#8B0000] text-white' : 'bg-[#064E3B] text-[#D4AF37]'}`} disabled={isBuffering}>
          {isBuffering ? <div className="loading-spinner !w-6 !h-6 !border-white/30 !border-t-white"></div> : isPlaying ? <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="12" height="16" rx="2"/></svg> : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
        </button>
      </div>

      <div ref={exportRef} className="w-full max-w-xl mx-auto relative p-10 islamic-card rounded-[3rem] border-4 border-[#D4AF37]/30">
        {/* Manuscript Decorative Top Border */}
        <div className="flex justify-center mb-10 opacity-30">
           <svg width="200" height="40" viewBox="0 0 200 40">
              <path d="M0 20 Q50 0 100 20 Q150 40 200 20" fill="none" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="100" cy="20" r="4" fill="#D4AF37" />
           </svg>
        </div>

        <h2 className="urdu-text text-4xl md:text-5xl font-bold text-center mb-12 drop-shadow-sm" style={{ color: '#064E3B' }}>{lyric.title}</h2>

        {interpretation && (
          <div className="mb-12 p-8 bg-[#064E3B]/5 rounded-[2.5rem] border-2 border-[#D4AF37]/30 animate-fadeIn text-right relative shadow-inner">
            <div className="absolute top-4 left-4 opacity-10">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="#064E3B"><path d="M21,11L14,4L12.59,5.41L18.17,11H8V13H18.17L12.59,18.59L14,20L21,13V11Z"/></svg>
            </div>
            <p className="urdu-text text-xl leading-relaxed text-[#064E3B] font-medium">{interpretation}</p>
            <button onClick={() => setInterpretation(null)} className="mt-6 text-xs font-bold text-[#8B0000] urdu-text border-b border-[#8B0000]/30 pb-1">بند کریں</button>
          </div>
        )}

        <div className="space-y-12">
          {Array.from({ length: Math.ceil(rawLines.length / 2) }).map((_, i) => (
            <div key={i} className="flex flex-col items-center w-full">
              <p className="urdu-text text-3xl md:text-4xl text-center leading-[2.6] px-2 w-full break-words font-medium animate-fadeIn" style={{ color: displaySettings.textColor, animationDelay: `${i * 0.1}s` }}>{rawLines[i * 2]}</p>
              {rawLines[i * 2 + 1] && (
                <p className="urdu-text text-3xl md:text-4xl text-center leading-[2.6] px-2 w-full break-words font-medium animate-fadeIn" style={{ color: displaySettings.textColor, animationDelay: `${i * 0.1 + 0.05}s` }}>{rawLines[i * 2 + 1]}</p>
              )}
              {i < Math.ceil(rawLines.length / 2) - 1 && (
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mt-8"></div>
              )}
            </div>
          ))}
        </div>

        {/* Manuscript Bottom Border */}
        <div className="flex justify-center mt-16 opacity-30 rotate-180">
           <svg width="200" height="40" viewBox="0 0 200 40">
              <path d="M0 20 Q50 0 100 20 Q150 40 200 20" fill="none" stroke="#D4AF37" strokeWidth="2" />
           </svg>
        </div>
      </div>
      
      {isPlaying && (
        <div className="fixed bottom-20 left-0 right-0 h-1.5 bg-[#064E3B]/10 z-50">
          <div className="h-full bg-[#8B0000] shadow-[0_0_10px_rgba(139,0,0,0.5)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};
