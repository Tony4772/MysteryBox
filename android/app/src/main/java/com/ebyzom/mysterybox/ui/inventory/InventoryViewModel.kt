package com.ebyzom.mysterybox.ui.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ebyzom.mysterybox.data.InventoryRepository
import com.ebyzom.mysterybox.data.remote.InventoryItemDto
import com.ebyzom.mysterybox.data.remote.RarityCountDto
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class InventoryUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<InventoryItemDto> = emptyList(),
    val total: Int = 0,
    val byRarity: List<RarityCountDto> = emptyList(),
)

class InventoryViewModel(private val repository: InventoryRepository) : ViewModel() {
    private val _state = MutableStateFlow(InventoryUiState())
    val state = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            val inventoryDeferred = async { repository.inventory() }
            val statsDeferred = async { repository.stats() }

            val inventoryResult = inventoryDeferred.await()
            val statsResult = statsDeferred.await()

            val failure = inventoryResult.exceptionOrNull() ?: statsResult.exceptionOrNull()
            if (failure != null) {
                _state.value = InventoryUiState(loading = false, error = failure.message)
            } else {
                val stats = statsResult.getOrNull()
                _state.value = InventoryUiState(
                    loading = false,
                    items = inventoryResult.getOrDefault(emptyList()),
                    total = stats?.total ?: 0,
                    byRarity = stats?.byRarity ?: emptyList(),
                )
            }
        }
    }

    companion object {
        fun factory(repository: InventoryRepository): ViewModelProvider.Factory = viewModelFactory {
            initializer { InventoryViewModel(repository) }
        }
    }
}
