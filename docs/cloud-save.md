# Guardado en la nube (Supabase)

El juego puede guardar la partida en una base de datos de [Supabase](https://supabase.com) para jugar
en varios dispositivos. Cada jugador entra con su email (sin contraseña) y solo puede leer y escribir
su propia partida.

Mientras `js/cloud-config.js` esté vacío, la sección **Cloud Save** de Ajustes no aparece y el juego
funciona como siempre (guardado solo en el navegador).

## 1. Crear el proyecto

1. Crea una cuenta gratis en https://supabase.com y pulsa **New project**.
2. Ponle un nombre (por ejemplo `idle-football-manager`), una contraseña de base de datos y una región
   cercana (por ejemplo, Europa).

## 2. Crear la tabla

1. En el proyecto, abre **SQL Editor** → **New query**.
2. Pega el contenido de [`docs/supabase.sql`](supabase.sql) y pulsa **Run**.

Esto crea la tabla `saves` (una fila por jugador) y activa Row Level Security para que cada uno solo
vea su partida.

## 3. Configurar el inicio de sesión

1. **Authentication → Sign In / Providers**: comprueba que **Email** está activado (lo está por defecto).
2. **Authentication → URL Configuration**:
   - **Site URL**: la dirección donde está publicado el juego, por ejemplo
     `https://rodriar000.github.io/idle-football-manager/`.
   - **Redirect URLs**: añade esa misma dirección.
3. Opcional, para poder escribir un código en vez de abrir el enlace (útil con el juego instalado
   como app): **Authentication → Emails → Magic Link** y añade al texto del email
   `Tu código: {{ .Token }}`.

El servidor de correo gratuito de Supabase envía pocos emails por hora. Si el juego lo va a usar
mucha gente, conecta tu propio SMTP en **Authentication → Emails → SMTP Settings**.

## 4. Conectar el juego

1. En **Project Settings → API** (o **API Keys**) copia la **Project URL** y la clave pública
   **anon** / **publishable**.
2. Pégalas en `js/cloud-config.js`:

```js
const CLOUD_CONFIG = {
    url: "https://xxxxxxxx.supabase.co",
    anonKey: "eyJhbGciOi..."
};
```

La clave `anon` es pública a propósito: la seguridad la da Row Level Security. **Nunca** pongas aquí
la clave `service_role` / `secret`.

## 5. Publicar el juego

El guardado en la nube necesita que el juego esté en una web normal. Con GitHub Pages:
**Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta
`/ (root)`. La dirección será `https://rodriar000.github.io/idle-football-manager/`.

## Cómo funciona

- Al entrar, si no había partida en la nube, se sube la de este dispositivo.
- Después se sube sola cada 5 minutos y al salir o cambiar de pestaña.
- Si otro dispositivo guardó una partida más nueva, el juego no la sobrescribe: pregunta si cargar
  la de la nube o quedarse con la de este dispositivo.
