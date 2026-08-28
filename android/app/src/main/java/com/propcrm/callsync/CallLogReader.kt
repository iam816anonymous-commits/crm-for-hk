package com.propcrm.callsync

import android.content.Context
import android.provider.CallLog
import java.security.MessageDigest

data class CallMetadata(
    val externalCallSid: String,
    val fromNumber: String,
    val toNumber: String,
    val direction: String,
    val durationSeconds: Int,
    val callStatus: String,
    val timestampMs: Long
)

class CallLogReader(private val context: Context) {

    fun readRecentCalls(devicePhoneNumber: String, limit: Int = 50): List<CallMetadata> {
        val calls = mutableListOf<CallMetadata>()
        val projection = arrayOf(
            CallLog.Calls._ID,
            CallLog.Calls.NUMBER,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
            CallLog.Calls.DURATION
        )

        val cursor = context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            projection,
            null,
            null,
            "${CallLog.Calls.DATE} DESC LIMIT $limit"
        )

        cursor?.use {
            val idIndex = it.getColumnIndex(CallLog.Calls._ID)
            val numberIndex = it.getColumnIndex(CallLog.Calls.NUMBER)
            val typeIndex = it.getColumnIndex(CallLog.Calls.TYPE)
            val dateIndex = it.getColumnIndex(CallLog.Calls.DATE)
            val durationIndex = it.getColumnIndex(CallLog.Calls.DURATION)

            while (it.moveToNext()) {
                val rawId = if (idIndex != -1) it.getString(idIndex) else ""
                val rawNumber = if (numberIndex != -1) it.getString(numberIndex) else ""
                val type = if (typeIndex != -1) it.getInt(typeIndex) else -1
                val dateMs = if (dateIndex != -1) it.getLong(dateIndex) else 0L
                val duration = if (durationIndex != -1) it.getInt(durationIndex) else 0

                val normalizedNumber = PhoneNumberNormalizer.normalize(rawNumber)
                if (normalizedNumber.isEmpty()) continue

                val (direction, callStatus) = when (type) {
                    CallLog.Calls.INCOMING_TYPE -> "INBOUND" to "COMPLETED"
                    CallLog.Calls.OUTGOING_TYPE -> "OUTBOUND" to "COMPLETED"
                    CallLog.Calls.MISSED_TYPE -> "INBOUND" to "MISSED"
                    CallLog.Calls.REJECTED_TYPE -> "INBOUND" to "NO_ANSWER"
                    else -> "INBOUND" to "COMPLETED"
                }

                val fromNumber = if (direction == "INBOUND") normalizedNumber else devicePhoneNumber
                val toNumber = if (direction == "OUTBOUND") normalizedNumber else devicePhoneNumber

                // Compute deterministic unique externalCallSid to prevent duplicate ingestion
                val rawSid = "android_${rawId}_${normalizedNumber}_${dateMs}"
                val externalCallSid = hashString(rawSid)

                calls.add(
                    CallMetadata(
                        externalCallSid = externalCallSid,
                        fromNumber = fromNumber,
                        toNumber = toNumber,
                        direction = direction,
                        durationSeconds = duration,
                        callStatus = callStatus,
                        timestampMs = dateMs
                    )
                )
            }
        }
        return calls
    }

    private fun hashString(input: String): String {
        return MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray())
            .fold("") { str, it -> str + "%02x".format(it) }
    }
}
