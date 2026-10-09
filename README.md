# Hierro · registro de gym

App web instalable (PWA) para iPhone. Registra rutinas, series, descansos y progreso. Funciona sin internet y guarda todo en el teléfono.

## Qué hace

- **Rutinas**: crea, edita, duplica y reordena. Cada ejercicio tiene series, rango de repeticiones y tiempo de descanso propios.
- **Entrenamiento en vivo**: toca **Iniciar** y anota peso y repeticiones de cada serie. La columna *Anterior* muestra lo que hiciste la última vez; si dejas un campo vacío y tocas ✓, se usa el valor sugerido.
- **Cronómetro de descanso**: arranca solo al marcar una serie. Tiene ±15 s y Saltar, y suena al terminar.
- **Tipos de serie**: normal, calentamiento, drop set y al fallo (toca el número de la serie).
- **Sugerencias de progresión**: si completaste el tope de repeticiones, te propone subir 2,5 kg.
- **Récords personales**: aviso al momento y resumen al terminar.
- **Historial**: calendario mensual y detalle de cada sesión. Se puede editar, borrar o guardar como rutina.
- **Progreso**: volumen semanal, racha, series por músculo, 1RM estimado, peso máximo por ejercicio y peso corporal.
- **Herramientas**: calculadora de discos y calculadora de 1RM.
- **Registro de actividad**: cada acción queda anotada con fecha y hora (Ajustes → Registro de actividad).
- **Respaldo**: exporta e importa un archivo `.json`, o cópialo como texto.
- Unidades en kg o lb, tema claro u oscuro y pantalla siempre encendida mientras entrenas.

## Dónde se guardan los datos

En el propio iPhone, en dos lugares a la vez (IndexedDB y localStorage). Siguen ahí aunque cierres la app o reinicies el teléfono. Se pierden solo si borras la app de la pantalla de inicio o los datos de Safari, así que **exporta un respaldo de vez en cuando**. La app te lo recuerda cada 14 días.

## Publicarla gratis con GitHub Pages

1. Crea una cuenta gratuita en https://github.com.
2. Crea un repositorio público llamado `hierro` (sin README).
3. En esta carpeta:
   ```
   git remote add origin https://github.com/TU_USUARIO/hierro.git
   git push -u origin main
   ```
4. En GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
5. En un minuto estará en `https://TU_USUARIO.github.io/hierro/`.

## Instalar en el iPhone

1. Abre la dirección en **Safari**.
2. Toca **Compartir** → **Agregar a pantalla de inicio** → **Agregar**.
3. Ábrela siempre desde el ícono.

## Actualizar la app

Edita los archivos, sube el número de `CACHE` en `sw.js` (por ejemplo, `hierro-v2`) y haz `git push`. El iPhone descarga la versión nueva la próxima vez que abras la app con internet.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | Página principal |
| `app.js` | Toda la lógica |
| `app.css` | Estilos (tema oscuro y claro) |
| `sw.js` | Funcionamiento sin conexión |
| `manifest.webmanifest`, `icons/` | Ícono y datos de instalación |
| `build.js` | `node build.js` genera `dist/hierro.html`, la app en un solo archivo |
