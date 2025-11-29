import {usePuterStore} from "~/lib/puter";
import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router";

export const meta = () => ([
  { title: 'Smart CV | Auth'},
  { name: 'description', content: 'Acceder a tu cuenta' },
])

const Auth = () => {
  const { isLoading, auth } = usePuterStore()
  const location = useLocation()
  const next = location.search.split('next=')[1];
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next)
  }, [auth.isAuthenticated, next]);

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Bienvenid@</h1>
            <h2>Inicia sesión para continuar tu búsqueda de empleo</h2>
          </div>
          <div className="text-center">
            {isLoading ? (
              <button className="auth-button animate-pulse">
                <p>Iniciando...</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button className="auth-button" onClick={auth.signOut}>
                    <p>Cerrar sesión</p>
                  </button>
                ) : (
                  <button className="auth-button" onClick={auth.signIn}>
                    <p>Iniciar sesión</p>
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Auth;