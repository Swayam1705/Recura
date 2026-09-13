export interface PredictionResult {
  patientId: string;
  prediction: number;
  recurrenceProbability: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | string;
  status: string;
  shapValues?: Array<{ feature: string; value: any; impact: number; direction: string }>;
  modelVersion?: string;
  timestamp?: string;
}

export function printHtmlContent(title: string, bodyContent: string) {
  // Clean up any existing print iframe
  const existing = document.getElementById("recura-print-iframe");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "recura-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    alert("Unable to open print document.");
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 16px; background: #FFF; font-size: 13px; line-height: 1.5; }
        .card { border: 2px solid #0F766E; border-radius: 12px; padding: 24px; background: #FFF; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 16px; }
        .logo-title { font-size: 22px; font-weight: 800; color: #0F766E; margin: 0; }
        .subtitle { font-size: 12px; color: #64748B; margin: 2px 0 0 0; }
        .meta { font-size: 11px; color: #475569; text-align: right; line-height: 1.4; }
        .box { border: 1px solid #E2E8F0; background: #F8FAFC; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
        .box-green { background: #F0FDF4; border-color: #86EFAC; color: #14532D; }
        .box-yellow { background: #FFFBEB; border-color: #FDE68A; color: #78350F; }
        .box-red { background: #FEF2F2; border-color: #FCA5A5; color: #7F1D1D; }
        h2 { font-size: 15px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { background: #F1F5F9; color: #334155; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #CBD5E1; }
        td { padding: 8px 10px; border: 1px solid #E2E8F0; text-align: left; }
        ul { margin: 6px 0; padding-left: 20px; }
        li { margin-bottom: 4px; }
        .footer { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748B; }
        .sig-box { border-top: 1px solid #94A3B8; width: 200px; padding-top: 6px; }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Print error:", err);
    }
  }, 300);
}

/** 1. LAYMAN PATIENT REPORT - Plain English */
export function generatePatientFriendlyReport(result: PredictionResult, doctorNote?: string, appointment?: string) {
  const prob = (Number(result.recurrenceProbability || 0) * 100).toFixed(1);
  const isHigh = result.riskLevel === "high";
  const isMed = result.riskLevel === "medium";

  const statusBoxClass = isHigh ? "box-red" : isMed ? "box-yellow" : "box-green";
  const statusTitle = isHigh ? "🟢 REQUIRES ATTENTION & DOCTOR REVIEW" : isMed ? "🟡 MILD ELEVATION — MONITOR CLOSELY" : "🟢 ALL CLEAR — RECOVERY STABLE";

  const plainExplanation = isHigh
    ? "Your recovery markers indicate that closer clinical follow-up is necessary. Please share this report with your specialist as soon as possible."
    : isMed
    ? "Your markers show slight variations. This is common during recovery, but routine follow-up with your doctor is recommended."
    : "Your blood markers and symptoms show no current signs of concern. Your post-surgery recovery is progressing as expected.";

  const nextSteps = isHigh
    ? ["Contact your endocrinologist or surgeon to schedule a review.", "Do not miss any upcoming blood tests or thyroid ultrasound scans.", "Report any new throat swelling, voice changes, or swallowing difficulty."]
    : isMed
    ? ["Keep your scheduled follow-up appointments on time.", "Continue monitoring your symptoms at home.", "Discuss your test trends during your next routine consultation."]
    : ["Continue taking any prescribed thyroid hormones as directed.", "Keep your routine 6-month checkup appointment.", "Maintain standard post-surgery wellness monitoring."];

  const body = `
    <div class="card">
      <div class="header">
        <div>
          <h1 class="logo-title">Recura Patient Companion</h1>
          <p class="subtitle">Thyroid Recovery Summary & Guidance</p>
        </div>
        <div class="meta">
          <div><strong>Patient ID:</strong> ${result.patientId}</div>
          <div><strong>Date:</strong> ${new Date(result.timestamp || Date.now()).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="box ${statusBoxClass}">
        <div style="font-size: 16px; font-weight: 800;">${statusTitle}</div>
        <p style="margin: 6px 0 0; font-size: 13px;">${plainExplanation}</p>
        <p style="margin: 8px 0 0; font-size: 12px; font-weight: bold;">
          Estimated Recurrence Concern: ${prob}%
        </p>
      </div>

      <h2>What This Means for You</h2>
      <div class="box">
        <p style="margin: 0;">
          This summary translates your clinical data into clear terms. It provides guidance for your ongoing recovery and helps you communicate with your care team.
        </p>
      </div>

      <h2>Recommended Next Steps</h2>
      <ul>
        ${nextSteps.map(s => `<li>${s}</li>`).join('')}
      </ul>

      <h2>Doctor Notes & Instructions</h2>
      <div class="box box-green">
        <p style="margin: 0; font-style: italic;">"${doctorNote || "Your physician will review these results and confirm if any treatment adjustments are needed."}"</p>
        ${appointment ? `<div style="margin-top: 8px; font-weight: bold; color: #1E40AF;">Follow-up Appointment: ${appointment}</div>` : ""}
      </div>

      <div class="footer">
        <div class="sig-box">Patient Personal Copy</div>
        <div class="sig-box" style="text-align: right;">Recura Patient Support System</div>
      </div>
    </div>
  `;

  printHtmlContent(`Patient_Report_${result.patientId}`, body);
}

/** 2. CLINICAL DOCTOR REPORT - Doctor / Medical Terminology */
export function generateDoctorClinicalReport(result: PredictionResult, patientInput?: any, doctorNote?: string) {
  const prob = (Number(result.recurrenceProbability || 0) * 100).toFixed(1);
  const conf = (Number(result.confidence || 0) * 100).toFixed(1);
  const isHigh = result.riskLevel === "high";
  const isMed = result.riskLevel === "medium";

  const statusBoxClass = isHigh ? "box-red" : isMed ? "box-yellow" : "box-green";
  
  const clinicalMeaning = (feature: string, value: any, direction: string) => {
    const f = (feature || "").toLowerCase();
    const dir = direction === "positive" ? "elevates risk profile" : "supports favorable prognosis";
    if (f.includes("response")) return `Treatment response categorized as "${value}" ${dir}.`;
    if (f.includes("risk")) return `ATA risk category evaluated as "${value}" ${dir}.`;
    if (f === "t" || f.includes("t stage")) return `Tumor classification (${value}) ${dir} based on primary lesion extent.`;
    if (f === "n" || f.includes("n stage")) return `Nodal staging (${value}) ${dir} regarding regional lymphatic spread.`;
    if (f.includes("physical")) return `Physical examination finding ("${value}") ${dir}.`;
    if (f.includes("pathology")) return `Histopathological variant ("${value}") ${dir}.`;
    return `${feature} (${value}) ${dir}.`;
  };

  const shapRows = (result.shapValues || []).map(s => `
    <tr>
      <td style="font-weight: bold;">${s.feature}</td>
      <td>${s.value}</td>
      <td style="color: ${s.direction === 'positive' ? '#DC2626' : '#059669'}; font-weight: bold;">
        ${clinicalMeaning(s.feature, s.value, s.direction)}
      </td>
    </tr>
  `).join('');

  const inputTable = patientInput ? `
    <h2>Submitted Clinical Parameters</h2>
    <table>
      <thead>
        <tr>
          <th>Age</th>
          <th>Pathology</th>
          <th>T Stage</th>
          <th>N Stage</th>
          <th>ATA Risk</th>
          <th>Response</th>
          <th>Physical Exam</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${patientInput.Age || 'N/A'}</td>
          <td>${patientInput.Pathology || 'N/A'}</td>
          <td>${patientInput.T || 'N/A'}</td>
          <td>${patientInput.N || 'N/A'}</td>
          <td>${patientInput.Risk || 'N/A'}</td>
          <td>${patientInput.Response || 'N/A'}</td>
          <td>${patientInput.Physical_Examination || 'N/A'}</td>
        </tr>
      </tbody>
    </table>
  ` : '';

  const body = `
    <div class="card">
      <div class="header">
        <div>
          <h1 class="logo-title">Recura Decision Support</h1>
          <p class="subtitle">Thyroid Carcinoma Recurrence Surveillance Assessment</p>
        </div>
        <div class="meta">
          <div><strong>Patient ID:</strong> ${result.patientId}</div>
          <div><strong>Date:</strong> ${new Date(result.timestamp || Date.now()).toLocaleString()}</div>
          <div><strong>Model Version:</strong> ${result.modelVersion || "Deep 1D-CNN v4.1"}</div>
        </div>
      </div>

      <div class="box ${statusBoxClass}">
        <div style="font-size: 16px; font-weight: 800;">CLINICAL STATUS: ${result.status.toUpperCase()}</div>
        <p style="margin: 4px 0 0; font-size: 13px;">
          Calculated Recurrence Probability: <strong>${prob}%</strong> · Confidence Interval: <strong>${conf}%</strong>
        </p>
      </div>

      ${inputTable}

      <h2>Clinically Significant Parameters & Risk Factors</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Patient Value</th>
            <th>Surveillance & Clinical Interpretation</th>
          </tr>
        </thead>
        <tbody>
          ${shapRows || `<tr><td colspan="3">No specific driver metrics recorded.</td></tr>`}
        </tbody>
      </table>

      <h2>Clinician Management Recommendations</h2>
      <div class="box">
        <p style="margin: 0; font-size: 13px; font-weight: 500;">
          "${doctorNote || "Correlate with serum Thyroglobulin (Tg/TgAB) serial trends and neck ultrasound imaging."}"
        </p>
      </div>

      <div class="footer">
        <div class="sig-box">Attending Physician Signature</div>
        <div class="sig-box" style="text-align: right;">Recura Clinical AI Engine</div>
      </div>
    </div>
  `;

  printHtmlContent(`Clinical_Report_${result.patientId}`, body);
}

export function generateReport(result: PredictionResult, patientInput?: any) {
  generateDoctorClinicalReport(result, patientInput);
}
