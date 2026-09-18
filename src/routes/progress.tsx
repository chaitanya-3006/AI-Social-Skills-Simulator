import { createFileRoute } from '@tanstack/react-router';
import { Clock } from 'lucide-react';

export const Route = createFileRoute('/progress')({
  component: PlaceholderComponent,
});

function PlaceholderComponent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[calc(100vh-80px)] p-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-secondary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Coming Soon</h1>
      <p className="text-secondary max-w-md">
        This feature is currently under development. Check back soon for updates to the platform.
      </p>
    </div>
  );
}
