
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Lyric, DisplaySettings } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

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
  const [subCategoryLyrics, setSubCategoryLyrics] = useState<Lyric[]>([]);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    backgroundColor: '#F5F5DC',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const staticAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

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
          const subLyrics = await db.getLyrics(user.id, currentLyric.subCategoryId);
          setSubCategoryLyrics(subLyrics);
          setIsFavorite(favs.includes(currentLyric.id));
        }
        setDisplaySettings(settings);
      };
      fetchData();
    }
    setInterpretation(null); // Reset when lyric changes
  }, [id]);

  const toggleFav = async () => {
    if (!user || !lyric) return;
    const newState = await db.toggleFavorite(user.id, lyric.id);
    setIsFavorite(newState);
  };

  const getInterpretation = async () => {
    if (!lyric) return;
    setExplaining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an Islamic scholar and Urdu linguist. Explain the following poetry verses (Naat/Hamd) in simple but beautiful Urdu. Focus on spiritual meaning and explain difficult words. Output ONLY the Urdu explanation text. \n\n${lyric.content}`,
      });
      setInterpretation(response.text);
    } catch (err) {
      console.error(err);
      setInterpretation("تشریح حاصل کرنے میں دشواری پیش آئی۔");
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

  const onRecitationEnd = () => {
    cleanupAudio();
    // Auto-advance logic removed for simplicity in interpretation view
  };

  const playGeminiTts = async (text: string) => {
    setIsBuffering(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Please recite this Urdu poetry clearly and emotionally:\n\n${text}` }] }],
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
      source.onended = onRecitationEnd;
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
      audio.oncanplay = () => { setIsBuffering(false); audio.play(); setIsPlaying(true); };
      audio.onended = onRecitationEnd;
      audio.onerror = () => { setIsBuffering(false); playGeminiTts(lyric.content); };
    } else if (lyric?.content) {
      playGeminiTts(lyric.content);
    }
  };

  useEffect(() => { return () => cleanupAudio(); }, [id]);

  if (!lyric) return <div className="text-center p-10 urdu-text">کلام نہیں ملا</div>;
  const rawLines = lyric.content.split('\n').map(l => l.trim()).filter(l => l !== '');

  return (
    <div className="flex flex-col items-center w-full min-h-screen pb-32 pt-4 px-4 relative page-transition" style={{ backgroundColor: displaySettings.backgroundColor }}>
      
      {/* Action Buttons */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 items-end">
        {copied && <div className="bg-[#5D4037] text-white text-[10px] font-bold px-3 py-1 rounded-full animate-bounce">کاپی کر لیا گیا</div>}
        
        <button onClick={toggleFav} className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white border border-[#5D4037]/20 text-red-600 transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>

        <button 
          onClick={getInterpretation} 
          disabled={explaining}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white border border-[#5D4037]/20 text-[#2E7D32] transition-all active:scale-90 overflow-hidden"
        >
          {explaining ? <div className="loading-spinner !w-4 !h-4"></div> : <span className="text-sm font-bold urdu-text">تشریح</span>}
        </button>

        <button onClick={toggleAudio} className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${isPlaying ? 'bg-red-700 text-white' : 'bg-[#5D4037] text-white'}`} disabled={isBuffering}>
          {isBuffering ? <div className="loading-spinner !w-5 !h-5 !border-white/30 !border-t-white"></div> : isPlaying ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="12" height="16" rx="1"/></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
        </button>
      </div>

      <div className="w-full max-w-lg mx-auto">
        <div className="w-full text-center mb-10 mt-6">
           <h2 className="urdu-text text-3xl md:text-4xl font-bold border-b-2 border-[#5D4037]/20 pb-4 inline-block mx-auto" style={{ color: displaySettings.textColor }}>{lyric.title}</h2>
        </div>

        {interpretation && (
          <div className="mb-10 p-6 bg-white/60 rounded-3xl border border-[#2E7D32]/20 animate-fadeIn text-right relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">AI Interpretation</div>
            <p className="urdu-text text-lg leading-relaxed text-[#1A4D1F]">{interpretation}</p>
            <button onClick={() => setInterpretation(null)} className="mt-4 text-xs opacity-40 hover:opacity-100 urdu-text">بند کریں</button>
          </div>
        )}

        {Array.from({ length: Math.ceil(rawLines.length / 2) }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center w-full py-8">
              <p className="urdu-text text-2xl md:text-3xl text-center leading-[2.5] px-2 mb-2 w-full break-words font-medium" style={{ color: displaySettings.textColor }}>{rawLines[i * 2]}</p>
              {rawLines[i * 2 + 1] && <p className="urdu-text text-2xl md:text-3xl text-center leading-[2.5] px-2 w-full break-words font-medium" style={{ color: displaySettings.textColor }}>{rawLines[i * 2 + 1]}</p>}
            </div>
            {i < Math.ceil(rawLines.length / 2) - 1 && <div className="w-2/3 border-b border-[#5D4037]/5 mx-auto"></div>}
          </React.Fragment>
        ))}
      </div>
      
      {isPlaying && <div className="fixed bottom-16 left-0 right-0 h-1 bg-black/5 z-50"><div className="h-full bg-red-700 transition-all duration-300" style={{ width: `${progress}%` }} /></div>}
    </div>
  );
};
