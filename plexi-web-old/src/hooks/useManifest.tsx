/**
 * src/hooks/useManifest.ts
 * Centralized hook to fetch and filter the study materials manifest.
 */
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';

export interface FileInfo {
  name: string;
  url?: string;
  download_url?: string;
  size?: number;
  updated_at?: string;
  type?: string;
}

export interface SubjectData {
  [type: string]: FileInfo[];
}

export interface SemesterData {
  [subject: string]: SubjectData;
}

export interface ManifestData {
  [semester: string]: SemesterData;
}

export function useManifest() {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchManifest() {
      try {
        setLoading(true);
        const data = await api.getManifest();
        setManifest(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load manifest');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchManifest();
  }, []);

  const semesters = useMemo(() => {
    return manifest ? Object.keys(manifest).sort() : [];
  }, [manifest]);

  const getSubjects = (semester: string) => {
    return manifest && semester && manifest[semester]
      ? Object.keys(manifest[semester]).sort()
      : [];
  };

  const getMaterialTypes = (semester: string, subject: string) => {
    return manifest && semester && subject && manifest[semester][subject]
      ? Object.keys(manifest[semester][subject]).sort()
      : [];
  };

  const getFiles = (semester: string, subject: string, type: string) => {
    return manifest && semester && subject && type && manifest[semester][subject][type]
      ? manifest[semester][subject][type]
      : [];
  };

  const counts = useMemo(() => {
    if (!manifest) return { semesters: 0, subjects: 0, files: 0 };
    let subjects = 0;
    let files = 0;
    Object.values(manifest).forEach(sem => {
      subjects += Object.keys(sem).length;
      Object.values(sem).forEach(sub => {
        Object.values(sub).forEach(typeFiles => {
          files += typeFiles.length;
        });
      });
    });
    return {
      semesters: Object.keys(manifest).length,
      subjects,
      files
    };
  }, [manifest]);

  return {
    manifest,
    loading,
    error,
    semesters,
    getSubjects,
    getMaterialTypes,
    getFiles,
    counts
  };
}
