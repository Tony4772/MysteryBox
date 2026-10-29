package com.ebyzom.mysterybox.ui.boxes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ebyzom.mysterybox.data.BoxRepository
import com.ebyzom.mysterybox.data.remote.BoxDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BoxesUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val boxes: List<BoxDto> = emptyList(),
)

class BoxesViewModel(private val repository: BoxRepository) : ViewModel() {
    private val _state = MutableStateFlow(BoxesUiState())
    val state = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            repository.boxes()
                .onSuccess { boxes ->
                    _state.value = BoxesUiState(loading = false, boxes = boxes)
                }
                .onFailure { error ->
                    _state.value = BoxesUiState(loading = false, error = error.message)
                }
        }
    }

    companion object {
        fun factory(repository: BoxRepository): ViewModelProvider.Factory = viewModelFactory {
            initializer { BoxesViewModel(repository) }
        }
    }
}
