import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

interface Profile {
  name: string;
  genres: string[];
  location: string;
  balance: number;
  currency: string;
  avatar: string;
  cover: string;
  about: string;
  social: {
    youtube: string;
    telegram: string;
    vk: string;
    instagram: string;
    twitter: string;
  };
}

interface Track {
  id: string;
  title: string;
  image: string;
  likes: number;
  comments: number;
  bpm: number;
  key: string;
}

export const useFirestore = (userId: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', userId));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as Profile);
        }

        const tracksQuery = query(
          collection(db, 'tracks'),
          where('userId', '==', userId)
        );
        const tracksSnapshot = await getDocs(tracksQuery);
        const tracksData = tracksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Track[];
        setTracks(tracksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (newProfile: Partial<Profile>) => {
    try {
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, newProfile);
      setProfile(prev => prev ? { ...prev, ...newProfile } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  const addTrack = async (track: Omit<Track, 'id'>) => {
    try {
      const tracksRef = collection(db, 'tracks');
      const newTrackRef = doc(tracksRef);
      await setDoc(newTrackRef, {
        ...track,
        userId,
        createdAt: new Date().toISOString()
      });
      const newTrack = { id: newTrackRef.id, ...track };
      setTracks(prev => [...prev, newTrack]);
      return newTrack;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add track');
      return null;
    }
  };

  return {
    profile,
    tracks,
    loading,
    error,
    updateProfile,
    addTrack
  };
};