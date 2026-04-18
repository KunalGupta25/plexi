// React hooks for Plexi API
"use client"

import useSWR from 'swr'
import { getManifest } from './client'
import type { Manifest } from './types'

export function useManifest() {
  return useSWR<Manifest>('manifest', getManifest, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  });
}

export function useSemesters(manifest: Manifest | undefined) {
  if (!manifest) return [];
  return Object.keys(manifest).sort();
}

export function useSubjects(manifest: Manifest | undefined, semester: string | null) {
  if (!manifest || !semester || !manifest[semester]) return [];
  return Object.keys(manifest[semester]).sort();
}

export function useFileTypes(manifest: Manifest | undefined, semester: string | null, subject: string | null) {
  if (!manifest || !semester || !subject) return [];
  const subjectData = manifest[semester]?.[subject];
  if (!subjectData) return [];
  // File types are direct keys on the subject object
  return Object.keys(subjectData).sort();
}

export function useFiles(
  manifest: Manifest | undefined, 
  semester: string | null, 
  subject: string | null, 
  fileType: string | null
) {
  if (!manifest || !semester || !subject || !fileType) return [];
  const files = manifest[semester]?.[subject]?.[fileType];
  // Map to consistent format with url property
  return (files || []).map(f => ({ name: f.name, url: f.download_url }));
}
