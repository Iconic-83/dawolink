export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #180D62 0%, #2D1B8E 45%, #1A3A6E 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#00C897" }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "#4A8FE5" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #00C897, #4A8FE5)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L12 22M6 8h12M6 16h12" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dawo<span style={{ color: "#00C897" }}>Link</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#00C89799" }}>
            Connecting Somalia&apos;s Medicine Ecosystem
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
