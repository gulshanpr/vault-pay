"use client";

import React from 'react';

export function LavaLamp() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 animate-pulse" />

      {/* Animated blobs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/30 rounded-full blur-xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-purple-500/30 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-pink-500/30 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />

      {/* Additional animated elements */}
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-cyan-500/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-indigo-500/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}
