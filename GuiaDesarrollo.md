# Plataforma de Gestión de Capacitaciones Empresariales (Inspirada en LAUS)

## 1. Objetivo

Desarrollar una plataforma web SaaS multiempresa para la gestión integral de capacitaciones corporativas.

La plataforma permitirá:

* Administración de empresas.
* Gestión de usuarios.
* Gestión de capacitaciones.
* Gestión de contenido multimedia.
* Evaluaciones en línea.
* Certificados digitales.
* Reportes y métricas.
* Escalabilidad para futuras funcionalidades SST.

---

# 2. Arquitectura Tecnológica

## Frontend

* Angular 20
* Angular Material
* RxJS
* Signals

## Backend

Inicialmente sin backend propio.

Servicios utilizados:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Firebase Hosting

## Futuro

* .NET 8 API
* PostgreSQL

---

# 3. Modelo Multiempresa

## Roles Globales

### SUPER_ADMIN

Responsable de toda la plataforma.

Permisos:

* Crear empresas
* Activar empresas
* Desactivar empresas
* Gestionar planes
* Visualizar métricas globales

---

## Roles Empresa

### COMPANY_ADMIN

Permisos:

* Gestionar usuarios
* Gestionar capacitaciones
* Gestionar evaluaciones
* Generar certificados
* Consultar reportes

---

### PARTICIPANT

Permisos:

* Visualizar capacitaciones asignadas
* Realizar evaluaciones
* Descargar certificados

---

# 4. Sprint 1 - Infraestructura y Seguridad

## Objetivo

Implementar autenticación, autorización y modelo multiempresa.

## Funcionalidades

### Login

* Correo electrónico
* Contraseña

### Recuperación de contraseña

* Envío de correo
* Cambio de contraseña

### Gestión de sesión

* JWT Firebase
* Persistencia de sesión

### Seguridad

* Guards Angular
* Firestore Security Rules

### Empresas

CRUD:

* Crear empresa
* Editar empresa
* Activar empresa
* Desactivar empresa

### Usuarios

CRUD:

* Crear usuario
* Editar usuario
* Bloquear usuario
* Desbloquear usuario

### Dashboard Inicial

Indicadores:

* Total empresas
* Total usuarios
* Total cursos

---

# Sprint 2 - Gestión de Capacitaciones

## Objetivo

Administrar cursos corporativos.

## Funcionalidades

### Cursos

CRUD:

* Crear capacitación
* Editar capacitación
* Duplicar capacitación
* Publicar capacitación
* Despublicar capacitación

### Categorías

CRUD:

* Seguridad
* Calidad
* RRHH
* Operaciones

### Portada

* Imagen
* Descripción
* Duración
* Vigencia

### Estado

* Borrador
* Publicado
* Finalizado

---

# Sprint 3 - Gestión de Contenido

## Objetivo

Administrar contenido de aprendizaje.

## Funcionalidades

### Módulos

CRUD:

* Crear módulo
* Editar módulo
* Reordenar módulo

### Materiales

Tipos:

* Video YouTube
* PDF
* Imagen
* Archivo descargable
* Enlace externo

### Seguimiento

Registro:

* Inicio módulo
* Fin módulo
* Tiempo invertido

### Progreso

Porcentaje completado:

0% - 100%

---

# Sprint 4 - Participantes e Inscripciones

## Objetivo

Administrar participantes y asignaciones.

## Funcionalidades

### Inscripciones

* Individual
* Masiva mediante Excel

### Gestión de grupos

* Área
* Sede
* Cargo

### Asignación

* Curso obligatorio
* Curso opcional

### Historial

Visualización:

* Cursos completados
* Cursos pendientes

---

# Sprint 5 - Evaluaciones

## Objetivo

Validar conocimientos adquiridos.

## Funcionalidades

### Banco de Preguntas

Tipos:

* Opción múltiple
* Verdadero/Falso

### Evaluaciones

Configuración:

* Nota mínima
* Tiempo límite
* Intentos permitidos

### Resultados

Visualización:

* Nota obtenida
* Fecha
* Estado aprobado/desaprobado

### Indicadores

* Promedio general
* Tasa de aprobación

---

# Sprint 6 - Certificados

## Objetivo

Automatizar emisión de certificados.

## Funcionalidades

### Certificados PDF

Datos:

* Nombre participante
* Curso
* Horas académicas
* Fecha

### Código Único

Formato:

CERT-2026-000001

### Validación

Página pública:

* Consulta por código
* Consulta por QR

### Descarga

* PDF

---

# Sprint 7 - Dashboard Ejecutivo

## Objetivo

Proporcionar métricas para RRHH.

## Indicadores

### Capacitación

* Total cursos
* Total participantes

### Cumplimiento

* Cursos aprobados
* Cursos pendientes

### Horas

* Horas capacitadas por persona
* Horas capacitadas por área

### Exportación

* Excel
* PDF

---

# Sprint 8 - Notificaciones

## Objetivo

Automatizar comunicación.

## Funcionalidades

### Correos

Eventos:

* Asignación de curso
* Próximo vencimiento
* Certificado emitido

### Recordatorios

* 7 días antes
* 3 días antes
* 1 día antes

---

# Sprint 9 - Funcionalidades Empresariales Avanzadas

## Objetivo

Acercar la plataforma a soluciones tipo LAUS.

## Funcionalidades

### Matriz de Capacitaciones

Visualización:

* Puesto
* Cursos obligatorios
* Cumplimiento

### Vencimientos

Control:

* Cursos vencidos
* Cursos por vencer

### Historial Laboral

Por colaborador:

* Capacitaciones realizadas
* Certificados obtenidos

### Auditoría

Registro:

* Usuario
* Acción
* Fecha
* IP

---

# Estructura Firestore

companies

users

courses

course_modules

course_materials

enrollments

progress

evaluations

questions

exam_attempts

certificates

notifications

audit_logs

---

# Seguridad

Cada documento deberá incluir:

companyId

Todas las consultas deberán filtrar por companyId.

Ningún usuario podrá acceder a información de otra empresa.

---

# MVP Comercial

Versión mínima vendible:

Sprint 1
Sprint 2
Sprint 3
Sprint 4
Sprint 5
Sprint 6

Duración estimada:

10 a 12 semanas

Resultado:

Plataforma SaaS multiempresa de capacitación corporativa lista para piloto y comercialización.
