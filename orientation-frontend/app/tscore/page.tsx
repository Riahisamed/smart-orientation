import { Suspense } from 'react';
import TScoreContent from './components/TScoreContent';

export default function TScorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Loading calculator...</div>}>
      <TScoreContent />
    </Suspense>
  );
}
