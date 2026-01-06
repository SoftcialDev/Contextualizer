import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Save, ChevronLeft, ChevronRight, Copy, Pencil, LogOut, Cpu, AlertTriangle, CircleCheck, CircleX } from 'lucide-react';
import JSZip from "jszip";
import { useNavigate } from 'react-router';


type Visual = {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    z: number;
};

type Page = {
    id: string;
    name: string;
    width: number;
    height: number;
    visuals: Visual[];
};

type PBIXData = {
    pages: Page[];
    fileName: string;
};

type VisualContexts = Record<string, string>;

let zipContent: JSZip;

const Preconfig: React.FC = () => {
    const [pbixData, setPbixData] = useState<PBIXData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);

    const [selectedVisual, setSelectedVisual] = useState<Visual | null>(null);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [visualContexts, setVisualContexts] = useState<VisualContexts>({});
    const [contextText, setContextText] = useState<string>('');

    const [guid] = useState(crypto.randomUUID());
    const [name, setName] = useState("Sample Chart");
    const [user, setUser] = useState("John Doe");
    const [editingField, setEditingField] = useState("");

    const navigate = useNavigate();

    const today = new Date().toLocaleDateString();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const EditableField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
        <div className="justify-between py-2 mb-6">
            <span className="font-semibold capitalize">{label}:</span>
            {editingField === label ? (
                <input
                    className="border rounded px-2 py-1 w-full my-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setEditingField("")}
                />
            ) : (
                <div className="w-full flex items-center gap-2 justify-between">
                    <span className="font-thin">{value}</span>
                    <Pencil
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => setEditingField(label)}
                    />
                </div>
            )}
        </div>
    );

    const generateContextJSON = async () => {

        console.log("ZIP CONTENT EN GENERATE:", zipContent);

        if (visualContexts == null) return;

        const contextJSON = {
            guid: guid,
            created_date: today,
            name: name,
            user: user,
            contexts: visualContexts
        }

        zipContent.folder("contextualizer")?.file(
            "contexts.json",
            JSON.stringify(contextJSON, null, 2)
        );

        console.log({ contextJSON });

        const newPbixBlob = await zipContent.generateAsync({
            type: "blob",
            mimeType: "application/octet-stream"
        });

        downloadPbix(newPbixBlob, "updated-file.pbix");
    }

    const downloadPbix = (blob: Blob, filename:string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };


    // -------------------------
    // Upload PBIX
    // -------------------------
    const handleFileUpload = async (file: File | undefined) => {
        if (!file || !file.name.endsWith('.pbix')) {
            alert('Por favor, selecciona un archivo PBIX válido');
            return;
        }

        try {
            //const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
            const contents = await JSZip.loadAsync(file);
            zipContent = contents;

            console.log({ contents });

            // Layout
            const layoutFile = contents.file('Report/Layout');
            if (!layoutFile) {
                alert('No se encontró el archivo Layout en el PBIX');
                return;
            }

            const uint8 = await layoutFile.async("uint8array");
            const layoutContent = new TextDecoder("utf-16le").decode(uint8);
            console.log({ layoutContent });

            const layoutData = JSON.parse(layoutContent);

            const pages: Page[] = [];

            if (layoutData.sections) {
                layoutData.sections.forEach((section: any, idx: number) => {
                    const visualContainers = section.visualContainers || [];

                    const pageVisuals: Visual[] = visualContainers.map((vc: any, vIdx: number) => {
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

            setName(file.name.replace(".pbix", ""));
            setPbixData({ pages, fileName: file.name });
            setCurrentPage(0);
            setVisualContexts({});
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            alert('Error al procesar el archivo PBIX. Asegúrate de que sea un archivo válido.');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        handleFileUpload(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        handleFileUpload(file);
    };

    const openModal = (visual: Visual) => {
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

    const getVisualColor = (type: string): string => {
        const colors: Record<string, string> = {
            clusteredColumnChart: '#0078D4',
            lineChart: '#00B294',
            pieChart: '#8764B8',
            table: '#E81123',
            card: '#00CC6A',
            slicer: '#FFB900',
            map: '#00BCF2',
            unknown: '#6B6B6B'
        };
        return colors[type] || colors.unknown;
    };

    const getVisualLabel = (type: string): string => {
        const labels: Record<string, string> = {
            clusteredColumnChart: 'Columns',
            lineChart: 'Lines',
            pieChart: 'Circular',
            table: 'Table',
            card: 'Card',
            slicer: 'Segmentation',
            map: 'Map',
            unknown: 'Visual'
        };
        return labels[type] || 'Visual';
    };

    // -------------------------
    // Render inicial (upload)
    // -------------------------
    if (!pbixData) {
        return (
            <div className="preconfig-container">
                <div className="width-60">
                    <div className="text-center mb-8">
                        <h1 className="title">CONTEXTUALIZER</h1>
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
                        <div className="text-center flex items-center flex-col">
                            <Upload className="mx-auto text-white mb-4 w-[70px] h-[70px]" />
                            <h3 className="text-2xl font-semibold text-white">Drag your PBIX file here</h3>
                            <p className="text-white mb-4 font-thin">
                                or click to select a file
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pbix"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="primary-button">Select file</div>
                        </div>
                    </div>

                    <div className="bottom-section">
                        <div className="info-section">
                            <h3 className="info-title">Information</h3>
                            <ul className="info-bullets">
                                <li>Los archivos PBIX contienen la estructura completa de tus reportes</li>
                                <li>Se extraerán todas las páginas y visualizaciones</li>
                                <li>Podrás agregar contexto a cada visual</li>
                                <li>Los tamaños y posiciones se muestran con precisión</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------
    // Render principal (canvas)
    // -------------------------
    const page = pbixData.pages[currentPage];
    const scale = 0.8;

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-80 bg-[var(--blue)] max-sm:w-full max-sm:border-b p-6 flex flex-col justify-between text-white">
                <div>
                    <h2 className="text-2xl font-bold mt-4 mb-10 text-center text-[var(--light-blue)]">CONTEXTUALIZER</h2>

                    <div className="mb-6">
                        <span className="font-semibold">Created Date:</span>
                        <div className="font-thin">{today}</div>
                    </div>

                    <div className="mb-6">
                        <span className="font-semibold">GUID:</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="truncate w-full font-thin">{guid}</span>
                            <Copy
                                className="w-4 h-4 cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(guid)}
                            />
                        </div>
                    </div>

                    <EditableField label="name" value={name} onChange={setName} />
                    <EditableField label="user" value={user} onChange={setUser} />
                </div>

                {/* Buttons */}
                <div className="mt-6">
                    <div className="flex gap-2 mb-3">
                        <button className="w-1/2 bg-[var(--green-blue)] text-white py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 font-semibold">
                            <Save size={24} strokeWidth={1.5} />
                            Save
                        </button>
                        <button
                            className="w-1/2 bg-[var(--blue)] py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-[var(--magent)] border font-semibold"
                            onClick={() => {
                                setPbixData(null);
                                setCurrentPage(0);
                                setVisualContexts({});
                            }}
                        >
                            <LogOut size={24} strokeWidth={1.5} />
                            Cancel
                        </button>
                    </div>
                    <button className="w-full bg-[var(--magent)] py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-[var(--darkest-blue)] font-semibold" onClick={generateContextJSON}>
                        <Cpu size={24} strokeWidth={1.5} />
                        Generate
                    </button>
                </div>
            </aside>

            {/* CONTENT */}
            <div className="h-screen bg-[var(--darkest-blue)] p-6 w-full">
                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="rounded-xl p-6 mb-6">

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[var(--magent)]" />

                                <div>
                                    <h1 className="text-2xl font-bold text-white">{pbixData.fileName}</h1>
                                    <p className="text-white">
                                        {pbixData.pages.length} page{pbixData.pages.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setPbixData(null);
                                    setCurrentPage(0);
                                    setVisualContexts({});
                                }}
                                className="px-4 py-2 bg-[var(--green-blue)] rounded-lg text-white font-medium cursor-pointer"
                            >
                                Upload another file
                            </button>
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex items-center justify-between bg-[var(--dark-blue)] rounded-lg p-4">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--magent)] rounded-lg disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            <div className="text-center">
                                <div className="text-sm text-white mb-1">Page {currentPage + 1} of {pbixData.pages.length}</div>
                                <div className="text-lg font-semibold text-white">{page.name}</div>
                                <div className="text-sm text-white">
                                    {page.visuals.length} visual{page.visuals.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentPage(Math.min(pbixData.pages.length - 1, currentPage + 1))}
                                disabled={currentPage === pbixData.pages.length - 1}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--magent)] rounded-lg disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* CANVAS */}
                    <div>
                        <div className="flex justify-center z-10">
                            <div
                                style={{
                                    width: page.width * scale,
                                    height: page.height * scale,
                                    position: 'relative',
                                    border: '2px solid var(--magent)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--blue)'
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
                                            backgroundColor: 'var(--green-blue)',
                                            border: visualContexts[visual.id] ? '3px solid var(--magent)' : '2px solid var(--yellow)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s',
                                            zIndex: visual.z
                                        }}
                                        className="hover:shadow-xl hover:scale-105"
                                    >
                                        <div>

                                        </div>
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

                        {/* Leyenda */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={24} color='var(--yellow)' />
                                <span className="text-sm text-white">Context not set</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleCheck size={24} color='var(--magent)' />
                                <span className="text-sm text-white">Context configured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* MODAL */}
            {showModal && selectedVisual && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-10000 p-4">
                    <div className="bg-[var(--dark-blue)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedVisual.name}</h2>
                                    <p className=" text-white mt-1">
                                        Type: {getVisualLabel(selectedVisual.type)} | Resolution: {Math.round(selectedVisual.width)} x {Math.round(selectedVisual.height)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedVisual(null);
                                        setContextText('');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                                >
                                    <X className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-white mb-2">
                                Information and context
                            </label>

                            <textarea
                                value={contextText}
                                onChange={(e) => setContextText(e.target.value)}
                                placeholder="Add the context..."
                                className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg resize-none focus:border-indigo-500 text-white placeholder:text-white"
                            />

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={saveContext}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[var(--magent)] cursor-pointer text-[var(--darkest-blue)] py-3 px-6 rounded-lg font-bold"
                                >
                                    <Save className="w-5 h-5" />
                                    Save context
                                </button>

                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedVisual(null);
                                        setContextText('');
                                    }}
                                    className="px-6 py-3 hover:bg-[var(--darkest-blue)] bg-[var(--dark-blue)] cursor-pointer text-[var(--magent)] border rounded-lg font-bold flex items-center gap-2"
                                >
                                    <CircleX className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Preconfig;
