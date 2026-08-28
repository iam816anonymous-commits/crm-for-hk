export interface TranscriptionResult {
  providerName: string;
  modelName: string;
  transcriptText: string;
  confidenceScore: number;
  durationSeconds?: number;
  rawResponse?: any;
}

export interface SpeechToTextProvider {
  readonly name: string;
  readonly model: string;
  transcribeAudio(audioBuffer: Buffer, filename: string, mimeType?: string): Promise<TranscriptionResult>;
}
