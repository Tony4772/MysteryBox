# MysteryBox Android (Kotlin + Jetpack Compose)

Cliente nativo del backend Node/Express de MysteryBox. No reescribe la logica del juego: consume la misma API REST que la web, con el mismo JWT.

## Requisitos

- Android Studio con JDK 17 o superior (probado con JDK 21)
- Android SDK 35
- Backend corriendo desde la raiz del repo: `npm install` y `npm start` (puerto 3000)
- Emulador Android o dispositivo fisico en la misma red

## Apuntar al backend

Edita `local.properties` (no se versiona):

```properties
# Emulador: 10.0.2.2 es el localhost del PC
API_BASE_URL=http://10.0.2.2:3000/api/

# Dispositivo fisico: usa la IP LAN del PC y abre el puerto 3000 en el firewall
# API_BASE_URL=http://192.168.1.50:3000/api/
```

En produccion debe ser HTTPS. El manifest permite HTTP en claro solo para desarrollo.

## Compilar y ejecutar

- Android Studio: abrir la carpeta `android/`, sincronizar y ejecutar `app`.
- CLI: `./gradlew :app:assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`

## Arquitectura

- Kotlin + Jetpack Compose + Material 3
- Navigation Compose, MVVM con `StateFlow`
- Retrofit + Gson + OkHttp (interceptor que inyecta `Authorization: Bearer <token>`)
- Inyeccion de dependencias manual con `AppContainer` (sin Hilt, menos piezas que alinear)
- Sesion persistida en SharedPreferences; en produccion migrar a EncryptedSharedPreferences

```
app/src/main/java/com/ebyzom/mysterybox/
├── MainActivity.kt / MysteryBoxApp.kt
├── di/AppContainer.kt
├── data/
│   ├── remote/        DTOs, ApiService, ApiClient
│   ├── ApiCall.kt     errores HTTP -> mensaje del backend
│   ├── SessionStore.kt / SessionRepository.kt
│   ├── BoxRepository.kt / InventoryRepository.kt
└── ui/
    ├── theme/         paleta igual a la web
    ├── common/        emojis, colores de rareza, componentes
    ├── auth/          login y registro
    ├── boxes/         lista, detalle, apertura y reveal
    ├── inventory/     grid y estadisticas
    └── profile/       cuenta y logout
```

## Incluido en el MVP

- Login y registro contra `/api/auth/*`, sesion persistente (token de 7 dias)
- Lista de cajas y detalle con probabilidades y objetos por rareza
- Apertura de caja con animacion, resultado decidido por el servidor y saldo actualizado
- Inventario con totales por rareza
- Perfil con creditos, rol y cierre de sesion
- URL del backend visible en Perfil para depurar conexiones

## Fase 2 (no incluido)

- Compra de creditos: los endpoints actuales son simulados. Requiere Stripe PaymentSheet o MercadoPago Checkout Bricks en la app y Payment Intents reales (con webhook) en el backend.
- Billetera con historial de transacciones
- Panel de administracion (recomendado mantenerlo en la web)
- Imagenes reales de los objetos (hoy se usan emojis)
- Tests de UI e instrumentacion

## Notas de producto

- El resultado de cada caja se calcula en el servidor, la app no puede manipular probabilidades.
- Google Play exige mostrar las probabilidades antes de cualquier compra y cumplir su politica de cajas de botin; el detalle de caja ya las muestra.
