# Android Call & Telephony Integration Research

## Executive Summary
This document provides a technical feasibility analysis of capturing phone call logs, metadata, and optional call recordings on Android for the Rental Property CRM / Communication Intelligence System. It covers Android framework APIs, required runtime permissions, Google Play Store restrictions, call recording limitations (Android 9 through 14+), and viable industry alternatives.

---

## 1. Android Call Log Access & Permissions

### 1.1 Standard Android Telephony APIs
Android provides system APIs to access call history metadata through the `CallLog` content provider (`android.provider.CallLog.Calls`).

### 1.2 Required Manifest & Runtime Permissions
To read call history and monitor telephony state changes, an Android application must request:
* `android.permission.READ_CALL_LOG`: Grants access to query the device's call history.
* `android.permission.WRITE_CALL_LOG` (Optional): Allows inserting or modifying call log entries.
* `android.permission.READ_PHONE_STATE`: Allows monitoring call state transitions (`CALL_STATE_IDLE`, `CALL_STATE_RINGING`, `CALL_STATE_OFFHOOK`) via `TelephonyManager` or `TelephonyCallback` (Android 31+).
* `android.permission.PROCESS_OUTGOING_CALLS` (Deprecated in API 29, replaced by `CallRedirectionService` / `CallScreeningService`).

### 1.3 Extracted Metadata Fields
Querying `CallLog.Calls` yields the following structured metadata:
* `NUMBER`: Remote party's phone number (E.164 standard format).
* `TYPE`: Call direction/status (`INCOMING_TYPE`, `OUTGOING_TYPE`, `MISSED_TYPE`, `REJECTED_TYPE`, `VOICEMAIL_TYPE`).
* `DATE`: Call epoch timestamp (milliseconds).
* `DURATION`: Duration of the call in seconds.
* `CACHED_NAME`: Associated contact name from the device address book (if present).
* `GEOCODED_LOCATION`: Geographical location string based on area code (if available).

---

## 2. Google Play Store Policy & Permissions Restrictions

### 2.1 The Google Play Call Log & SMS Permission Policy
Google Play enforces strict restrictions on sensitive permission groups, specifically `CALL_LOG` and `SMS`.

* **Restricted Access Policy**: Google Play **restricts** the use of `READ_CALL_LOG` and `WRITE_CALL_LOG`. An app submitted to the Google Play Store will be **automatically rejected** unless its primary core purpose falls under designated Google Play exception categories.
* **Permitted Core Use Cases**:
  1. Default Phone Handler (App must be chosen by the user as the system-wide default dialer application).
  2. Default SMS Handler.
  3. Default Assistant App / Companion Device Handler.
  4. Specialized enterprise device management apps (distributed via Private Google Play / Enterprise EMM).

### 2.2 Impact on a Rental Property CRM Application
* If the CRM companion mobile app is distributed via the public **Google Play Store**, it **CANNOT** get approval for `READ_CALL_LOG` unless it acts as the user's **Default Phone Handler** (replacing the native Google/Samsung Phone Dialer app).
* **Enterprise Workaround**: If the CRM mobile app is distributed internally via Enterprise Mobility Management (EMM / MDM), sideloading, or Private Google Play to company-owned devices, Google Play Policy enforcement does not apply, allowing direct `READ_CALL_LOG` permission usage.

---

## 3. Technical & Legal Realities of Call Recording on Android

Can call recording realistically be implemented by a normal third-party application on modern Android devices?
**NO. Third-party call recording is technically blocked and restricted on modern Android.**

### 3.1 Historical Evolution of Call Recording Restrictions

#### Android 9.0 (API 28 - Pie)
* **Audio Source Restriction**: Google disabled non-privileged access to the `MediaRecorder.AudioSource.VOICE_CALL` audio stream. Third-party apps lost the ability to capture both sides of a telephone call from hardware audio mixers.

#### Android 10 (API 29) & Android 11 (API 30)
* **Microphone Isolation**: Microphones are silenced for background services during active phone calls. Attempting to record via `MediaRecorder.AudioSource.MIC` during an active call only captures the local device owner's mic (in low volume) and completely misses the remote caller's audio.

#### Android 12 (API 31) & Android 13/14 (API 33/34)
* **Accessibility API Enforcement**: Developers previously used Android's `AccessibilityService` API as a workaround to capture in-call audio streams. In May 2022, Google updated its developer guidelines to explicitly ban the use of `AccessibilityService` for call recording. Apps attempting this are removed from Google Play.

