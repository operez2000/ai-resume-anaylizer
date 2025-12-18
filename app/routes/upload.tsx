import {type FormEvent, useState} from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();  // React Router
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file } : {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
    setIsProcessing(true)

    setStatusText('Subiendo el CV...')
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText('Error al subir el CV');

    setStatusText('Convirtiendo a Imagen...');
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file) return setStatusText('Error al convertir el PDF a imagen');

    setStatusText('Subiendo el CV...');
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText('Error al subir la imagen');

    setStatusText('Preparando la información...');
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName, jobTitle, jobDescription,
      feedback: '',
    }
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText('Analizando...');

    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription })
    )
    if (!feedback) return setStatusText('Error al analizar el CV');

    const feedbackText = typeof feedback.message.content === 'string'
      ? feedback.message.content
      : feedback.message.content[0].text;
    // console.log('feedbackText', feedbackText, 'typeof', typeof feedbackText)

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data))
    setStatusText('Análisis finalizado, redireccionando...');
    // console.log(data)
    // navigate(`/resume/${uuid}`);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form')
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
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
            <h2>Envía tu CV para obtener una puntuación ATS y consejos de mejora</h2>   // ATS = Application Tracking System
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
                  <FileUploader onFileSelect={handleFileSelect} />
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