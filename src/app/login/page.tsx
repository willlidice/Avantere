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
      <div className="hidden lg:flex lg:w-[42%] bg-stone-900 flex-col justify-between px-12 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,1) 48px, rgba(255,255,255,1) 49px), repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,1) 48px, rgba(255,255,255,1) 49px)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-7 h-7 bg-amber-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm leading-none">A</span>
            </div>
            <span className="text-stone-100 font-semibold tracking-[0.1em] uppercase text-sm">
              Avantere
            </span>
          </div>
          <div>
            <div className="w-8 h-0.5 bg-amber-600 mb-6" />
            <h2 className="text-[2.1rem] font-light text-stone-100 leading-[1.35] tracking-tight">
              Gestão inteligente<br />
              de cronogramas<br />
              de obra.
            </h2>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-stone-700">© 2025 Avantere</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE3] px-6">
        <div className="w-full max-w-[340px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-6 h-6 bg-amber-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs leading-none">A</span>
            </div>
            <span className="text-stone-900 font-semibold tracking-[0.09em] uppercase text-xs">
              Avantere
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Acesso</h1>
            <p className="text-sm text-stone-500 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-2"
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
                className="w-full h-11 px-3.5 bg-white border border-stone-300 text-sm text-stone-900 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-stone-400 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="senha"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-2"
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
                  className="w-full h-11 px-3.5 pr-11 bg-white border border-stone-300 text-sm text-stone-900 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-stone-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
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
