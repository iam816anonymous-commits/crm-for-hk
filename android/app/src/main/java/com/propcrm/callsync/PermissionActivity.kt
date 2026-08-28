package com.propcrm.callsync

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Transparent Permission Rationale Activity explaining to the user
 * why READ_CALL_LOG permission is required for PropCRM Call Syncing.
 */
class PermissionActivity : AppCompatActivity() {

    private val CALL_LOG_REQUEST_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_permission)

        val explanationText = findViewById<TextView>(R.id.tvExplanation)
        val grantButton = findViewById<Button>(R.id.btnGrantPermission)

        explanationText.text = """
            PropCRM Call Sync Companion Application

            Why does PropCRM request Call Log permission?
            - To match inbound and outbound client call metadata (call duration, timestamp) with your CRM Contacts.
            - To track customer interaction timelines automatically.

            Privacy Guarantee:
            - PropCRM NEVER reads or uploads call audio recordings without explicit consent.
            - PropCRM reads ONLY necessary call metadata (Phone Number, Timestamp, Duration, Direction).
            - Unrelated phone numbers are matched locally and normalized using E.164.
        """.trimIndent()

        grantButton.setOnClickListener {
            requestCallLogPermission()
        }
    }

    private fun requestCallLogPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.READ_CALL_LOG),
                CALL_LOG_REQUEST_CODE
            )
        }
    }
}
