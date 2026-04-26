export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        <div className="absolute inset-0 bg-cyan-500/10 blur-xl animate-pulse rounded-full" />
      </div>
      <h2 className="text-xl font-black tracking-tighter uppercase italic text-cyan-400">
        NEXUS Protocol <span className="text-white">Loading...</span>
      </h2>
      <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-4">
        Establishing secure real-time link
      </p>
    </div>
  );
}
