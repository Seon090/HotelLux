import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════
//   CLASES POO — Herencia, Composición, Asociación
// ════════════════════════════════════════════════

class Persona {
  constructor(nombre, email, password, id = null) {
    this.id       = id || (Date.now().toString() + Math.random().toString(36).slice(2));
    this.nombre   = nombre;
    this.email    = email;
    this.password = password;
  }
  toString() { return `${this.nombre} <${this.email}>`; }
}

class Usuario extends Persona {
  constructor(nombre, email, password, id = null, reservas = []) {
    super(nombre, email, password, id);
    this.rol      = 'usuario';
    this.reservas = reservas; // Asociación con Reserva
  }
  agregarReserva(r)        { this.reservas.push(r); }
  getReservasActivas()     { return this.reservas.filter(r => r.estado === 'activa'); }
  getHistorial()           { return this.reservas; }
}

class Administrador extends Persona {
  constructor(nombre, email, password, id = null) {
    super(nombre, email, password, id);
    this.rol      = 'admin';
    this.reservas = [];
  }
  agregarHabitacion(hotel, h) { hotel.agregarHabitacion(h); }
  eliminarHabitacion(hotel, id){ hotel.eliminarHabitacion(id); }
  agregarServicio(hotel, s)   { hotel.agregarServicio(s); }
}

class Servicio {
  constructor(nombre, precio, id = null) {
    this.id     = id || (Date.now().toString() + Math.random().toString(36).slice(2));
    this.nombre = nombre;
    this.precio = precio;
  }
}

// Composición: Habitacion contiene servicios propios
class Habitacion {
  constructor(numero, tipo, precio, capacidad, descripcion = '', id = null, disponible = true) {
    this.id          = id || (Date.now().toString() + Math.random().toString(36).slice(2));
    this.numero      = numero;
    this.tipo        = tipo;
    this.precio      = precio;
    this.capacidad   = capacidad;
    this.descripcion = descripcion;
    this.disponible  = disponible;
    this.servicios   = []; // Composición
  }
  reservar()  { this.disponible = false; }
  liberar()   { this.disponible = true; }
  getEstado() { return this.disponible ? 'disponible' : 'ocupada'; }
}

// Asociación: une Usuario ↔ Habitacion
class Reserva {
  constructor(usuario, habitacion, entrada, salida, serviciosExtra = [], id = null, estado = 'activa', fechaCreacion = null, total = null) {
    this.id             = id || ('RES-' + Math.floor(Math.random() * 90000 + 10000));
    this.usuario        = usuario;
    this.habitacion     = habitacion;
    this.entrada        = new Date(entrada);
    this.salida         = new Date(salida);
    this.serviciosExtra = serviciosExtra;
    this.estado         = estado;
    this.fechaCreacion  = fechaCreacion ? new Date(fechaCreacion) : new Date();
    this.total          = total ?? this._calcularTotal();
  }
  _calcularTotal() {
    const noches   = this.getNochesTotal();
    const costoHab = noches * this.habitacion.precio;
    const costoSrv = this.serviciosExtra.reduce((a, s) => a + s.precio, 0) * noches;
    return costoHab + costoSrv;
  }
  getNochesTotal() {
    return Math.max(1, Math.ceil((this.salida - this.entrada) / 86400000));
  }
  cancelar() { this.estado = 'cancelada'; this.habitacion.liberar(); }
}

// Composición: Hotel contiene habitaciones y servicios
class Hotel {
  constructor(nombre, direccion) {
    this.nombre       = nombre;
    this.direccion    = direccion;
    this.habitaciones = []; // Composición
    this.servicios    = []; // Composición
    this.reservas     = [];
    this.usuarios     = [];
  }
  agregarHabitacion(h)   { this.habitaciones.push(h); }
  eliminarHabitacion(id) { this.habitaciones = this.habitaciones.filter(h => h.id !== id); }
  agregarServicio(s)     { this.servicios.push(s); }
  eliminarServicio(id)   { this.servicios = this.servicios.filter(s => s.id !== id); }
  agregarUsuario(u)      { this.usuarios.push(u); }
  eliminarUsuario(id)    { this.usuarios = this.usuarios.filter(u => u.id !== id); }
  agregarReserva(r)      { this.reservas.push(r); }
  buscarUsuario(email)   { return this.usuarios.find(u => u.email === email); }
  getStats() {
    return {
      total:       this.habitaciones.length,
      disponibles: this.habitaciones.filter(h => h.disponible).length,
      ocupadas:    this.habitaciones.filter(h => !h.disponible).length,
      usuarios:    this.usuarios.filter(u => u.rol === 'usuario').length,
      reservas:    this.reservas.filter(r => r.estado === 'activa').length,
    };
  }
}

// ════════════════════════════════════════════════
//   HELPERS DE PERSISTENCIA (window.storage)
// ════════════════════════════════════════════════
const DB_KEY = 'hotel_db';

