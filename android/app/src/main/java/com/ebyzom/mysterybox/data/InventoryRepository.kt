package com.ebyzom.mysterybox.data

import com.ebyzom.mysterybox.data.remote.ApiService
import com.ebyzom.mysterybox.data.remote.InventoryItemDto
import com.ebyzom.mysterybox.data.remote.InventoryStatsResponse

class InventoryRepository(private val api: ApiService) {
    suspend fun inventory(): Result<List<InventoryItemDto>> =
        apiCall { api.inventory().inventory }

    suspend fun stats(): Result<InventoryStatsResponse> =
        apiCall { api.inventoryStats() }
}