### 3.2 Hardware & System App Exception
System-level phone dialers (e.g., native Google Phone app on Pixel, Samsung Phone app on Galaxy devices, or OEM system apps signed with platform keys) can still record calls because they run with system-level privileges (`CAPTURE_AUDIO_OUTPUT`). Third-party apps **cannot** obtain this privilege.

---

## 4. Supported Alternatives for Call & Audio Capture

Because client-side third-party call recording is unfeasible on Android, the system architecture must adopt supported alternative paradigms:

```
+-------------------------------------------------------------------------+
|                       RECOMMENDED ALTERNATIVES                          |
+-------------------------------------------------------------------------+
|                                                                         |
|  1. VoIP / Cloud Telephony (Twilio / Exotel / Plivo / Asterisk)        |
|     - Business calls routed via Cloud PBX                               |
|     - Dual-channel crystal clear recording & automated webhook         |
|     - Native consent prompt: "This call may be recorded..."             |
|                                                                         |
|  2. User Consent Voice Notes (WhatsApp / App Ingest)                    |
|     - Agents / Customers record WhatsApp audio notes                    |
|     - Uploaded via Cloud API for AI Whisper transcription               |
|                                                                         |
|  3. User-Uploaded Audio Files                                           |
|     - Manual upload of recorded audio files from device storage         |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 4.1 Cloud Telephony / VoIP Providers (Primary Recommendation)
* **Providers**: Twilio, Exotel, Plivo, Amazon Connect, or Asterisk Cloud PBX.
* **Mechanism**: Business calls are placed/received via Cloud PBX numbers or in-app WebRTC SDKs.
* **Benefits**:
  * 100% reliable dual-channel audio recording (Agent channel and Client channel).
  * Programmatic Call Detail Records (CDR) webhooks delivered directly to CRM.
  * Native legal compliance (automated IVR announcement: *"This call is being recorded for quality and training purposes"*).
  * Complete independence from Android OS constraints and Play Store policies.

### 4.2 Voice Notes & In-App Audio Recorders
* **WhatsApp Voice Notes**: Audio files (`.ogg` / `.opus`) sent over WhatsApp Business Cloud API are automatically ingested, stored, and transcribed via OpenAI Whisper / AI extraction pipeline.
* **In-App Dictation / Meeting Summarizer**: Property agents use the CRM mobile app *after* a meeting or phone call to record an audio debrief (voice memo), which is sent to the backend for speech-to-text processing.

### 4.3 Manual Audio File Upload
* If agents use native OEM call recording (e.g., Samsung native call recorder), the CRM app can provide a file picker allowing agents to voluntarily select and upload audio files for AI transcription and CRM mapping.

---

## 5. Feature Categorization Matrix

### SUPPORTED
* Querying native Android call logs (`READ_CALL_LOG`) on enterprise-managed (EMM/MDM) or sideloaded company devices.
* Monitoring real-time phone call status changes (`TelephonyManager` / `TelephonyCallback`).
* Cloud Telephony integration (Twilio/Exotel) for automated call routing, call metadata capture, and cloud audio recording.
* Processing WhatsApp inbound voice notes for transcription and entity extraction.
* In-app audio memo recording (agent dictation post-call).
* Manual user-initiated audio file upload.

### POSSIBLE WITH LIMITATIONS
* **Android Call Log Sync on Google Play Apps**: Only possible if the app is configured and approved as the device's **Default Phone Handler**.
* **OEM Native Recording Upload**: Relies on agents manually picking files generated by built-in system dialers.

### NOT SUPPORTED / SHOULD NOT BE USED
* **Third-Party Call Recording on Android 9+**: Cannot record two-way telephony calls in the background using standard Android APIs.
* **Using Accessibility APIs for Call Recording**: Banned by Google Play policy; results in app removal.
* **Background audio interception during active PSTN calls**: Silenced by Android OS audio framework.

---

## 6. Architecture Recommendations for Telephony Integration

1. **Adopt Cloud Telephony as Core PSTN Channel**: Implement Twilio or Exotel for official property business calls. Webhooks feed real-time call events (caller, duration, timestamp, recording URL) into the CRM backend.
2. **Support Default Phone Handler for Field Agents (Optional Companion App)**: If direct Android call log sync is strictly required, package the Android companion app as a Default Dialer for internal staff distribution (Enterprise APK/EMM).
3. **Voice-to-Text Processing Pipeline**: Route all voice notes (WhatsApp `.opus` files and agent voice memos) through OpenAI Whisper for automatic transcription and CRM entity extraction.
