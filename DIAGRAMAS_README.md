# 📐 DIAGRAMAS — HOTEL LUX
## Para implementar en StarUML

---

## 1. DIAGRAMA DE CLASES

### CLASES (8 mínimo — tenemos 6 propias + relaciones)

---

### Clase: Persona  *(clase base abstracta)*
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| id | number | # (protected) |
| nombre | String | # |
| email | String | # |
| password | String | # |
| toString() | String | + |

---

### Clase: Usuario  *(hereda de Persona)*
**extends Persona**
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| rol | String | + |
| reservas | Reserva[] | - |
| agregarReserva(r: Reserva) | void | + |
| getReservasActivas() | Reserva[] | + |
| getHistorial() | Reserva[] | + |

---

### Clase: Administrador  *(hereda de Persona)*
**extends Persona**
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| rol | String | + |
| agregarHabitacion(hotel, h) | void | + |
| eliminarHabitacion(hotel, id) | void | + |
| agregarServicio(hotel, s) | void | + |

---

### Clase: Habitacion
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| id | number | - |
| numero | number | + |
| tipo | String | + |
| precio | number | + |
| capacidad | number | + |
| descripcion | String | + |
| disponible | boolean | + |
| servicios | Servicio[] | - |
| reservar() | void | + |
| liberar() | void | + |
| getEstado() | String | + |

---

### Clase: Servicio
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| id | number | - |
| nombre | String | + |
| precio | number | + |

---

### Clase: Reserva
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| id | String | + |
| usuario | Usuario | - |
| habitacion | Habitacion | - |
| entrada | Date | + |
| salida | Date | + |
| serviciosExtra | Servicio[] | + |
| estado | String | + |
| total | number | + |
| fechaCreacion | Date | + |
| calcularTotal() | void | - |
| getNochesTotal() | number | + |
| cancelar() | void | + |
| completar() | void | + |

---

### Clase: Hotel
| Atributo / Método | Tipo | Visibilidad |
|---|---|---|
| nombre | String | + |
| direccion | String | + |
| habitaciones | Habitacion[] | - |
| servicios | Servicio[] | - |
| reservas | Reserva[] | - |
| usuarios | Persona[] | - |
| agregarHabitacion(h) | void | + |
| eliminarHabitacion(id) | void | + |
| agregarServicio(s) | void | + |
| eliminarServicio(id) | void | + |
| agregarUsuario(u) | void | + |
| buscarUsuario(email) | Persona | + |
| getHabitacionesDisponibles() | Habitacion[] | + |
| getStats() | Object | + |

---

## RELACIONES ENTRE CLASES

### HERENCIA (Generalización)
```
Persona <|-- Usuario
Persona <|-- Administrador
```

### COMPOSICIÓN (el todo contiene las partes, no existen sin él)
```
Hotel *-- Habitacion       (Hotel tiene habitaciones, sin hotel no existen)
Hotel *-- Servicio         (Hotel tiene servicios, sin hotel no existen)
```

### ASOCIACIÓN (relaciones entre objetos independientes)
```
Reserva --> Usuario        (la reserva conoce al usuario)
Reserva --> Habitacion     (la reserva conoce la habitación)
Usuario --> Reserva        (un usuario tiene muchas reservas)
Reserva --> Servicio       (una reserva puede tener servicios extra)
Administrador --> Hotel    (el admin gestiona el hotel)
```

### MULTIPLICIDADES
```
Hotel       "1"  *--  "0..*"  Habitacion
Hotel       "1"  *--  "0..*"  Servicio
Hotel       "1"  -->  "0..*"  Persona (usuarios)
Usuario     "1"  -->  "0..*"  Reserva
Reserva     "1"  -->  "1"     Habitacion
Reserva     "1"  -->  "0..*"  Servicio
```

---

## 2. DIAGRAMA DE CASOS DE USO

### ACTORES
- **Usuario**: Cliente registrado del hotel
- **Administrador**: Gestiona el hotel (hereda de Usuario)

---

### CASOS DE USO OBLIGATORIOS

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| CU01 | Registrarse | Usuario | Crear una cuenta nueva con nombre, email y contraseña |
| CU02 | Iniciar sesión | Usuario / Admin | Autenticarse con email y contraseña |
| CU03 | Consultar habitaciones | Usuario / Admin | Ver listado de habitaciones con filtros |
| CU04 | Realizar reserva | Usuario | Reservar una habitación con fechas y servicios extra |
| CU05 | Gestionar habitaciones | Administrador | Añadir, ver o eliminar habitaciones |
| CU06 | Gestionar servicios | Administrador | Añadir o eliminar servicios del hotel |
| CU07 | Gestionar usuarios | Administrador | Ver listado y eliminar usuarios |
| CU08 | Cancelar reserva | Usuario | Cancelar una reserva activa propia |
| CU09 | Consultar historial | Usuario | Ver todas las reservas realizadas |
| CU10 | Ver dashboard | Administrador | Ver estadísticas del hotel en tiempo real |

---

### RELACIONES DE CASOS DE USO

```
<<include>>
CU04 (Realizar reserva) --include--> CU02 (Iniciar sesión)
CU04 (Realizar reserva) --include--> CU03 (Consultar habitaciones)

<<extend>>
CU04 (Realizar reserva) --extend--> CU04b (Añadir servicios extra)
CU02 (Iniciar sesión) --extend--> CU01 (Registrarse) [si no tiene cuenta]

Sin include/extend (directas):
Administrador --> CU05
Administrador --> CU06
Administrador --> CU07
Administrador --> CU10
Usuario --> CU01
Usuario --> CU02
Usuario --> CU03
Usuario --> CU04
Usuario --> CU08
Usuario --> CU09
```

---

## 3. ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
hotel-lux/
├── index.html          ← Aplicación completa (HTML + CSS + JS)
├── diagramas/
│   ├── clases.mdj      ← Diagrama de clases (StarUML)
│   └── casos-uso.mdj   ← Diagrama de casos de uso (StarUML)
└── README.md           ← Documentación del proyecto
```

---

## 4. FUNCIONALIDADES IMPLEMENTADAS

### Usuario puede:
- ✅ Registrarse (CU01)
- ✅ Iniciar sesión (CU02)
- ✅ Consultar habitaciones con filtros (CU03)
- ✅ Realizar reserva con fechas y servicios extra (CU04)
- ✅ Ver reservas activas y cancelarlas (CU08)
- ✅ Consultar historial completo (CU09)

### Administrador puede:
- ✅ Todo lo anterior (excepto reservar)
- ✅ Ver dashboard con estadísticas (CU10)
- ✅ Añadir y eliminar habitaciones (CU05)
- ✅ Añadir y eliminar servicios (CU06)
- ✅ Ver y eliminar usuarios (CU07)

### Conceptos POO aplicados:
- ✅ **Herencia**: `Usuario` y `Administrador` extienden `Persona`
- ✅ **Composición**: `Hotel` contiene `Habitacion` y `Servicio`
- ✅ **Asociación**: `Reserva` asocia `Usuario` ↔ `Habitacion` ↔ `Servicio`
- ✅ **Encapsulamiento**: Atributos privados con métodos públicos
- ✅ **Polimorfismo**: `toString()` en clase base `Persona`

---

## 5. CREDENCIALES DE PRUEBA

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@hotel.com | admin123 |
| Usuario | user@hotel.com | user123 |
