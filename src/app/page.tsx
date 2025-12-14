import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold">Welcome to Digg</h1>
        <p className="text-xl text-gray-600">
          AI-powered survey and research platform
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/admin/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Admin Login
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
