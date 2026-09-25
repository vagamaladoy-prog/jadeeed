"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { loginAction } from "@/lib/admin/actions/auth";
import { loginSchema, type LoginValues } from "@/lib/admin/schemas";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { login: "", password: "" } });

  const submit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      try {
        // on success the action redirects to /admin/orders
        const res = await loginAction(values);
        if (res && !res.ok) setError(res.error);
      } catch (e) {
        // a redirect is delivered as navigation, not as an exception; anything else is a real failure
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError("Не удалось войти. Проверьте соединение");
      }
    });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <Label htmlFor="login">Логин</Label>
        <Input
          id="login"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!errors.login}
          {...register("login")}
        />
        <FieldError>{errors.login?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      {error && (
        <p role="alert" className="rounded border border-ink px-4 py-3 text-body-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Войти
      </Button>
    </form>
  );
}
