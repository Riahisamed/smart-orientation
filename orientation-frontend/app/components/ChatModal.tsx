'use client';

import ChatWidget from './ChatWidget';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatModal({ open, onClose }: ChatModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 h-[90vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 sm:h-[500px]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <span>🤖</span>
            <span>AI Assistant</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            ×
          </button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-hidden">
          <ChatWidget hideHeader onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
