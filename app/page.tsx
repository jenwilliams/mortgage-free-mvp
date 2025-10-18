import IntroGate from "@/components/IntroGate";

export default function Home() {
  return (
    <IntroGate>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold mb-4">Welcome back! 👋</h1>
          <p className="text-slate-600 mb-8">
            Ready to check your mortgage plan or make some adjustments?
          </p>
          
          <div className="space-y-4">
            <a href="/dashboard" className="block w-full btn-primary">
              View My Mortgage Plan
            </a>
            <a href="/setup" className="block w-full btn-ghost">
              Adjust My Details
            </a>
          </div>
          
          <p className="mt-6 text-xs text-slate-500">
            Your data is saved locally on your device.
          </p>
        </div>
      </main>
    </IntroGate>
  );
}