package com.propcrm.callsync

object PhoneNumberNormalizer {
    /**
     * E.164 standardization helper for Android call log entries.
     * Sanitizes raw call log number strings into standard +[country_code][number] format.
     */
    fun normalize(phoneRaw: String, defaultCountryCode: String = "+91"): String {
        val trimmed = phoneRaw.trim()
        if (trimmed.isEmpty()) return ""

        // Strip non-digit and non-plus characters
        val digits = trimmed.replace(Regex("[^0-9+]"), "")
        if (digits.isEmpty()) return ""

        if (digits.startsWith("+")) {
            return digits
        }

        // Handle 10-digit national numbers (e.g. India)
        if (digits.length == 10) {
            return "$defaultCountryCode$digits"
        }

        // Handle numbers with leading zero
        if (digits.startsWith("0") && digits.length == 11) {
            return "$defaultCountryCode${digits.substring(1)}"
        }

        return "+$digits"
    }
}
