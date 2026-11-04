import { useState } from "react";
import { Search, UserPlus, Pencil, Trash2, X } from "lucide-react";
import { obtenerUsuariosDemo, guardarUsuarioDemo, eliminarUsuarioDemo } from "../../services/usuariosDemo";

const VACIO = { nombre: "", usuario: "", correo: "", rol: "cliente", estado: "Activo" };
export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState(obtenerUsuariosDemo);
  const [buscar, setBuscar] = useState("");
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");
  const filtrados = usuarios.filter(u => [u.nombre,u.usuario,u.correo,u.rol].join(" ").toLowerCase().includes(buscar.toLowerCase()));
  const guardar = (event) => {
    event.preventDefault();
    try {
      guardarUsuarioDemo(editando);
      setUsuarios(obtenerUsuariosDemo());
      setEditando(null);
      setError("");
    } catch(e) { setError(e.message); }
  };
  const eliminar = (u) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre} del directorio de demostración?`)) return;
    eliminarUsuarioDemo(u.id);
    setUsuarios(obtenerUsuariosDemo());
  };
  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-[#3D7669]">Administración</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Gestión de usuarios</h1><p className="mt-2 text-slate-500">Directorio local de demostración. No son cuentas reales.</p></div>
        <button onClick={() => {setEditando({...VACIO});setError("");}} className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white"><UserPlus size={18}/> Nuevo usuario</button>
      </div>
      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3"><Search size={18} className="text-slate-400"/><input aria-label="Buscar usuarios" value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Buscar por nombre, usuario, correo o rol" className="w-full outline-none"/></label>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">Nombre</th><th className="p-3">Usuario</th><th className="p-3">Correo</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead><tbody>{filtrados.map(u=><tr key={u.id} className="border-b border-stone-100"><td className="p-3 font-semibold">{u.nombre}</td><td className="p-3">{u.usuario}</td><td className="p-3">{u.correo}</td><td className="p-3 capitalize">{u.rol}</td><td className="p-3">{u.estado}</td><td className="p-3"><div className="flex gap-2"><button aria-label={`Editar ${u.nombre}`} onClick={()=>{setEditando({...u});setError("");}} className="rounded-lg p-2 text-[#3D7669] hover:bg-emerald-50"><Pencil size={18}/></button><button aria-label={`Eliminar ${u.nombre}`} onClick={()=>eliminar(u)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={18}/></button></div></td></tr>)}</tbody></table>{!filtrados.length&&<p className="p-8 text-center text-slate-500">No se encontraron usuarios.</p>}</div>
      </div>
      {editando&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"><form onSubmit={guardar} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editando.id?"Editar usuario":"Nuevo usuario"}</h2><button type="button" onClick={()=>setEditando(null)} aria-label="Cerrar"><X/></button></div>{[["nombre","Nombre completo"],["usuario","Usuario"],["correo","Correo electrónico"]].map(([key,label])=><label key={key} className="block text-sm font-medium">{label}<input required type={key==="correo"?"email":"text"} value={editando[key]} onChange={e=>setEditando({...editando,[key]:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>)}<label className="block text-sm font-medium">Rol<select value={editando.rol} onChange={e=>setEditando({...editando,rol:e.target.value})} className="mt-1 w-full rounded-xl border p-3"><option value="cliente">Cliente</option><option value="bibliotecario">Bibliotecario</option><option value="admin">Administrador</option></select></label><label className="block text-sm font-medium">Estado<select value={editando.estado} onChange={e=>setEditando({...editando,estado:e.target.value})} className="mt-1 w-full rounded-xl border p-3"><option>Activo</option><option>Inactivo</option></select></label>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<button className="w-full rounded-xl bg-[#3D7669] p-3 font-semibold text-white">Guardar usuario</button></form></div>}
    </main>
  );
}
