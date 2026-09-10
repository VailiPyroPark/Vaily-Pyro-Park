'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthService } from '@/lib/services/auth.service';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await AuthService.loginAdmin(cleanEmail, password);
      setSuccessMsg('Welcome back! Opening dashboard...');
      setTimeout(() => {
        router.push('/admin');
      }, 800);
    } catch (err: any) {
      console.error('Login error:', err);
      const rawMsg = err?.message || '';
      if (rawMsg.includes('Invalid login credentials') || rawMsg.includes('User not found')) {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else {
        setErrorMsg('Unable to sign in. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          
          {/* Brand & Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center mx-auto shadow-md">
              <Image
                src="/logo.png"
                alt="Vaili Pyro Park Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 tracking-wider uppercase block">
                Vaili Pyro Park
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Admin Sign In
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enter your account details to access the management panel
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200/80 text-red-700 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Footer Note */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600/70" />
              <span>Protected Admin Area</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
