import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/feature/Navbar";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-6 overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-gradient-to-br from-blue-500/5 to-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-12">
            <i className="ri-error-warning-line text-rose-400"></i>
            Page Not Found
          </div>

          <h1 className="text-[8rem] md:text-[12rem] font-bold text-gray-900 leading-none tracking-tighter mb-8 drop-shadow-xl">
            404
          </h1>

          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Navigation <span className="text-blue-600">Error.</span>
          </h2>

          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-12 max-w-sm mx-auto leading-relaxed">
            The requested page <span className="text-blue-600 font-mono lowercase">{location.pathname}</span> could not be located on our servers.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/"
              className="px-10 py-5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <i className="ri-home-4-line text-lg"></i>
              Back to Home
            </Link>
            <Link
              to="/marketplace"
              className="px-10 py-5 bg-gray-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <i className="ri-shopping-bag-line text-lg"></i>
              Go to Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}