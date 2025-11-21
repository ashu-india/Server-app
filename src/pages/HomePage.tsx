import { useState, useEffect } from 'react';
import { Shield, Zap, Eye, Lock, TrendingUp, Activity, AlertTriangle, Server } from 'lucide-react';

export default function HomePage({ onEnter }: { onEnter: () => void }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: Activity, title: "Real-Time Monitoring", desc: "Live threat detection across all endpoints", color: "from-blue-400 to-cyan-400" },
    { icon: AlertTriangle, title: "Instant Alerts", desc: "Immediate notifications for suspicious activity", color: "from-orange-400 to-red-400" },
    { icon: Eye, title: "IOC Intelligence", desc: "Advanced indicator of compromise tracking", color: "from-purple-400 to-pink-400" },
    { icon: Server, title: "Client Inventory", desc: "Complete visibility of your device fleet", color: "from-green-400 to-emerald-400" },
    { icon: TrendingUp, title: "Search / Threat Hunting", desc: "Allows analysts to search through events using keywords, IOCs, or simple filters.", color: "from-indigo-400 to-blue-400" },
    { icon: Lock, title: "Basic Persistence", desc: "Stores events, alerts, IOCs, and clients so analysts can review them later.", color: "from-violet-400 to-purple-400" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
          style={{
            left: `${mousePosition.x / 20}px`,
            top: `${mousePosition.y / 20}px`,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-blue-100">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Next-Gen Threat Intelligence
            </span>
          </div>
          
          <h1 className="text-7xl font-black mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent leading-tight">
            ThreatHunt
          </h1>
          
          <p className="text-3xl font-bold text-gray-700 mb-4">
            Endpoint Threat Hunting Server
          </p>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Unified telemetry and  fast response. 
            Protect every endpoint.
          </p>

          <div className="flex gap-4 justify-center items-center">
            <button 
              onClick={onEnter}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Launch Dashboard
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
           
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative p-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer overflow-hidden"
                style={{
                  transform: hoveredCard === index ? 'translateY(-8px)' : 'translateY(0)',
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl w-full grid grid-cols-3 gap-8 mt-8">
          {[
            { value: "99.9%", label: "Threat Detection Rate" },
            { value: "<100ms", label: "Alert Response Time" },
            { value: "24/7", label: "Continuous Monitoring" }
          ].map((stat, i) => (
            <div key={i} className="text-center p-6 bg-white/60 backdrop-blur-lg rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}