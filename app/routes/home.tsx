import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import { useEffect, useState } from "react";
import * as fs from "node:fs";
import resume from "~/routes/resume";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Smart CV" },
    { name: "description", content: "¡Comentarios inteligentes para el trabajo de tus sueños!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/')
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
        JSON.parse(resume.value) as Resume
      ))

      console.log('parsedResumes', parsedResumes)
      setResumes(parsedResumes || []);
      setLoadingResumes(false);

      // const blob = await fs.read(resume.imagePath);
      // if (!blob) return;
      // let url = URL.createObjectURL(blob);
      // setResumeUrl(url);
    }

    loadResumes();
  }, []);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    {/*{window.puter.ai.chat()}*/}
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Da seguimiento a tus Solicitudes y Calificaciones</h1>
        {!loadingResumes && resumes?.length === 0 ? (
          <h2>No se encontraron CV. Carga tu primer CV para recibir retroalimentación.</h2>
        ): (
          <h2>Revisa tus envíos y checa comentarios impulsados por IA</h2>
        )}
      </div>
      {loadingResumes && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200]" />
        </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume}/>
          ))}
        </div>
      )}

      {!loadingResumes || resumes?.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
            Subir CV
          </Link>
        </div>
      )}
    </section>
  </main>;
}