async function cargarDB() {
  try {
    const res = await window.storage.get(DB_KEY, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (_) {}
  return null;
}

async function guardarDB(hotel) {
  const data = {
    usuarios:     hotel.usuarios.map(u => ({
      id: u.id, nombre: u.nombre, email: u.email,
      password: u.password, rol: u.rol,
      reservas: (u.reservas || []).map(r => ({
        id: r.id, habitacionId: r.habitacion.id,
        entrada: r.entrada.toISOString(), salida: r.salida.toISOString(),
        serviciosIds: r.serviciosExtra.map(s => s.id),
        estado: r.estado, fechaCreacion: r.fechaCreacion.toISOString(),
        total: r.total,
      }))
    })),
    habitaciones: hotel.habitaciones.map(h => ({
      id: h.id, numero: h.numero, tipo: h.tipo,
      precio: h.precio, capacidad: h.capacidad,
      descripcion: h.descripcion, disponible: h.disponible,
    })),
    servicios:    hotel.servicios.map(s => ({ id: s.id, nombre: s.nombre, precio: s.precio })),
    reservas:     hotel.reservas.map(r => ({
      id: r.id, usuarioId: r.usuario.id, habitacionId: r.habitacion.id,
      entrada: r.entrada.toISOString(), salida: r.salida.toISOString(),
      serviciosIds: r.serviciosExtra.map(s => s.id),
      estado: r.estado, fechaCreacion: r.fechaCreacion.toISOString(), total: r.total,
    }))
  };
  try { await window.storage.set(DB_KEY, JSON.stringify(data), true); } catch (_) {}
}

function reconstruirHotel(data) {
  const h = new Hotel('HotelLux', 'Gran Vía 42, Madrid');

  // Servicios
  data.servicios.forEach(s => h.servicios.push(new Servicio(s.nombre, s.precio, s.id)));

  // Habitaciones
  data.habitaciones.forEach(hd => {
    h.habitaciones.push(new Habitacion(hd.numero, hd.tipo, hd.precio, hd.capacidad, hd.descripcion, hd.id, hd.disponible));
  });

  // Usuarios + reservas
  data.usuarios.forEach(ud => {
    let user;
    if (ud.rol === 'admin') user = new Administrador(ud.nombre, ud.email, ud.password, ud.id);
    else                    user = new Usuario(ud.nombre, ud.email, ud.password, ud.id);

    ud.reservas?.forEach(rd => {
      const hab  = h.habitaciones.find(x => x.id === rd.habitacionId);
      const servs = rd.serviciosIds.map(sid => h.servicios.find(s => s.id === sid)).filter(Boolean);
      if (hab) {
        const r = new Reserva(user, hab, rd.entrada, rd.salida, servs, rd.id, rd.estado, rd.fechaCreacion, rd.total);
        user.reservas.push(r);
        h.reservas.push(r);
      }
    });
    h.usuarios.push(user);
  });

  return h;
}

function inicializarHotelDefault() {
  const h = new Hotel('HotelLux', 'Gran Vía 42, Madrid');
  const admin = new Administrador('Admin Hotel', 'admin@hotel.com', 'admin123');
  const u1    = new Usuario('Ana García',   'user@hotel.com',    'user123');
  const u2    = new Usuario('Carlos López', 'carlos@hotel.com',  'carlos123');
  [admin, u1, u2].forEach(u => h.agregarUsuario(u));

  [['Desayuno buffet',18],['Parking',12],['Spa & Wellness',35],['Room Service',25],['Traslado aeropuerto',45]]
    .forEach(([n,p]) => h.agregarServicio(new Servicio(n,p)));

  [
    [101,'individual',75,1,'Acogedora habitación con vistas al patio interior'],
    [102,'individual',80,1,'Planta baja, acceso adaptado, baño completo'],
    [201,'doble',120,2,'Cama king-size, vistas a la Gran Vía'],
    [202,'doble',130,2,'Dos camas individuales, perfecta para amigos'],
    [203,'doble',125,2,'Balcón privado, baño con bañera hidromasaje'],
    [301,'suite',250,3,'Suite presidencial, jacuzzi y terraza panorámica'],
    [302,'suite',220,4,'Suite junior con vistas 360° a la ciudad'],
    [401,'individual',90,1,'Ático con techos abuhardillados y luz natural'],
  ].forEach(([n,t,p,c,d]) => h.agregarHabitacion(new Habitacion(n,t,p,c,d)));

  return h;
}

// ════════════════════════════════════════════════
//   ESTILOS
// ════════════════════════════════════════════════
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--gold:#c9a84c;--gold-l:#e8d08a;--dark:#0d0d0d;--d2:#1a1a1a;--d3:#262626;--d4:#333;--cream:#f5f0e8;--c2:#ede8dc;--red:#c0392b;--green:#27ae60;--muted:#888}
  body{background:var(--dark);color:var(--cream);font-family:'DM Sans',sans-serif;min-height:100vh}
  .playfair{font-family:'Playfair Display',serif}

  /* LOGIN */
  .login-wrap{position:fixed;inset:0;background:var(--dark);display:flex;align-items:center;justify-content:center;z-index:999}
  .login-box{background:var(--d2);border:1px solid #2a2a2a;border-radius:12px;padding:3rem 2.5rem;width:100%;max-width:400px;text-align:center}
  .login-logo{font-family:'Playfair Display',serif;font-size:2.2rem;color:var(--gold);margin-bottom:.3rem}
  .login-tagline{color:var(--muted);font-size:.85rem;margin-bottom:2rem}
  .tabs{display:flex;border:1px solid #333;border-radius:6px;overflow:hidden;margin-bottom:1.5rem}
  .tab{flex:1;padding:.6rem;background:transparent;border:none;color:#888;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;transition:all .2s}
  .tab.active{background:var(--d3);color:var(--gold)}
  .fg{margin-bottom:1rem;text-align:left}
  .fg label{display:block;font-size:.78rem;color:var(--muted);margin-bottom:.3rem}
  .fg input,.fg select,.fg textarea{width:100%;background:var(--d3);border:1px solid #333;border-radius:5px;color:var(--cream);padding:.65rem .9rem;font-family:'DM Sans',sans-serif;font-size:.9rem;transition:border-color .2s}
  .fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:var(--gold)}
  .fg select option{background:var(--d3)}
  .btn-login{width:100%;padding:.75rem;background:var(--gold);color:var(--dark);border:none;border-radius:6px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:.5rem;font-family:'DM Sans',sans-serif;transition:background .2s}
  .btn-login:hover{background:var(--gold-l)}
  .hint{font-size:.72rem;color:var(--muted);margin-top:1.2rem;line-height:1.8}
  .hint code{background:var(--d3);padding:.1rem .4rem;border-radius:3px;color:var(--gold)}

  /* LAYOUT */
  header{background:var(--d2);border-bottom:1px solid #222;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:70px;position:sticky;top:0;z-index:100}
  .logo{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;color:var(--gold);letter-spacing:2px}
  .logo span{color:var(--cream);font-weight:400}
  .user-info{display:flex;align-items:center;gap:1rem;font-size:.85rem;color:var(--muted)}
  .user-info strong{color:var(--gold)}
  .app{display:flex;min-height:calc(100vh - 70px)}
  nav{width:230px;background:var(--d2);border-right:1px solid #222;padding:2rem 0;flex-shrink:0}
  .nav-sec{font-size:.65rem;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:.5rem 1.5rem;margin-top:1rem}
  .nav-btn{display:flex;align-items:center;gap:.6rem;width:100%;background:transparent;border:none;color:#aaa;padding:.75rem 1.5rem;text-align:left;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.9rem;transition:all .2s}
  .nav-btn:hover{background:var(--d3);color:var(--cream)}
  .nav-btn.active{background:var(--d3);color:var(--gold);border-left:3px solid var(--gold)}
  main{flex:1;padding:2.5rem;overflow-y:auto}

  /* CARDS */
  h1{font-family:'Playfair Display',serif;font-size:2rem;color:var(--gold);margin-bottom:.3rem}
  .sub{color:var(--muted);font-size:.9rem;margin-bottom:2rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.2rem;margin-top:1.5rem}
  .card{background:var(--d2);border:1px solid #2a2a2a;border-radius:8px;padding:1.5rem;transition:border-color .2s,transform .2s}
  .card:hover{border-color:var(--gold);transform:translateY(-2px)}
  .card h3{font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--cream);margin-bottom:.4rem}
  .card p{font-size:.85rem;color:var(--muted);line-height:1.6}
  .price{font-size:1.3rem;color:var(--gold);font-weight:700;margin:.8rem 0}
  .price span{font-size:.75rem;color:var(--muted);font-weight:400}
  .badge{display:inline-block;font-size:.68rem;padding:.2rem .6rem;border-radius:20px;font-weight:500;margin-bottom:.8rem;letter-spacing:1px;text-transform:uppercase}
  .b-ok{background:rgba(39,174,96,.15);color:var(--green);border:1px solid rgba(39,174,96,.3)}
  .b-err{background:rgba(192,57,43,.15);color:var(--red);border:1px solid rgba(192,57,43,.3)}
  .b-gold{background:rgba(201,168,76,.15);color:var(--gold);border:1px solid rgba(201,168,76,.3)}
  .b-blue{background:rgba(100,149,237,.15);color:#6495ed;border:1px solid rgba(100,149,237,.3)}
  .b-gray{background:rgba(180,180,180,.1);color:#aaa;border:1px solid #333}
  .b-admin{background:rgba(201,168,76,.15);color:var(--gold);border:1px solid rgba(201,168,76,.3);font-size:.65rem;padding:.15rem .5rem;border-radius:20px;text-transform:uppercase;letter-spacing:1px}

  /* BUTTONS */
  .btn{display:inline-block;padding:.55rem 1.3rem;border-radius:5px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;transition:all .2s}
  .btn-gold{background:var(--gold);color:var(--dark)}
  .btn-gold:hover{background:var(--gold-l)}
  .btn-out{background:transparent;border:1px solid var(--d4);color:var(--cream)}
  .btn-out:hover{border-color:var(--gold);color:var(--gold)}
  .btn-red{background:transparent;border:1px solid rgba(192,57,43,.4);color:var(--red)}
  .btn-red:hover{background:rgba(192,57,43,.1)}
  .btn-sm{padding:.35rem .8rem;font-size:.78rem}
  .btn-group{display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap}
  .btn-logout{background:transparent;border:1px solid var(--d4);color:var(--muted);padding:.4rem 1rem;border-radius:4px;cursor:pointer;font-size:.8rem;transition:all .2s}
  .btn-logout:hover{border-color:var(--gold);color:var(--gold)}

  /* STATS */
  .stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:2rem}
  .stat{background:var(--d2);border:1px solid #2a2a2a;border-radius:8px;padding:1.2rem 1.5rem}
  .stat .lbl{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px}
  .stat .val{font-family:'Playfair Display',serif;font-size:2rem;color:var(--gold);margin-top:.2rem}

  /* TABLE */
  .tw{overflow-x:auto;margin-top:1.5rem}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  thead th{background:var(--d3);color:var(--muted);text-transform:uppercase;font-size:.7rem;letter-spacing:1.5px;padding:.8rem 1rem;text-align:left}
  tbody tr{border-bottom:1px solid #222;transition:background .15s}
  tbody tr:hover{background:var(--d3)}
  tbody td{padding:.8rem 1rem;color:var(--c2)}

  /* FORM */
  .form-box{background:var(--d2);border:1px solid #2a2a2a;border-radius:8px;padding:2rem;max-width:480px}
  .form-box h2{font-family:'Playfair Display',serif;color:var(--gold);margin-bottom:1.5rem}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}

  /* HISTORIAL */
  .hi{background:var(--d2);border:1px solid #2a2a2a;border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem}
  .hi .info h4{color:var(--cream);font-size:.95rem}
  .hi .info p{color:var(--muted);font-size:.8rem}
  .hi .prec{color:var(--gold);font-weight:700;font-size:1.1rem}

  /* MODAL */
  .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:500}
  .modal{background:var(--d2);border:1px solid #333;border-radius:10px;padding:2rem;width:90%;max-width:450px}
  .modal h3{font-family:'Playfair Display',serif;color:var(--gold);margin-bottom:1.2rem}
  .modal-foot{display:flex;justify-content:flex-end;gap:.7rem;margin-top:1.5rem}

  /* TOAST */
  .toast{position:fixed;bottom:2rem;right:2rem;background:var(--d3);border-left:3px solid var(--gold);color:var(--cream);padding:.9rem 1.5rem;border-radius:6px;font-size:.88rem;z-index:9999;max-width:300px;animation:slideIn .3s ease}
  .toast.err{border-color:var(--red)}
  @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

  /* FILTER ROW */
  .frow{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem}
  .fbtns{display:flex;gap:.5rem;flex-wrap:wrap}

  /* SERV CHECK */
  .serv-check{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.4rem}
  .serv-label{display:flex;align-items:center;gap:.4rem;background:var(--d3);padding:.4rem .7rem;border-radius:5px;cursor:pointer;font-size:.8rem}

  .empty{text-align:center;padding:3rem;color:var(--muted)}
  .green{color:var(--green)} .red-c{color:var(--red)}
  ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--dark)} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
  .db-badge{background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.25);color:var(--green);font-size:.7rem;padding:.2rem .6rem;border-radius:4px;display:flex;align-items:center;gap:.4rem}
`;

// ════════════════════════════════════════════════
//   UTILIDADES
// ════════════════════════════════════════════════
const fmtFecha = d => {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
};
const toInputDate = d => d.toISOString().split('T')[0];
const hoy = () => { const d = new Date(); return toInputDate(d); };
const manana = () => { const d = new Date(); d.setDate(d.getDate()+1); return toInputDate(d); };

// ════════════════════════════════════════════════
//   APP PRINCIPAL
// ════════════════════════════════════════════════
export default function App() {
  const [hotel, setHotel]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [usuario, setUsuario]       = useState(null);
  const [pagina, setPagina]         = useState('dashboard');
  const [filtro, setFiltro]         = useState('todas');
  const [toast, setToast]           = useState(null);
  const [modal, setModal]           = useState(null); // { hab }
  const [loginTab, setLoginTab]     = useState('login');
  const [loginForm, setLoginForm]   = useState({ email:'', pass:'' });
  const [regForm, setRegForm]       = useState({ nombre:'', email:'', pass:'' });
  const [resForm, setResForm]       = useState({ entrada: hoy(), salida: manana(), servicios: [] });
  const [habForm, setHabForm]       = useState({ numero:'', tipo:'individual', precio:'', capacidad:'', desc:'' });
  const [servForm, setServForm]     = useState({ nombre:'', precio:'' });
  const [tick, setTick]             = useState(0); // fuerza re-render tras mutaciones
  const toastRef = useRef(null);

  // Cargar o inicializar DB
  useEffect(() => {
    (async () => {
      const data = await cargarDB();
      if (data && data.usuarios?.length) {
        setHotel(reconstruirHotel(data));
      } else {
        const h = inicializarHotelDefault();
        setHotel(h);
        await guardarDB(h);
      }
      setLoading(false);
    })();
  }, []);

  const refresh = () => setTick(t => t + 1);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3500);
  };

  const save = async () => { if (hotel) await guardarDB(hotel); };

  // ── AUTH ──────────────────────────────────────
  const iniciarSesion = () => {
    const u = hotel.buscarUsuario(loginForm.email.trim());
    if (!u || u.password !== loginForm.pass) { showToast('Credenciales incorrectas', true); return; }
    setUsuario(u);
    setPagina('dashboard');
    showToast(`¡Bienvenido, ${u.nombre}! 👋`);
  };

  const registrar = async () => {
    const { nombre, email, pass } = regForm;
    if (!nombre.trim() || !email.trim() || !pass) { showToast('Rellena todos los campos', true); return; }
    if (hotel.buscarUsuario(email.trim())) { showToast('Ese email ya está registrado', true); return; }
    const nuevo = new Usuario(nombre.trim(), email.trim(), pass);
    hotel.agregarUsuario(nuevo);
    await save();
    setUsuario(nuevo);
    setPagina('dashboard');
    showToast('¡Cuenta creada con éxito! 🎉');
    refresh();
  };

  const cerrarSesion = () => {
    setUsuario(null);
    setLoginForm({ email:'', pass:'' });
    setRegForm({ nombre:'', email:'', pass:'' });
  };

  // ── RESERVAS ──────────────────────────────────
  const abrirModal = (hab) => {
    setModal({ hab });
    setResForm({ entrada: hoy(), salida: manana(), servicios: [] });
  };

  const toggleServicio = (sid) => {
    setResForm(f => ({
      ...f,
      servicios: f.servicios.includes(sid) ? f.servicios.filter(x => x !== sid) : [...f.servicios, sid]
    }));
  };

  const calcTotal = () => {
    if (!modal) return 0;
    const noches = Math.max(1, Math.ceil((new Date(resForm.salida) - new Date(resForm.entrada)) / 86400000));
    const srvsP  = resForm.servicios.reduce((a, sid) => {
      const s = hotel.servicios.find(x => x.id === sid);
      return a + (s?.precio || 0);
    }, 0);
    return (modal.hab.precio + srvsP) * noches;
  };

  const confirmarReserva = async () => {
    if (!resForm.entrada || !resForm.salida) { showToast('Selecciona las fechas', true); return; }
    if (new Date(resForm.salida) <= new Date(resForm.entrada)) { showToast('La salida debe ser posterior', true); return; }
    const servExt = resForm.servicios.map(sid => hotel.servicios.find(s => s.id === sid)).filter(Boolean);
    const r = new Reserva(usuario, modal.hab, resForm.entrada, resForm.salida, servExt);
    modal.hab.reservar();
    usuario.agregarReserva(r);
    hotel.agregarReserva(r);
    await save();
    setModal(null);
    refresh();
    showToast(`✅ Reserva ${r.id} confirmada — €${r.total}`);
  };

  const cancelarReserva = async (id) => {
    const r = usuario.reservas.find(x => x.id === id);
    if (!r) return;
    r.cancelar();
    // sync en hotel.reservas
    const hr = hotel.reservas.find(x => x.id === id);
    if (hr) hr.estado = 'cancelada';
    await save();
    refresh();
    showToast('Reserva cancelada');
  };

  // ── ADMIN — HABITACIONES ──────────────────────
  const agregarHabitacion = async () => {
    const { numero, tipo, precio, capacidad, desc } = habForm;
    const num = parseInt(numero); const prec = parseFloat(precio); const cap = parseInt(capacidad);
    if (!num || !prec || !cap) { showToast('Rellena todos los campos', true); return; }
    if (hotel.habitaciones.find(h => h.numero === num)) { showToast('Ya existe esa habitación', true); return; }
    hotel.agregarHabitacion(new Habitacion(num, tipo, prec, cap, desc));
    await save();
    setHabForm({ numero:'', tipo:'individual', precio:'', capacidad:'', desc:'' });
    refresh();
    showToast(`Habitación ${num} añadida`);
  };

  const eliminarHabitacion = async (id) => {
    hotel.eliminarHabitacion(id);
    await save();
    refresh();
    showToast('Habitación eliminada');
  };

  // ── ADMIN — SERVICIOS ─────────────────────────
  const agregarServicio = async () => {
    const { nombre, precio } = servForm;
    if (!nombre.trim() || !precio) { showToast('Rellena nombre y precio', true); return; }
    hotel.agregarServicio(new Servicio(nombre.trim(), parseFloat(precio)));
    await save();
    setServForm({ nombre:'', precio:'' });
    refresh();
    showToast(`Servicio "${nombre}" añadido`);
  };

  const eliminarServicio = async (id) => {
    hotel.eliminarServicio(id);
    await save();
    refresh();
    showToast('Servicio eliminado');
  };

  // ── ADMIN — USUARIOS ──────────────────────────
  const eliminarUsuario = async (id) => {
    hotel.eliminarUsuario(id);
    await save();
    refresh();
    showToast('Usuario eliminado');
  };

  // ── RENDER CONDICIONAL ────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0d0d0d', color:'#c9a84c', fontFamily:'DM Sans,sans-serif', fontSize:'1.1rem' }}>
      <style>{css}</style>
      Cargando base de datos… ⏳
    </div>
  );

  if (!usuario) return (
    <div className="login-wrap">
      <style>{css}</style>
      <div className="login-box">
        <div className="login-logo">🏨 HotelLux</div>
        <div className="login-tagline">Sistema de Gestión Hotelera</div>

        <div className="tabs">
          <button className={`tab${loginTab==='login'?' active':''}`} onClick={() => setLoginTab('login')}>Iniciar sesión</button>
          <button className={`tab${loginTab==='register'?' active':''}`} onClick={() => setLoginTab('register')}>Registrarse</button>
        </div>

        {loginTab === 'login' ? (
          <>
            <div className="fg"><label>Email</label>
              <input type="email" value={loginForm.email} onChange={e => setLoginForm(f=>({...f,email:e.target.value}))} placeholder="correo@ejemplo.com" onKeyDown={e=>e.key==='Enter'&&iniciarSesion()} />
            </div>
            <div className="fg"><label>Contraseña</label>
              <input type="password" value={loginForm.pass} onChange={e => setLoginForm(f=>({...f,pass:e.target.value}))} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&iniciarSesion()} />
            </div>
            <button className="btn-login" onClick={iniciarSesion}>Entrar</button>
            <div className="hint">
              Admin: <code>admin@hotel.com</code> / <code>admin123</code><br/>
              Usuario: <code>user@hotel.com</code> / <code>user123</code>
            </div>
          </>
        ) : (
          <>
            <div className="fg"><label>Nombre completo</label>
              <input type="text" value={regForm.nombre} onChange={e => setRegForm(f=>({...f,nombre:e.target.value}))} placeholder="Ana García" />
            </div>
            <div className="fg"><label>Email</label>
              <input type="email" value={regForm.email} onChange={e => setRegForm(f=>({...f,email:e.target.value}))} placeholder="correo@ejemplo.com" />
            </div>
            <div className="fg"><label>Contraseña</label>
              <input type="password" value={regForm.pass} onChange={e => setRegForm(f=>({...f,pass:e.target.value}))} placeholder="••••••••" />
            </div>
            <button className="btn-login" onClick={registrar}>Crear cuenta</button>
          </>
        )}
      </div>
    </div>
  );

  const esAdmin = usuario.rol === 'admin';
  const stats   = hotel.getStats();

  // Habitaciones filtradas
  const habsFiltradas = hotel.habitaciones.filter(h => {
    if (filtro === 'todas') return true;
    if (filtro === 'disponible') return h.disponible;
    return h.tipo === filtro;
  });

  const noches = Math.max(1, Math.ceil((new Date(resForm.salida) - new Date(resForm.entrada)) / 86400000));

  return (
    <>
      <style>{css}</style>

      {/* HEADER */}
      <header>
        <div className="logo">Hotel<span>Lux</span></div>
        <div className="user-info">
          <span>Bienvenido, <strong>{usuario.nombre}</strong></span>
          {esAdmin && <span className="b-admin">Admin</span>}
          <span className="db-badge">🗄️ DB activa</span>
          <button className="btn-logout" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <div className="app">
        {/* SIDEBAR */}
        <nav>
          <div className="nav-sec">Principal</div>
          {[['dashboard','📊','Dashboard'],['habitaciones','🛏','Habitaciones'],['reservas','📅','Mis Reservas'],['historial','🕐','Historial']].map(([id,ic,lbl]) => (
            <button key={id} className={`nav-btn${pagina===id?' active':''}`} onClick={() => setPagina(id)}><span>{ic}</span>{lbl}</button>
          ))}
          {esAdmin && <>
            <div className="nav-sec">Admin</div>
            {[['usuarios','👥','Usuarios'],['admin-hab','⚙️','Gestionar Hab.'],['admin-serv','🍽','Servicios']].map(([id,ic,lbl]) => (
              <button key={id} className={`nav-btn${pagina===id?' active':''}`} onClick={() => setPagina(id)}><span>{ic}</span>{lbl}</button>
            ))}
          </>}
        </nav>

        {/* MAIN */}
        <main>

          {/* ── DASHBOARD ── */}
          {pagina === 'dashboard' && <>
            <h1>Dashboard</h1>
            <p className="sub">Resumen del hotel en tiempo real</p>
            <div className="stats">
              {[['Total hab.',stats.total],['Disponibles',stats.disponibles],['Ocupadas',stats.ocupadas],['Reservas activas',stats.reservas],['Usuarios',stats.usuarios]].map(([l,v]) => (
                <div key={l} className="stat"><div className="lbl">{l}</div><div className="val">{v}</div></div>
              ))}
            </div>
            <h2 className="playfair" style={{color:'var(--cream)',marginBottom:'1rem',fontSize:'1.2rem'}}>Últimas reservas</h2>
            {hotel.reservas.length === 0
              ? <div className="empty">No hay reservas aún</div>
              : [...hotel.reservas].reverse().slice(0,6).map(r => (
                <div key={r.id} className="hi">
                  <div className="info">
                    <h4>Hab. {r.habitacion.numero} — {r.habitacion.tipo.toUpperCase()}</h4>
                    <p>{r.usuario.nombre} · {fmtFecha(r.entrada)} → {fmtFecha(r.salida)} · {r.getNochesTotal()} noches</p>
                  </div>
                  <div>
                    <span className={`badge ${r.estado==='activa'?'b-ok':'b-err'}`}>{r.estado}</span>
                    <div className="prec">€{r.total}</div>
                  </div>
                </div>
              ))
            }
          </>}

          {/* ── HABITACIONES ── */}
          {pagina === 'habitaciones' && <>
            <h1>Habitaciones</h1>
            <p className="sub">Consulta disponibilidad y realiza tu reserva</p>
            <div className="frow">
              <div className="fbtns">
                {[['todas','Todas'],['individual','Individual'],['doble','Doble'],['suite','Suite'],['disponible','Disponibles']].map(([f,l]) => (
                  <button key={f} className={`btn btn-sm ${filtro===f?'btn-gold':'btn-out'}`} onClick={() => setFiltro(f)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="grid">
              {habsFiltradas.length === 0
                ? <div className="empty">No hay habitaciones con ese filtro</div>
                : habsFiltradas.map(h => (
                  <div key={h.id} className="card">
                    <span className={`badge ${h.tipo==='suite'?'b-gold':h.tipo==='doble'?'b-blue':'b-gray'}`}>{h.tipo}</span>
                    <h3>Habitación {h.numero}</h3>
                    <p>{h.descripcion || 'Sin descripción'}</p>
                    <p style={{marginTop:'.5rem'}}>👤 Capacidad: {h.capacidad} persona{h.capacidad>1?'s':''}</p>
                    <div className="price">€{h.precio} <span>/ noche</span></div>
                    <span className={`badge ${h.disponible?'b-ok':'b-err'}`}>{h.getEstado()}</span>
                    {h.disponible && !esAdmin && (
                      <div className="btn-group">
                        <button className="btn btn-gold btn-sm" onClick={() => abrirModal(h)}>Reservar</button>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </>}

          {/* ── MIS RESERVAS ── */}
          {pagina === 'reservas' && <>
            <h1>Mis Reservas</h1>
            <p className="sub">Gestiona tus reservas activas</p>
            {usuario.getReservasActivas().length === 0
              ? <div className="empty"><div style={{fontSize:'2rem',marginBottom:'1rem'}}>📭</div>No tienes reservas activas</div>
              : usuario.getReservasActivas().map(r => (
                <div key={r.id} className="hi">
                  <div className="info">
                    <h4>{r.id} — Hab. {r.habitacion.numero} ({r.habitacion.tipo})</h4>
                    <p>📅 {fmtFecha(r.entrada)} → {fmtFecha(r.salida)} · {r.getNochesTotal()} noches</p>
                    {r.serviciosExtra.length > 0 && <p>🍽 Extras: {r.serviciosExtra.map(s=>s.nombre).join(', ')}</p>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="prec">€{r.total}</div>
                    <button className="btn btn-red btn-sm" style={{marginTop:'.5rem'}} onClick={() => cancelarReserva(r.id)}>Cancelar</button>
                  </div>
                </div>
              ))
            }
          </>}

          {/* ── HISTORIAL ── */}
          {pagina === 'historial' && <>
            <h1>Historial</h1>
            <p className="sub">Todas tus reservas realizadas</p>
            {usuario.getHistorial().length === 0
              ? <div className="empty"><div style={{fontSize:'2rem',marginBottom:'1rem'}}>🕐</div>Sin historial aún</div>
              : [...usuario.getHistorial()].reverse().map(r => (
                <div key={r.id} className="hi">
                  <div className="info">
                    <h4>{r.id} — Hab. {r.habitacion.numero} ({r.habitacion.tipo})</h4>
                    <p>📅 {fmtFecha(r.entrada)} → {fmtFecha(r.salida)} · {r.getNochesTotal()} noches</p>
                    <p>Creada: {fmtFecha(r.fechaCreacion)}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className={`badge ${r.estado==='activa'?'b-ok':'b-err'}`}>{r.estado}</span>
                    <div className="prec">€{r.total}</div>
                  </div>
                </div>
              ))
            }
          </>}

          {/* ── ADMIN: USUARIOS ── */}
          {pagina === 'usuarios' && esAdmin && <>
            <h1>Gestión de Usuarios</h1>
            <p className="sub">Usuarios registrados en la base de datos</p>
            <div className="tw">
              <table>
                <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Reservas</th><th>Acciones</th></tr></thead>
                <tbody>
                  {hotel.usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.rol==='admin' ? <span className="b-admin">Admin</span> : 'Usuario'}</td>
                      <td>{u.reservas?.length ?? '—'}</td>
                      <td>{u.email !== 'admin@hotel.com'
                        ? <button className="btn btn-red btn-sm" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                        : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ── ADMIN: HABITACIONES ── */}
          {pagina === 'admin-hab' && esAdmin && <>
            <h1>Gestionar Habitaciones</h1>
            <p className="sub">Añade o elimina habitaciones del hotel</p>
            <div className="form-box" style={{marginBottom:'2rem'}}>
              <h2>Nueva Habitación</h2>
              <div className="form-row">
                <div className="fg"><label>Número</label>
                  <input type="number" value={habForm.numero} onChange={e=>setHabForm(f=>({...f,numero:e.target.value}))} placeholder="101" />
                </div>
                <div className="fg"><label>Tipo</label>
                  <select value={habForm.tipo} onChange={e=>setHabForm(f=>({...f,tipo:e.target.value}))}>
                    <option value="individual">Individual</option>
                    <option value="doble">Doble</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="fg"><label>Precio/noche (€)</label>
                  <input type="number" value={habForm.precio} onChange={e=>setHabForm(f=>({...f,precio:e.target.value}))} placeholder="80" />
                </div>
                <div className="fg"><label>Capacidad</label>
                  <input type="number" value={habForm.capacidad} onChange={e=>setHabForm(f=>({...f,capacidad:e.target.value}))} placeholder="2" />
                </div>
              </div>
              <div className="fg"><label>Descripción</label>
                <textarea rows={2} value={habForm.desc} onChange={e=>setHabForm(f=>({...f,desc:e.target.value}))} placeholder="Vista al mar..." style={{width:'100%',background:'var(--d3)',border:'1px solid #333',borderRadius:'5px',color:'var(--cream)',padding:'.65rem .9rem',fontFamily:'DM Sans,sans-serif',resize:'vertical'}} />
              </div>
              <button className="btn btn-gold" onClick={agregarHabitacion}>➕ Añadir habitación</button>
            </div>
            <div className="tw">
              <table>
                <thead><tr><th>Nº</th><th>Tipo</th><th>Precio</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {hotel.habitaciones.map(h => (
                    <tr key={h.id}>
                      <td>{h.numero}</td>
                      <td><span className={`badge ${h.tipo==='suite'?'b-gold':h.tipo==='doble'?'b-blue':'b-gray'}`}>{h.tipo}</span></td>
                      <td>€{h.precio}</td>
                      <td>{h.capacidad}</td>
                      <td className={h.disponible?'green':'red-c'}>{h.getEstado()}</td>
                      <td><button className="btn btn-red btn-sm" onClick={() => eliminarHabitacion(h.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ── ADMIN: SERVICIOS ── */}
          {pagina === 'admin-serv' && esAdmin && <>
            <h1>Servicios del Hotel</h1>
            <p className="sub">Gestiona los servicios adicionales</p>
            <div className="form-box" style={{marginBottom:'2rem'}}>
              <h2>Nuevo Servicio</h2>
              <div className="form-row">
                <div className="fg"><label>Nombre</label>
                  <input type="text" value={servForm.nombre} onChange={e=>setServForm(f=>({...f,nombre:e.target.value}))} placeholder="Desayuno buffet" />
                </div>
                <div className="fg"><label>Precio (€/noche)</label>
                  <input type="number" value={servForm.precio} onChange={e=>setServForm(f=>({...f,precio:e.target.value}))} placeholder="15" />
                </div>
              </div>
              <button className="btn btn-gold" onClick={agregarServicio}>➕ Añadir servicio</button>
            </div>
            <div className="grid">
              {hotel.servicios.map(s => (
                <div key={s.id} className="card">
                  <h3>{s.nombre}</h3>
                  <div className="price">€{s.precio} <span>/ noche</span></div>
                  <div className="btn-group">
                    <button className="btn btn-red btn-sm" onClick={() => eliminarServicio(s.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </>}

        </main>
      </div>

      {/* ── MODAL RESERVA ── */}
      {modal && (
        <div className="backdrop" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>📅 Realizar Reserva</h3>
            <div className="fg">
              <label>Habitación seleccionada</label>
              <input readOnly value={`Hab. ${modal.hab.numero} — ${modal.hab.tipo} — €${modal.hab.precio}/noche`} style={{opacity:.6}} />
            </div>
            <div className="form-row">
              <div className="fg"><label>Entrada</label>
                <input type="date" value={resForm.entrada} onChange={e=>setResForm(f=>({...f,entrada:e.target.value}))} />
              </div>
              <div className="fg"><label>Salida</label>
                <input type="date" value={resForm.salida} onChange={e=>setResForm(f=>({...f,salida:e.target.value}))} />
              </div>
            </div>
            <div className="fg">
              <label>Servicios adicionales</label>
              <div className="serv-check">
                {hotel.servicios.map(s => (
                  <label key={s.id} className="serv-label">
                    <input type="checkbox" checked={resForm.servicios.includes(s.id)} onChange={() => toggleServicio(s.id)} style={{accentColor:'var(--gold)'}} />
                    {s.nombre} (+€{s.precio}/noche)
                  </label>
                ))}
              </div>
            </div>
            <div style={{color:'var(--gold)',fontWeight:700,fontSize:'1.1rem',marginTop:'.5rem'}}>
              Total: €{calcTotal()} ({noches} noche{noches>1?'s':''})
            </div>
            <div className="modal-foot">
              <button className="btn btn-out" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={confirmarReserva}>Confirmar reserva</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className={`toast${toast.err?' err':''}`}>{toast.msg}</div>}
    </>
  );
}
