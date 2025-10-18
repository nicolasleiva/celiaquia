import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { analyzeProductImage } from './services/groqService';
import type { AnalysisResult } from './types';
import Spinner from './components/Spinner';
import ResultDisplay from './components/ResultDisplay';

// Helper to convert file to data URL
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// Camera icon component
const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-12 w-12 text-gray-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setError(null);
      setAnalysisResult(null);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) {
      setError('Por favor, suba una imagen del producto.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const imageDataUrl = await fileToDataUrl(imageFile);
      const result = await analyzeProductImage(imageDataUrl);
      setAnalysisResult(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-2xl flex flex-col items-center">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500">
            Apto Celiaco
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Verifica si un producto es apto con una foto
          </p>
        </header>

        <div className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="space-y-6">
            
            {!imagePreview ? (
              <div>
                <label htmlFor="product-image" className="block text-sm font-medium text-gray-300 mb-2">
                  1. Sube o toma una foto del producto
                </label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <CameraIcon />
                    <div className="flex text-sm text-gray-400 justify-center">
                      <p className="pl-1">Haz click para subir o tomar una foto</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                  </div>
                </div>
                <input
                  id="product-image"
                  name="product-image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </div>
            ) : (
                <div className="relative">
                    <img src={imagePreview} alt="Vista previa del producto" className="w-full rounded-lg shadow-md max-h-80 object-contain"/>
                    <button onClick={removeImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !imageFile}
              className="w-full h-14 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? <Spinner /> : 'Analizar Foto'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 w-full max-w-2xl bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center">
            <p>{error}</p>
          </div>
        )}

        {analysisResult && <ResultDisplay result={analysisResult} />}
        
      </main>
      <footer className="text-center mt-auto pt-8 text-gray-500 text-sm">
        <p>Potenciado por la API de Groq. Los resultados son generados por IA y deben ser verificados.</p>
      </footer>
    </div>
  );
};

export default App;