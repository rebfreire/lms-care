import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary text-on-primary font-headline font-bold flex items-center justify-center mx-auto mb-4">
            C
          </div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Care</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Entre com a conta criada pelo administrador.
          </p>
        </div>

        <div className="bg-surface rounded-card-lg p-8 shadow-soft">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
