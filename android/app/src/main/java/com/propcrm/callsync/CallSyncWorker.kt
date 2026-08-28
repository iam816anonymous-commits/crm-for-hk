package com.propcrm.callsync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class CallSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    override suspend fun doWork(): Result {
        val serverUrl = inputData.getString("SERVER_URL") ?: "https://app.propcrm.internal/api/calls/log"
        val bearerToken = inputData.getString("BEARER_TOKEN") ?: ""
        val devicePhoneNumber = inputData.getString("DEVICE_PHONE") ?: "+919999999999"

        val prefs = applicationContext.getSharedPreferences("propcrm_sync_prefs", Context.MODE_PRIVATE)
        val syncedSet = prefs.getStringSet("synced_sids", mutableSetOf())?.toMutableSet() ?: mutableSetOf()

        val reader = CallLogReader(applicationContext)
        val callList = reader.readRecentCalls(devicePhoneNumber, limit = 50)

        val unSyncedCalls = callList.filter { !syncedSet.contains(it.externalCallSid) }
        if (unSyncedCalls.isEmpty()) {
            return Result.success()
        }

        val newlySynced = mutableSetOf<String>()

        for (call in unSyncedCalls) {
            val jsonPayload = JSONObject().apply {
                put("externalCallSid", call.externalCallSid)
                put("fromNumber", call.fromNumber)
                put("toNumber", call.toNumber)
                put("direction", call.direction)
                put("durationSeconds", call.durationSeconds)
                put("callStatus", call.callStatus)
                put("timestampMs", call.timestampMs)
            }

            val jsonMediaType = "application/json; charset=utf-8".toMediaType()
            val body = jsonPayload.toString().toRequestBody(jsonMediaType)

            val request = Request.Builder()
                .url(serverUrl)
                .addHeader("Authorization", "Bearer $bearerToken")
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()

            try {
                val response = client.newCall(request).execute()
                val code = response.code
                response.close()

                if (code == 200 || code == 201 || code == 409) {
                    newlySynced.add(call.externalCallSid)
                } else if (code >= 500) {
                    // Server error: stop batch upload
                    break
                }
            } catch (e: Exception) {
                return Result.retry()
            }
        }

        syncedSet.addAll(newlySynced)
        prefs.edit().putStringSet("synced_sids", syncedSet).apply()

        return Result.success()
    }
}
