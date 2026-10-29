package com.ebyzom.mysterybox.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @GET("auth/me")
    suspend fun me(): MeResponse

    @GET("boxes/types")
    suspend fun boxes(): BoxesResponse

    @GET("boxes/types/{id}")
    suspend fun boxDetail(@Path("id") id: Int): BoxDetailResponse

    @POST("boxes/open/{id}")
    suspend fun openBox(@Path("id") id: Int): OpenBoxResponse

    @GET("inventory")
    suspend fun inventory(): InventoryResponse

    @GET("inventory/stats")
    suspend fun inventoryStats(): InventoryStatsResponse
}
