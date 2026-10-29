package com.ebyzom.mysterybox.ui.boxes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ebyzom.mysterybox.data.BoxRepository
import com.ebyzom.mysterybox.data.SessionRepository
import com.ebyzom.mysterybox.data.remote.BoxDto
import com.ebyzom.mysterybox.data.remote.ItemDto
import com.ebyzom.mysterybox.data.remote.RevealItemDto
import com.ebyzom.mysterybox.data.remote.TierDto
import com.ebyzom.mysterybox.di.AppContainer
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BoxDetailUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val box: BoxDto? = null,
    val tiers: List<TierDto> = emptyList(),
    val items: List<ItemDto> = emptyList(),
    val opening: Boolean = false,
    val reveal: RevealItemDto? = null,
    val message: String? = null,
)

class BoxDetailViewModel(
    private val boxId: Int,
    private val boxRepository: BoxRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(BoxDetailUiState())
    val state = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            boxRepository.detail(boxId)
                .onSuccess { detail ->
                    _state.value = _state.value.copy(
                        loading = false,
                        box = detail.box,
                        tiers = detail.tiers,
                        items = detail.items,
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(loading = false, error = error.message)
                }
        }
    }

    fun open() {
        val current = _state.value
        if (current.opening || current.reveal != null) return
        val box = current.box ?: return

        val credits = sessionRepository.user.value?.credits ?: 0
        if (credits < box.cost) {
            _state.value = current.copy(
                message = "Creditos insuficientes. Recarga tu billetera desde la web por ahora.",
            )
            return
        }

        _state.value = current.copy(opening = true, message = null)
        android.util.Log.d("BoxDetailVM", "open() start boxId=$boxId")
        viewModelScope.launch {
            delay(1200)
            boxRepository.open(boxId)
                .onSuccess { result ->
                    android.util.Log.d("BoxDetailVM", "open() success item=${result.item} newBalance=${result.newBalance}")
                    sessionRepository.updateCredits(result.newBalance)
                    _state.value = _state.value.copy(opening = false, reveal = result.item)
                    android.util.Log.d("BoxDetailVM", "state after success reveal=${_state.value.reveal}")
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(opening = false, message = error.message)
                }
        }
    }

    fun dismissReveal() {
        android.util.Log.d("BoxDetailVM", "dismissReveal()")
        _state.value = _state.value.copy(reveal = null)
    }

    companion object {
        fun factory(boxId: Int, container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                BoxDetailViewModel(
                    boxId = boxId,
                    boxRepository = container.boxRepository,
                    sessionRepository = container.sessionRepository,
                )
            }
        }
    }
}
