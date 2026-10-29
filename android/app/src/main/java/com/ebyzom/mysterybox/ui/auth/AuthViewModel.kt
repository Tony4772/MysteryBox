package com.ebyzom.mysterybox.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ebyzom.mysterybox.data.SessionRepository
import kotlinx.coroutines.launch

enum class AuthMode { Login, Register }

class AuthViewModel(private val sessionRepository: SessionRepository) : ViewModel() {
    var loading by mutableStateOf(false)
        private set

    var error by mutableStateOf<String?>(null)
        private set

    fun submit(mode: AuthMode, username: String, email: String, password: String) {
        if (loading) return

        error = when {
            email.isBlank() || password.isBlank() -> "Completa email y contrasena"
            mode == AuthMode.Register && username.isBlank() -> "Escribe un nombre de usuario"
            mode == AuthMode.Register && password.length < 6 -> "La contrasena debe tener al menos 6 caracteres"
            else -> null
        }
        if (error != null) return

        viewModelScope.launch {
            loading = true
            val result = if (mode == AuthMode.Login) {
                sessionRepository.login(email.trim(), password)
            } else {
                sessionRepository.register(username.trim(), email.trim(), password)
            }
            result.onFailure { error = it.message }
            loading = false
        }
    }

    fun clearError() {
        error = null
    }

    companion object {
        fun factory(sessionRepository: SessionRepository): ViewModelProvider.Factory = viewModelFactory {
            initializer { AuthViewModel(sessionRepository) }
        }
    }
}
