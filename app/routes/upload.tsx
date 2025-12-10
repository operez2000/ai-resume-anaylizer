import {type FormEvent, useState} from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";


const Upload = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {

  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Comentarios inteligentes para el trabajo de tus sueños</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            // ATS = Application Tracking System
            <h2>Envía tu CV para obtener una puntuación ATS y consejos de mejora</h2>
          )}
          {!isProcessing && (
            <form id="upload-=form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Empresa</label>
                <input type="text" name="company-name" placeholder="Nombre de la Empresa" id="company-name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Título</label>
                <input type="text" name="job-title" placeholder="Título profesional" id="job-title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Descripción</label>
                <textarea rows={5} name="job-description" placeholder="Descripción" id="job-description" />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Subir CV</label>
                <div className="form-div">
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>
              </div>

              <button className="primary-button" type="submit">
                Analizar CV
              </button>
            </form>
          )

          }
        </div>
      </section>
    </main>
  )
}

export default Upload;