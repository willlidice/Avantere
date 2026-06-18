"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    setCarregando(false);

    if (resultado?.error) {
      setErro("Email ou senha inválidos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — identidade da marca */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between px-12 py-10 relative overflow-hidden"
        style={{
          backgroundColor: "#0D0D0D",
          backgroundImage: "url('/hero-login.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/40" />

        <div className="relative z-10">
          <div className="avantere-gradient rounded-md px-3 py-1.5 backdrop-blur-sm border border-white/15 inline-flex items-center gap-2.5 mb-16">
            <div className="w-7 h-7 bg-amber-500 dark:bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm leading-none">A</span>
            </div>
            <span className="font-display text-white tracking-[0.15em] uppercase text-sm">
              Avantere
            </span>
          </div>
          <div>
            <div className="w-8 h-[2px] bg-amber-500 dark:bg-blue-500 mb-6" />
            <h2 className="font-display font-normal text-[1.9rem] text-white leading-[1.4] tracking-tight">
              Gestão inteligente de obras.
            </h2>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">© 2025 Avantere</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(210,40%,96%)] px-6">
        <div className="w-full max-w-[340px]">
          {/* Logo mobile */}
          <div className="avantere-gradient rounded-md px-2.5 py-1.5 mb-10 lg:hidden inline-flex items-center gap-2 border border-white/15">
            <div className="w-6 h-6 bg-amber-500 dark:bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs leading-none">A</span>
            </div>
            <span className="text-white font-display tracking-[0.09em] uppercase text-xs">
              Avantere
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Acesso</h1>
            <p className="text-sm text-slate-500 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={carregando}
                className="w-full h-11 px-3.5 bg-white border border-slate-200 text-sm text-slate-900 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-blue-500/40 focus:border-amber-500 dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="senha"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={verSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  disabled={carregando}
                  className="w-full h-11 px-3.5 pr-11 bg-white border border-slate-200 text-sm text-slate-900 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-blue-500/40 focus:border-amber-500 dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-sm text-red-600">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-[3px] transition-colors tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
