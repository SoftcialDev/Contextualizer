import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';

const PBIXVisualizer = () => {
    const [pbixData, setPbixData] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedVisual, setSelectedVisual] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [visualContexts, setVisualContexts] = useState({});
    const [contextText, setContextText] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (file) => {
        if (!file || !file.name.endsWith('.pbix')) {
            alert('Por favor, selecciona un archivo PBIX válido');
            return;
        }

        try {
            const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // Buscar el archivo Layout
            const layoutFile = contents.file('Report/Layout');
            if (!layoutFile) {
                alert('No se encontró el archivo Layout en el PBIX');
                return;
            }

            const layoutContent = await layoutFile.async('string');
            const layoutData = JSON.parse(layoutContent);

            // Extraer páginas y visuals
            const pages = [];
            if (layoutData.sections) {
                layoutData.sections.forEach((section, idx) => {
                    const visualContainers = section.visualContainers || [];
                    const pageVisuals = visualContainers.map((vc, vIdx) => {
                        const config = vc.config ? JSON.parse(vc.config) : {};
                        const layout = config.layouts?.[0] || {};
                        const position = layout.position || {};

                        return {
                            id: `page${idx}_visual${vIdx}`,
                            name: config.name || `Visual ${vIdx + 1}`,
                            type: config.singleVisual?.visualType || 'unknown',
                            x: position.x || 0,
                            y: position.y || 0,
                            width: position.width || 100,
                            height: position.height || 100,
                            z: position.z || 0
                        };
                    });

                    pages.push({
                        id: `page_${idx}`,
                        name: section.displayName || `Página ${idx + 1}`,
                        width: section.width || 1280,
                        height: section.height || 720,
                        visuals: pageVisuals
                    });
                });
            }

            setPbixData({ pages, fileName: file.name });
            setCurrentPage(0);
            setVisualContexts({});
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            alert('Error al procesar el archivo PBIX. Asegúrate de que sea un archivo válido.');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        handleFileUpload(file);
    };

    const openModal = (visual) => {
        setSelectedVisual(visual);
        setContextText(visualContexts[visual.id] || '');
        setShowModal(true);
    };

    const saveContext = () => {
        if (selectedVisual) {
            setVisualContexts(prev => ({
                ...prev,
                [selectedVisual.id]: contextText
            }));
        }
        setShowModal(false);
        setContextText('');
        setSelectedVisual(null);
    };

    const getVisualColor = (type) => {
        const colors = {
            'clusteredColumnChart': '#0078D4',
            'lineChart': '#00B294',
            'pieChart': '#8764B8',
            'table': '#E81123',
            'card': '#00CC6A',
            'slicer': '#FFB900',
            'map': '#00BCF2',
            'unknown': '#6B6B6B'
        };
        return colors[type] || colors.unknown;
    };

    const getVisualLabel = (type) => {
        const labels = {
            'clusteredColumnChart': 'Columnas',
            'lineChart': 'Líneas',
            'pieChart': 'Circular',
            'table': 'Tabla',
            'card': 'Tarjeta',
            'slicer': 'Segmentación',
            'map': 'Mapa',
            'unknown': 'Visual'
        };
        return labels[type] || 'Visual';
    };

    if (!pbixData) {
        return (
            <div className="preconfig-container">
                <div className="width-60">
                    <div className="text-center mb-8">
                        <h1 className="title">
                            CONTEXTUALIZER
                        </h1>
                        <p className="subtitle">
                            Upload a PBIX file to analyze and contextualize its visualizations
                        </p>
                    </div>

                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="drag-and-drop"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="text-center">
                            <Upload className="mx-auto text-indigo-500 mb-4" style={{ width: '70px', height: '70px' }} />
                            <h3 className="text-2xl font-semibold text-gray-800">
                                Drag your PBIX file here
                            </h3>
                            <p className="text-gray-600 mb-0" style={{ fontWeight: '200' }}>
                                or click to select a file
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pbix"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="primary-button">
                                Select file
                            </div>
                        </div>
                    </div>


                    <div className="bottom-section">
                        <div className="info-section">
                            <h3 className="info-title">
                                Information
                            </h3>
                            <ul className="info-bullets">
                                <li>Los archivos PBIX contienen la estructura completa de tus reportes</li>
                                <li>Se extraerán todas las páginas y visualizaciones</li>
                                <li>Podrás agregar contexto a cada visual para documentar tu reporte</li>
                                <li>Los tamaños y posiciones se muestran con precisión</li>
                            </ul>
                        </div>
                        <div className='button-section'>
                            <button className='primary-button'>
                                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M45.2083 40.8333H42.9041L42.0875 40.0458C45.0448 36.616 46.6701 32.2371 46.6666 27.7083C46.6666 23.9587 45.5548 20.2933 43.4716 17.1756C41.3884 14.058 38.4275 11.628 34.9634 10.1931C31.4992 8.75821 27.6873 8.38278 24.0097 9.11429C20.3322 9.8458 16.9541 11.6514 14.3028 14.3028C11.6514 16.9541 9.8458 20.3322 9.11429 24.0097C8.38278 27.6873 8.75821 31.4992 10.1931 34.9634C11.628 38.4275 14.058 41.3884 17.1756 43.4716C20.2933 45.5548 23.9587 46.6666 27.7083 46.6666C32.4042 46.6666 36.7208 44.9458 40.0458 42.0875L40.8333 42.9041V45.2083L55.4166 59.7625L59.7625 55.4166L45.2083 40.8333ZM27.7083 40.8333C20.4458 40.8333 14.5833 34.9708 14.5833 27.7083C14.5833 20.4458 20.4458 14.5833 27.7083 14.5833C34.9708 14.5833 40.8333 20.4458 40.8333 27.7083C40.8333 34.9708 34.9708 40.8333 27.7083 40.8333Z" fill="#012333" />
                                </svg>
                                <span>Analize file</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const page = pbixData.pages[currentPage];
    const scale = 0.8;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {pbixData.fileName}
                                </h1>
                                <p className="text-gray-600">
                                    {pbixData.pages.length} página{pbixData.pages.length !== 1 ? 's' : ''} encontrada{pbixData.pages.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setPbixData(null);
                                setCurrentPage(0);
                                setVisualContexts({});
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
                        >
                            Cargar otro archivo
                        </button>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                        <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Página {currentPage + 1} de {pbixData.pages.length}</div>
                            <div className="text-lg font-semibold text-gray-800">{page.name}</div>
                            <div className="text-sm text-gray-500">{page.visuals.length} visualización{page.visuals.length !== 1 ? 'es' : ''}</div>
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(pbixData.pages.length - 1, currentPage + 1))}
                            disabled={currentPage === pbixData.pages.length - 1}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                        >
                            Siguiente
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <div className="flex justify-center">
                        <div
                            style={{
                                width: page.width * scale,
                                height: page.height * scale,
                                position: 'relative',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                backgroundColor: '#f9fafb'
                            }}
                        >
                            {page.visuals.map((visual) => (
                                <div
                                    key={visual.id}
                                    onClick={() => openModal(visual)}
                                    style={{
                                        position: 'absolute',
                                        left: visual.x * scale,
                                        top: visual.y * scale,
                                        width: visual.width * scale,
                                        height: visual.height * scale,
                                        backgroundColor: getVisualColor(visual.type),
                                        border: visualContexts[visual.id] ? '3px solid #10b981' : '2px solid #fff',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s',
                                        zIndex: visual.z
                                    }}
                                    className="hover:shadow-xl hover:scale-105"
                                >
                                    <div className="p-2 h-full flex flex-col justify-between">
                                        <div className="text-white text-xs font-semibold break-words">
                                            {visual.name}
                                        </div>
                                        <div className="text-white text-xs opacity-75">
                                            {getVisualLabel(visual.type)}
                                        </div>
                                        {visualContexts[visual.id] && (
                                            <div className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-600">Con contexto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                            <span className="text-sm text-gray-600">Sin contexto</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedVisual && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {selectedVisual.name}
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        Tipo: {getVisualLabel(selectedVisual.type)} | Tamaño: {Math.round(selectedVisual.width)} x {Math.round(selectedVisual.height)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedVisual(null);
                                        setContextText('');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Contexto e Información
                            </label>
                            <textarea
                                value={contextText}
                                onChange={(e) => setContextText(e.target.value)}
                                placeholder="Agrega información relevante sobre esta visualización: objetivo, fuentes de datos, insights clave, notas para el equipo..."
                                className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                            />

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={saveContext}
                                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    Guardar Contexto
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedVisual(null);
                                        setContextText('');
                                    }}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PBIXVisualizer;