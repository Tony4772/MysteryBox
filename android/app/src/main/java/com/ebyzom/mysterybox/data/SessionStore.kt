package com.ebyzom.mysterybox.data

import android.content.Context

// Token en SharedPreferences simple; en produccion migrar a EncryptedSharedPreferences.
class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("mysterybox_session", Context.MODE_PRIVATE)

    var token: String? = prefs.getString(KEY_TOKEN, null)
        private set

    fun save(token: String) {
        this.token = token
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun clear() {
        token = null
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    private companion object {
        const val KEY_TOKEN = "token"
    }
}
