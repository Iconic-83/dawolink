export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dawo<span className="text-blue-300">Link</span>
          </h1>
          <p className="text-blue-300 text-sm mt-1">Pharmacy Management Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
