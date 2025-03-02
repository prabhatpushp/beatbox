import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle, Trash2 } from "lucide-react";
import { WaveType, playNote } from "@/lib/audio";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const GRID_SIZE = 16;
const DEFAULT_BPM = 120;
const DEFAULT_VOLUME = 0.5;

interface Track {
    waveType: WaveType;
    frequency: number;
    steps: boolean[];
}

interface Song {
    title: string;
    tracks: Track[];
    bpm: number;
}

const initialTracks: Track[] = [
    { waveType: "sine", frequency: 880, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "sine", frequency: 440, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "square", frequency: 330, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "square", frequency: 220, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "triangle", frequency: 165, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "triangle", frequency: 110, steps: Array(GRID_SIZE).fill(false) },
    { waveType: "sawtooth", frequency: 55, steps: Array(GRID_SIZE).fill(false) },
];

const Soundboard = () => {
    const [tracks, setTracks] = useState<Track[]>(initialTracks);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [bpm, setBpm] = useState(DEFAULT_BPM);
    const [volume, setVolume] = useState(DEFAULT_VOLUME);
    const [songTitle, setSongTitle] = useState("");
    const [savedSongs, setSavedSongs] = useState<Song[]>([]);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const songs = JSON.parse(localStorage.getItem("beatbox-songs") || "[]");
        setSavedSongs(songs);
    }, []);

    const toggleStep = (trackIndex: number, stepIndex: number) => {
        const newTracks = [...tracks];
        newTracks[trackIndex].steps[stepIndex] = !newTracks[trackIndex].steps[stepIndex];
        setTracks(newTracks);
    };

    const playStep = useCallback(() => {
        tracks.forEach((track) => {
            if (track.steps[currentStep]) {
                playNote(track.frequency, track.waveType, 0.1, volume);
            }
        });
    }, [tracks, currentStep, volume]);

    useEffect(() => {
        if (!isPlaying) return;

        const intervalTime = (60 * 1000) / bpm;
        const interval = setInterval(() => {
            playStep();
            setCurrentStep((prev) => (prev + 1) % GRID_SIZE);
        }, intervalTime);

        return () => clearInterval(interval);
    }, [isPlaying, bpm, playStep]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
            toast({
                title: "Playback started",
                description: "Click cells to create your beat pattern",
            });
        }
    };

    const clearGrid = () => {
        setTracks(
            tracks.map((track) => ({
                ...track,
                steps: Array(GRID_SIZE).fill(false),
            }))
        );
        setIsEditing(null);
        setSongTitle("");
        toast({
            title: "Grid cleared",
            description: "All steps have been reset",
        });
    };

    const saveSong = () => {
        if (!songTitle.trim()) {
            toast({
                title: "Error",
                description: "Please enter a song title",
                variant: "destructive",
            });
            return;
        }

        // Check for duplicate names, excluding the current editing song
        const duplicateSong = savedSongs.find((song, index) => song.title === songTitle && index !== isEditing);

        if (duplicateSong) {
            toast({
                title: "Error",
                description: "A song with this name already exists. Please choose a different name.",
                variant: "destructive",
            });
            return;
        }

        const song: Song = {
            title: songTitle,
            tracks,
            bpm,
        };

        let updatedSongs: Song[];

        if (isEditing !== null) {
            // Update existing song
            updatedSongs = savedSongs.map((s, index) => (index === isEditing ? song : s));
            toast({
                title: "Song updated",
                description: `"${songTitle}" has been updated`,
            });
        } else {
            // Save as new song
            updatedSongs = [...savedSongs, song];
            toast({
                title: "Song saved",
                description: `"${songTitle}" has been saved to your library`,
            });
        }

        localStorage.setItem("beatbox-songs", JSON.stringify(updatedSongs));
        setSavedSongs(updatedSongs);
        setSongTitle("");
        setIsEditing(null);
    };

    const loadSong = (song: Song, index: number) => {
        setTracks(song.tracks);
        setBpm(song.bpm);
        setSongTitle(song.title);
        setIsEditing(index);

        toast({
            title: "Song loaded",
            description: `"${song.title}" has been loaded for editing`,
        });
    };

    const deleteSong = (index: number, songTitle: string) => {
        const updatedSongs = savedSongs.filter((_, i) => i !== index);
        localStorage.setItem("beatbox-songs", JSON.stringify(updatedSongs));
        setSavedSongs(updatedSongs);

        toast({
            title: "Song deleted",
            description: `"${songTitle}" has been removed from your library`,
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-center mb-8 text-[#ff00ff]">Bitboard</h1>

                <div className="flex items-center gap-4 mb-8">
                    <Button onClick={togglePlay} className={`w-32 ${isPlaying ? "bg-red-500" : "bg-cyan-400"} hover:opacity-80`}>
                        {isPlaying ? (
                            <>
                                <StopCircle className="mr-2" /> Stop
                            </>
                        ) : (
                            <>
                                <PlayCircle className="mr-2" /> Play
                            </>
                        )}
                    </Button>

                    <Button onClick={clearGrid} variant="outline" className="bg-transparent border-gray-700 hover:border-gray-500">
                        <Trash2 className="mr-2" /> Clear
                    </Button>

                    <div className="flex items-center gap-2 ml-8">
                        <span className="text-sm text-cyan-400">BPM:</span>
                        <Slider value={[bpm]} onValueChange={(value) => setBpm(value[0])} min={60} max={300} step={1} className="w-32" />
                        <span className="text-sm w-12">{bpm}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-8">
                        <span className="text-sm text-cyan-400">Volume:</span>
                        <Slider value={[volume * 100]} onValueChange={(value) => setVolume(value[0] / 100)} min={0} max={100} step={1} className="w-32" />
                        <span className="text-sm w-12">{Math.round(volume * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <Input type="text" placeholder="Song title" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="bg-transparent border-gray-700 text-white" />
                        <Button onClick={saveSong} className="bg-[#ff00ff] hover:bg-[#ff00ff]/80">
                            {isEditing !== null ? "Update" : "Save"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 overflow-x-auto">
                    {tracks.map((track, trackIndex) => (
                        <div key={trackIndex} className="flex items-center gap-4">
                            <div className="w-24 text-cyan-400">{`${track.waveType} ${track.frequency}Hz`}</div>
                            <div className="grid grid-cols-16 gap-1 flex-1">
                                {track.steps.map((isActive, stepIndex) => (
                                    <button
                                        key={stepIndex}
                                        onClick={() => toggleStep(trackIndex, stepIndex)}
                                        className={`
                                            w-full aspect-square rounded-lg border-2 transition-colors
                                            ${isActive ? "bg-[#ff00ff] border-[#ff00ff]" : "border-gray-700 hover:border-gray-500"}
                                            ${currentStep === stepIndex && isPlaying ? "ring-2 ring-cyan-400" : ""}
                                        `}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {savedSongs.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Saved Songs</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {savedSongs.map((song, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 
                                        ${isEditing === index ? "border-[#ff00ff] bg-[#ff00ff]/10" : "border-gray-700 hover:border-gray-500"} 
                                        transition-colors`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[#ff00ff] font-bold">{song.title}</span>
                                        <span className="text-cyan-400 text-sm">BPM: {song.bpm}</span>
                                        {isEditing === index && <span className="text-[#ff00ff] text-sm">(Editing)</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => loadSong(song, index)} className="bg-cyan-400 hover:bg-cyan-400/80">
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            {isEditing === index ? "Reload" : "Load"}
                                        </Button>
                                        <Button onClick={() => deleteSong(index, song.title)} variant="outline" className="bg-transparent border-gray-700 hover:border-red-500 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Soundboard;
