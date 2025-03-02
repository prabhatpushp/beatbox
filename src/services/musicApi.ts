import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const NAPSTER_API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.napster.com/v2.2";

interface NapsterTrack {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  previewURL: string;
  playbackSeconds: number;
  albumId: string;
}

interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
  duration: number;
}

interface PageData {
  tracks: Track[];
  nextOffset: number;
}

const transformTrack = (track: NapsterTrack): Track => ({
  id: track.id,
  name: track.name,
  artist_name: track.artistName,
  album_name: track.albumName,
  image: `https://api.napster.com/imageserver/v2/albums/${track.albumId}/images/500x500.jpg`,
  audio: track.previewURL,
  duration: track.playbackSeconds,
});

export const useFeaturedTracks = () => {
  return useInfiniteQuery<PageData>({
    queryKey: ["featured-tracks"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      console.log("Fetching featured tracks from Napster API, offset:", pageParam);
      const response = await fetch(
        `${BASE_URL}/tracks/top?apikey=${NAPSTER_API_KEY}&limit=20&offset=${pageParam}`
      );
      const data = await response.json();
      return {
        tracks: data.tracks.map(transformTrack),
        nextOffset: (pageParam as number) + 20,
      };
    },
    getNextPageParam: (lastPage: PageData) => lastPage.nextOffset,
  });
};

export const useSearchTracks = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      console.log("Searching tracks with query:", query);
      if (!query) return [];
      const response = await fetch(
        `${BASE_URL}/search/verbose?apikey=${NAPSTER_API_KEY}&query=${query}&type=track&limit=20`
      );
      const data = await response.json();
      return data.search.data.tracks.map(transformTrack) as Track[];
    },
    enabled: !!query,
  });
};