import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // API routes: autenticação gerenciada pelo próprio endpoint
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Páginas públicas da landing/billing não bloqueiam trial expirado
    const paginasLivres = ["/billing", "/cadastro", "/convite"];
    if (paginasLivres.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Trial expirado: redireciona para página de billing (exceto a própria)
    if (
      token?.plano === "TRIAL" &&
      token?.trialFim &&
      new Date(token.trialFim as string) < new Date()
    ) {
      return NextResponse.redirect(new URL("/billing?trial=expirado", req.url));
    }

    // PRODUCAO: só acessa /dashboard, /tarefas, /busca, /configuracoes, /documentacao
    if (token?.perfil === "PRODUCAO") {
      const permitido =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/tarefas") ||
        pathname.startsWith("/busca") ||
        pathname.startsWith("/configuracoes") ||
        pathname.startsWith("/documentacao");
      if (!permitido) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // GESTAO: não acessa /admin (gestão de usuários)
    if (token?.perfil === "GESTAO" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/obras", req.url));
    }

    // SUPER_ADMIN: sem restrições de navegação
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|cadastro|convite|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
