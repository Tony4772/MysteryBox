package com.ebyzom.mysterybox.data

import com.ebyzom.mysterybox.data.remote.ApiService
import com.ebyzom.mysterybox.data.remote.LoginRequest
import com.ebyzom.mysterybox.data.remote.RegisterRequest
import com.ebyzom.mysterybox.data.remote.UserDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SessionRepository(
    private val api: ApiService,
    private val store: SessionStore,
) {
    private val _user = MutableStateFlow<UserDto?>(null)
    val user: StateFlow<UserDto?> = _user.asStateFlow()

    val hasToken: Boolean get() = !store.token.isNullOrBlank()

    suspend fun login(email: String, password: String): Result<Unit> =
        apiCall { api.login(LoginRequest(email, password)) }
            .onSuccess {
                store.save(it.token)
                _user.value = it.user
            }
            .map { }

    suspend fun register(username: String, email: String, password: String): Result<Unit> =
        apiCall { api.register(RegisterRequest(username, email, password)) }
            .onSuccess {
                store.save(it.token)
                _user.value = it.user
            }
            .map { }

    suspend fun restore(): Result<Unit> {
        if (!hasToken) return Result.failure(ApiException("No hay sesion guardada"))
        return apiCall { api.me() }
            .onSuccess { _user.value = it.user }
            .map { }
    }

    fun updateCredits(newBalance: Int) {
        _user.value = _user.value?.copy(credits = newBalance)
    }

    fun logout() {
        store.clear()
        _user.value = null
    }
}
