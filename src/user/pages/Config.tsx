import { useState } from "react";
import { Copy, Pencil, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

export default function DashboardLayout() {
  const [guid] = useState(crypto.randomUUID());
  const [name, setName] = useState("Sample Chart");
  const [user, setUser] = useState("John Doe");
  const [editingField, setEditingField] = useState("");

  const navigate = useNavigate();

  const today = new Date().toLocaleDateString();

  const ChartBox = ({ status }: { status: "ok" | "warn" }) => (
    <div className="border rounded-xl p-4 flex flex-col justify-between items-center h-40 w-full relative">
      <div className="absolute top-2 right-2">
        {status === "ok" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
      </div>
      <span className="font-bold text-lg mt-6">CHART</span>
    </div>
  );

  const EditableField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="font-semibold capitalize">{label}:</span>
      {editingField === label ? (
        <input
          className="ml-2 border rounded px-2 py-1 w-40"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditingField("")}
        />
      ) : (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <Pencil
            className="w-4 h-4 cursor-pointer"
            onClick={() => setEditingField(label)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 max-sm:w-full max-sm:border-b p-6 flex flex-col justify-between border-r">
        <div>
          <h2 className="text-xl font-bold mb-6">Contextualizer</h2>

          <div className="mb-4">
            <span className="font-semibold">Created Date:</span>
            <div>{today}</div>
          </div>

          <div className="mb-4">
            <span className="font-semibold">GUID:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="truncate max-w-[120px]">{guid}</span>
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
            <button 
              className="w-1/2 bg-gray-300 py-2 rounded-lg cursor-pointer"
              onClick={()=>{
                navigate("/preconfig");
              }}
            >Cancel</button>
            <button className="w-1/2 bg-blue-600 text-white py-2 rounded-lg">Save</button>
          </div>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg">
            Generate
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartBox status="warn" />
        <ChartBox status="ok" />
        <ChartBox status="warn" />
        <ChartBox status="ok" />
        <ChartBox status="ok" />
        <ChartBox status="warn" />

        <div className="col-span-3 mt-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-5 h-5" />
              <span>Context not set</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-5 h-5" />
              <span>Context configured</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}