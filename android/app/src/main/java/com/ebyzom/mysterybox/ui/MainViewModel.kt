package com.ebyzom.mysterybox.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ebyzom.mysterybox.data.SessionRepository
import com.ebyzom.mysterybox.data.remote.UserDto
import com.ebyzom.mysterybox.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface SessionUiState {
    data object Loading : SessionUiState
    data object LoggedOut : SessionUiState
    data class LoggedIn(val user: UserDto) : SessionUiState
}

class MainViewModel(private val sessionRepository: SessionRepository) : ViewModel() {
    private val _state = MutableStateFlow<SessionUiState>(SessionUiState.Loading)
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            sessionRepository.user.collect { user ->
                if (user != null) {
                    _state.value = SessionUiState.LoggedIn(user)
                }
            }
        }
        viewModelScope.launch {
            if (!sessionRepository.hasToken) {
                _state.value = SessionUiState.LoggedOut
            } else {
                sessionRepository.restore().onFailure {
                    sessionRepository.logout()
                    _state.value = SessionUiState.LoggedOut
                }
            }
        }
    }

    fun logout() {
        sessionRepository.logout()
        _state.value = SessionUiState.LoggedOut
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer { MainViewModel(container.sessionRepository) }
        }
    }
}
