"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import AuthLayout from "@/components/authLayout/AuthLayout";
import LoginComponent from "@/components/login/LoginComponent";
import "./css/loginPage.css";


export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  return (
    <div className="login-page-wrapper">
      <AuthLayout title="Acesse sua Conta">
        <p className="login-subtitle">
          Use sua conta do Google para continuar e gerenciar seus pets.
        </p>
        <LoginComponent />
      </AuthLayout>
    </div>
  );
}
