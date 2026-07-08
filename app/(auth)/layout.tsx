import GradientBackground from "@/components/auth/GradientBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GradientBackground>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Personal Analytics
            </h1>
            <p className="text-white/60">Your personal analytics hub</p>
          </div>
          {children}
        </div>
      </div>
    </GradientBackground>
  );
}
