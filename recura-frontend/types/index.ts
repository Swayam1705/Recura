export interface PatientData {
  age: number;
  tumorSize: number;
  lymphNodes: number;
  estrogenReceptor: "positive" | "negative";
  progesteroneReceptor: "positive" | "negative";
  her2Status: "positive" | "negative";
  grade: 1 | 2 | 3;
}

export interface ShapValue {
  feature: string;
  value: number;
  impact: number;
  direction: "positive" | "negative";
}

export interface LimeFeature {
  name: string;
  weight: number;
  condition: string;
}

export interface LimeExplanation {
  features: LimeFeature[];
  prediction: number;
  intercept: number;
}

export interface PredictionResult {
  patientId: string;
  recurrenceProbability: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  shapValues: ShapValue[];
  limeExplanation: LimeExplanation;
  timestamp: string;
  modelVersion: string;
}

export interface ClinicalNote {
  rawText: string;
  extractedData: Partial<PatientData>;
  confidence: Record<string, number>;
}

export interface BatchPrediction {
  fileName: string;
  totalRecords: number;
  processed: number;
  results: PredictionResult[];
  status: "pending" | "processing" | "completed" | "error";
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "doctor" | "admin";
  hospital: string;
}
