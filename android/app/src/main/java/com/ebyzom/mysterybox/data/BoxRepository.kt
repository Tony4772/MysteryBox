package com.ebyzom.mysterybox.data

import com.ebyzom.mysterybox.data.remote.ApiService
import com.ebyzom.mysterybox.data.remote.BoxDetailResponse
import com.ebyzom.mysterybox.data.remote.BoxDto
import com.ebyzom.mysterybox.data.remote.OpenBoxResponse

class BoxRepository(private val api: ApiService) {
    suspend fun boxes(): Result<List<BoxDto>> =
        apiCall { api.boxes().boxes }

    suspend fun detail(id: Int): Result<BoxDetailResponse> =
        apiCall { api.boxDetail(id) }

    suspend fun open(id: Int): Result<OpenBoxResponse> =
        apiCall { api.openBox(id) }
}
