package com.ebyzom.mysterybox.data.remote

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String,
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
)

data class UserDto(
    val id: Int,
    val username: String,
    val email: String,
    val credits: Int,
    val role: String,
)

data class AuthResponse(
    val token: String,
    val user: UserDto,
)

data class MeResponse(
    val user: UserDto,
)

data class BoxDto(
    val id: Int,
    val name: String,
    val description: String?,
    val cost: Int,
    val image: String? = null,
    val active: Int? = null,
)

data class TierDto(
    val id: Int,
    val name: String,
    val color: String?,
    val probability: Double,
    @SerializedName("box_type_id") val boxTypeId: Int,
)

data class ItemDto(
    val id: Int,
    val name: String,
    val description: String?,
    val image: String?,
    @SerializedName("rarity_tier_id") val rarityTierId: Int,
)

data class BoxDetailResponse(
    val box: BoxDto,
    val tiers: List<TierDto>,
    val items: List<ItemDto>,
)

data class BoxesResponse(
    val boxes: List<BoxDto>,
)

data class RevealItemDto(
    val id: Int,
    val name: String,
    val description: String?,
    val image: String?,
    val rarity: String,
    val color: String?,
)

data class OpenBoxResponse(
    val item: RevealItemDto,
    val creditsSpent: Int,
    val newBalance: Int,
)

data class InventoryItemDto(
    val id: Int,
    val name: String,
    val description: String?,
    val image: String?,
    val rarity: String,
    val color: String?,
    @SerializedName("box_name") val boxName: String?,
)

data class InventoryResponse(
    val inventory: List<InventoryItemDto>,
)

data class RarityCountDto(
    val rarity: String,
    val color: String?,
    val count: Int,
)

data class InventoryStatsResponse(
    val total: Int,
    @SerializedName("byRarity") val byRarity: List<RarityCountDto>,
)

data class ApiError(
    val error: String?,
)
