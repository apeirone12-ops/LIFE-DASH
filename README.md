# Mi App - Guía de instalación

## Stack
- React + Vite
- Supabase (auth, base de datos, storage)
- Tailwind CSS v4
- Netlify (deploy)

---

## PASO 1 — Clonar y configurar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env (copiar del ejemplo)
cp .env.example .env
```

Editá el `.env` con tus datos de Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## PASO 2 — Configurar Supabase

1. Entrá a https://supabase.com → tu proyecto → **SQL Editor**
2. Copiá TODO el contenido de `supabase_schema.sql`
3. Pegalo en el SQL Editor y ejecutalo (botón **Run**)
4. Verificá que se crearon las tablas en **Table Editor**

---

## PASO 3 — Google OAuth

1. Supabase → **Authentication → Providers → Google → Enable**
2. Copiá la "Callback URL" que te da Supabase
3. Andá a https://console.cloud.google.com
4. Creá un proyecto → APIs & Services → Credentials → **Create OAuth 2.0 Client ID**
5. Application type: **Web application**
6. En "Authorized redirect URIs" pegá la callback URL de Supabase
7. Copiá Client ID y Client Secret → pegálos en Supabase

---

## PASO 4 — Correr en local

```bash
npm run dev
```

Abrí http://localhost:5173

---

## PASO 5 — Deploy en Netlify

```bash
# Build
npm run build
```

1. Subí la carpeta `dist/` a Netlify arrastrando, o conectá tu repo de GitHub
2. En Netlify → **Site settings → Environment variables** → agregá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. En Netlify → **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Agregá un archivo `netlify.toml` en la raíz:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

5. En Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://tu-app.netlify.app`
   - Redirect URLs: `https://tu-app.netlify.app`

---

## Módulos incluidos

| Módulo | Funciones |
|--------|-----------|
| Login | Google OAuth, sesión persistente |
| Perfil | Foto, nombre, teléfono, temas, fondo personalizado |
| Agenda | Calendario, tareas con prioridad, recordatorios, notas |
| Finanzas | Ingresos/gastos por categoría, gráficos, resumen mensual |
| Inversiones | Cripto (precios CoinGecko), acciones, CEDEARs, plazo fijo, dólar blue |
| Facultad | Materias, exámenes con countdown, notas estilo Notion |
