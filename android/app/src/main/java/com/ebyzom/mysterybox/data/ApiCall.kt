package com.ebyzom.mysterybox.data

import com.ebyzom.mysterybox.data.remote.ApiError
import com.google.gson.Gson
import retrofit2.HttpException
import java.io.IOException

class ApiException(message: String) : Exception(message)

private val gson = Gson()

suspend fun <T> apiCall(block: suspend () -> T): Result<T> {
    return try {
        Result.success(block())
    } catch (e: HttpException) {
        val serverMessage = e.response()?.errorBody()?.string()?.let { body ->
            runCatching { gson.fromJson(body, ApiError::class.java)?.error }.getOrNull()
        }
        Result.failure(ApiException(serverMessage ?: defaultMessage(e.code())))
    } catch (e: IOException) {
        Result.failure(ApiException("No se pudo conectar con el servidor. Revisa tu conexion."))
    } catch (e: Exception) {
        Result.failure(ApiException(e.message ?: "Error inesperado"))
    }
}

private fun defaultMessage(code: Int): String = when (code) {
    400 -> "Solicitud invalida"
    401 -> "Sesion expirada. Vuelve a iniciar sesion."
    403 -> "No tienes permisos para esta accion"
    404 -> "Recurso no encontrado"
    in 500..599 -> "Error del servidor ($code)"
    else -> "Error inesperado ($code)"
}
