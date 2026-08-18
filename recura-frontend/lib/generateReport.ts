import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export interface ShapValue {
  feature: string;
  value: string | number;
  impact: number;
  direction: "positive" | "negative";
}

export interface PredictionResult {
  patientId: string;
  prediction: number;
  recurrenceProbability: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  status: string;
  shapValues: ShapValue[];
  modelVersion: string;
  timestamp: string;
}

export interface PatientInput {
  Age: number;
  Response: string;
  Physical_Examination: string;
  T: string;
  N: string;
  Risk: string;
  Pathology: string;
}

// ══════════════════════════════════════════════════════════════
//  CLINICAL INTERPRETATION HELPERS
// ══════════════════════════════════════════════════════════════

function getFactorStrength(impact: number): { label: string; color: [number, number, number] } {
  const abs = Math.abs(impact);
  if (abs >= 0.20) return { label: "Very Strong", color: [220, 38, 38] };
  if (abs >= 0.12) return { label: "Strong", color: [234, 88, 12] };
  if (abs >= 0.06) return { label: "Moderate", color: [234, 179, 8] };
  return { label: "Mild", color: [107, 114, 128] };
}

function getClinicalExplanation(feature: string, value: string | number): string {
  const explanations: Record<string, Record<string, string>> = {
    Response: {
      "Excellent": "Excellent response - no biochemical or structural evidence of disease",
      "Indeterminate": "Non-specific findings that could be benign or represent residual disease",
      "Biochemical Incomplete": "Abnormal thyroglobulin levels without structural disease evidence",
      "Structural Incomplete": "Persistent or newly identified locoregional or distant metastases",
    },
    Risk: {
      "Low": "ATA low-risk category - favorable prognostic features",
      "Intermediate": "ATA intermediate-risk - mixed prognostic indicators",
      "High": "ATA high-risk category - aggressive disease features present",
    },
    T: {
      "T1a": "Very small tumor (<1 cm), confined to thyroid",
      "T1b": "Small tumor (1-2 cm), confined to thyroid",
      "T2": "Medium tumor (2-4 cm), confined to thyroid",
      "T3a": "Large tumor (>4 cm), still confined to thyroid",
      "T3b": "Gross extrathyroidal extension into strap muscles",
      "T4a": "Moderately advanced - invades subcutaneous tissues, larynx, trachea",
      "T4b": "Very advanced - invades prevertebral fascia or encases vessels",
    },
    N: {
      "N0": "No regional lymph node metastasis",
      "N1a": "Metastasis to Level VI (central compartment) nodes",
      "N1b": "Metastasis to lateral neck or retropharyngeal nodes",
    },
    Physical_Examination: {
      "Normal": "Unremarkable physical examination",
      "Single nodular goiter-left": "Solitary left thyroid nodule palpated",
      "Single nodular goiter-right": "Solitary right thyroid nodule palpated",
      "Multinodular goiter": "Multiple thyroid nodules - increased surveillance warranted",
      "Diffuse goiter": "Diffuse thyroid enlargement",
    },
    Pathology: {
      "Papillary": "Papillary carcinoma - most common, generally favorable prognosis",
      "Follicular": "Follicular carcinoma - hematogenous spread pattern",
      "Micropapillary": "Papillary microcarcinoma (<1 cm) - usually indolent",
      "Hurthel cell": "Hurthle cell carcinoma - more aggressive variant",
    },
  };
  const featureKey = feature.replace(/\s+/g, "_");
  return explanations[featureKey]?.[String(value)] ??
         explanations[feature]?.[String(value)] ??
         `${feature}: ${value}`;
}

function getAgeExplanation(age: number): string {
  if (age < 45) return `Young patient (${age}y) - typically better prognosis`;
  if (age < 55) return `Middle-aged patient (${age}y) - standard risk stratification applies`;
  if (age < 65) return `Age ${age}y - recurrence risk begins to elevate`;
  return `Elderly patient (${age}y) - significantly elevated recurrence risk`;
}

function getRiskStatement(prob: number, level: string): string {
  const pct = (prob * 100).toFixed(0);
  if (level === "high") {
    return `This patient has a ${pct}% probability of thyroid cancer recurrence. This exceeds the clinical threshold for urgent intervention.`;
  }
  if (level === "medium") {
    return `This patient has a ${pct}% probability of thyroid cancer recurrence, warranting enhanced surveillance beyond routine follow-up.`;
  }
  return `This patient has a ${pct}% probability of thyroid cancer recurrence, consistent with a favorable prognosis under standard monitoring.`;
}

function getActionPlan(level: string): { urgency: string; actions: string[] } {
  if (level === "high") {
    return {
      urgency: "URGENT - Action required within 1-2 weeks",
      actions: [
        "Refer to endocrine oncology for multidisciplinary review within 48-72 hours",
        "Order neck ultrasound with FNA of suspicious nodes if identified",
        "Obtain serum thyroglobulin, anti-Tg antibodies, and TSH",
        "Consider whole-body iodine scan and/or FDG-PET/CT",
        "Evaluate for additional radioactive iodine (RAI) therapy candidacy",
        "Discuss findings and treatment options with patient and family",
        "Schedule follow-up in 4-6 weeks with imaging and lab results",
      ],
    };
  }
  if (level === "medium") {
    return {
      urgency: "Enhanced Surveillance - Action within 4-8 weeks",
      actions: [
        "Neck ultrasound within 3 months",
        "Serum thyroglobulin and anti-Tg antibodies every 3-6 months",
        "TSH suppression therapy review with endocrinology",
        "Patient education on recurrence warning signs (neck lump, dysphagia)",
        "Follow-up appointment in 3 months",
        "Document risk factors in high-surveillance registry",
      ],
    };
  }
  return {
    urgency: "Routine Follow-up - Annual monitoring appropriate",
    actions: [
      "Annual neck examination and thyroid ultrasound",
      "Serum thyroglobulin and TSH every 6-12 months",
      "Maintain current TSH suppression regimen",
      "Continue standard patient education",
      "Next follow-up in 12 months",
    ],
  };
}

// ══════════════════════════════════════════════════════════════
//  MAIN REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generateClinicalReport(
  patient: PatientInput,
  result: PredictionResult,
  shapChartElementId?: string,
  includeTechnical: boolean = false
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  HEADER
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RECURA", margin, 17);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thyroid Cancer Recurrence Risk Assessment", margin, 24);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    includeTechnical ? "CLINICAL REPORT + APPENDIX" : "CLINICAL REPORT",
    pageWidth - margin,
    14,
    { align: "right" }
  );
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date(result.timestamp).toLocaleString()}`,
    pageWidth - margin,
    20,
    { align: "right" }
  );
  doc.text(
    `Report ID: RPT-${Date.now().toString(36).toUpperCase()}`,
    pageWidth - margin,
    26,
    { align: "right" }
  );

  yPos = 48;

  // ══════════════════════════════════════════════════════════════
  //  RISK BANNER
  // ══════════════════════════════════════════════════════════════
  const riskColors: Record<string, [number, number, number]> = {
    low: [34, 197, 94],
    medium: [234, 179, 8],
    high: [239, 68, 68],
  };
  const [r, g, b] = riskColors[result.riskLevel] ?? [128, 128, 128];

  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, yPos, contentWidth, 32, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RECURRENCE RISK ASSESSMENT", pageWidth / 2, yPos + 9, { align: "center" });

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${result.riskLevel.toUpperCase()} RISK`,
    pageWidth / 2,
    yPos + 22,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${(result.recurrenceProbability * 100).toFixed(1)}% probability of recurrence`,
    pageWidth / 2,
    yPos + 28,
    { align: "center" }
  );

  yPos += 40;

  // Clinical statement
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, "F");
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(2);
  doc.line(margin, yPos, margin, yPos + 22);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const statement = getRiskStatement(result.recurrenceProbability, result.riskLevel);
  const statementLines = doc.splitTextToSize(statement, contentWidth - 12);
  doc.text(statementLines, margin + 6, yPos + 9);

  yPos += 32;

  // ══════════════════════════════════════════════════════════════
  //  SECTION 1: PATIENT SUMMARY
  // ══════════════════════════════════════════════════════════════
  yPos = drawSectionHeader(doc, "PATIENT SUMMARY", margin, yPos, pageWidth);
  yPos += 4;

  const patientFields: [string, string][] = [
    ["Patient ID", result.patientId],
    ["Age", `${patient.Age} years`],
    ["Pathology", getClinicalExplanation("Pathology", patient.Pathology).split("-")[0].trim()],
    ["ATA Risk Category", `${patient.Risk} Risk`],
    ["T Stage", patient.T],
    ["N Stage", patient.N],
    ["Treatment Response", patient.Response],
    ["Physical Examination", patient.Physical_Examination],
  ];

  const rowHeight = 9;
  const colWidth = contentWidth / 2;

  patientFields.forEach((field, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xOffset = col === 0 ? margin : margin + colWidth;
    const rowY = yPos + row * rowHeight;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text(field[0].toUpperCase(), xOffset, rowY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(field[1], xOffset, rowY + 4.5);
  });

  yPos += Math.ceil(patientFields.length / 2) * rowHeight + 10;

  // ══════════════════════════════════════════════════════════════
  //  SECTION 2: KEY CLINICAL FINDINGS
  // ══════════════════════════════════════════════════════════════
  checkPageBreak(20);
  yPos = drawSectionHeader(doc, "KEY CLINICAL FINDINGS", margin, yPos, pageWidth);
  yPos += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Top factors influencing this assessment (ranked by clinical significance):",
    margin,
    yPos
  );
  yPos += 8;

  const topFactors = [...result.shapValues]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  const cardHeight = 22;
  const cardGap = 3;

  topFactors.forEach((factor, i) => {
    checkPageBreak(cardHeight + cardGap);

    const strength = getFactorStrength(factor.impact);
    const isRiskFactor = factor.direction === "positive";
    const iconColor: [number, number, number] = isRiskFactor ? [220, 38, 38] : [22, 163, 74];

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, yPos, contentWidth, cardHeight, 2, 2, "F");

    doc.setFillColor(...iconColor);
    doc.rect(margin, yPos, 3, cardHeight, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text(`#${i + 1}`, margin + 8, yPos + 9);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    const featureName = factor.feature === "Physical Examination"
      ? "Physical Examination"
      : factor.feature === "Response"
      ? "Treatment Response"
      : factor.feature === "Risk"
      ? "ATA Risk Category"
      : factor.feature === "T"
      ? "T Stage (Tumor)"
      : factor.feature === "N"
      ? "N Stage (Nodes)"
      : factor.feature;
    doc.text(featureName, margin + 20, yPos + 9);

    const badgeWidth = 32;
    const badgeX = pageWidth - margin - badgeWidth - 4;
    doc.setFillColor(...strength.color);
    doc.roundedRect(badgeX, yPos + 4, badgeWidth, 6, 1.5, 1.5, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(
      strength.label.toUpperCase(),
      badgeX + badgeWidth / 2,
      yPos + 8,
      { align: "center" }
    );

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...iconColor);
    const dirText = isRiskFactor ? "INCREASES RISK" : "PROTECTIVE FACTOR";
    doc.text(dirText, badgeX + badgeWidth / 2, yPos + 14, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const explanation = factor.feature === "Age"
      ? getAgeExplanation(Number(factor.value))
      : getClinicalExplanation(factor.feature, factor.value);
    const explLines = doc.splitTextToSize(explanation, contentWidth - 55);
    doc.text(explLines[0] || "", margin + 20, yPos + 17);

    yPos += cardHeight + cardGap;
  });

  yPos += 8;

  // ══════════════════════════════════════════════════════════════
  //  SECTION 3: CLINICAL ACTION PLAN
  // ══════════════════════════════════════════════════════════════
  checkPageBreak(50);
  yPos = drawSectionHeader(doc, "RECOMMENDED CLINICAL ACTIONS", margin, yPos, pageWidth);
  yPos += 6;

  const actionPlan = getActionPlan(result.riskLevel);

  const urgencyColor: [number, number, number] = result.riskLevel === "high"
    ? [239, 68, 68]
    : result.riskLevel === "medium"
    ? [234, 179, 8]
    : [34, 197, 94];

  doc.setFillColor(...urgencyColor);
  doc.roundedRect(margin, yPos, contentWidth, 11, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(actionPlan.urgency, pageWidth / 2, yPos + 7, { align: "center" });

  yPos += 16;

  actionPlan.actions.forEach((action) => {
    checkPageBreak(10);

    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, 4, 4);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const actionLines = doc.splitTextToSize(action, contentWidth - 10);
    doc.text(actionLines, margin + 7, yPos + 3);

    yPos += Math.max(actionLines.length * 4.5, 5) + 4;
  });

  yPos += 10;

  // ══════════════════════════════════════════════════════════════
  //  SECTION 4: TECHNICAL APPENDIX (OPTIONAL)
  // ══════════════════════════════════════════════════════════════
  if (includeTechnical) {
    checkPageBreak(80);
    yPos = drawSectionHeader(doc, "TECHNICAL APPENDIX", margin, yPos, pageWidth);
    yPos += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(107, 114, 128);
    doc.text(
      "For audit, research, and ML validation purposes:",
      margin,
      yPos
    );
    yPos += 8;

    // Model metadata
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, "F");

    const metaLeft = margin + 6;
    const metaRight = margin + contentWidth / 2 + 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("MODEL", metaLeft, yPos + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(result.modelVersion, metaLeft, yPos + 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("MODEL CONFIDENCE", metaLeft, yPos + 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(`${(result.confidence * 100).toFixed(1)}%`, metaLeft, yPos + 21);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("METHOD", metaRight, yPos + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text("Deep 1D-CNN + Clinical Calibration", metaRight, yPos + 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("EXPLAINABILITY", metaRight, yPos + 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text("SHAP (Shapley Additive Values)", metaRight, yPos + 21);

    yPos += 30;

    // SHAP table
    if (result.shapValues && result.shapValues.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Feature", "Patient Value", "SHAP Score", "Effect"]],
        body: result.shapValues.map((f) => [
          f.feature,
          String(f.value),
          f.impact.toFixed(3),
          f.direction === "positive" ? "Risk Factor" : "Protective",
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [107, 114, 128],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: "auto", halign: "center" },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  DISCLAIMER
  // ══════════════════════════════════════════════════════════════
  checkPageBreak(30);

  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, "F");
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(161, 98, 7);
  doc.text("CLINICAL DECISION SUPPORT DISCLAIMER", margin + 5, yPos + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 70, 0);
  const disclaimer =
    "This report is generated by an AI clinical decision support tool. It is intended to augment - not replace - clinical judgment. All predictions must be interpreted in the context of the complete patient history, physical examination, imaging, and laboratory findings. The treating physician retains full responsibility for all clinical decisions.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(disclaimerLines, margin + 5, yPos + 12);

  yPos += 32;

  // ══════════════════════════════════════════════════════════════
  //  SIGNATURES
  // ══════════════════════════════════════════════════════════════
  checkPageBreak(30);

  const sigGap = 12;
  const sigBoxWidth = (contentWidth - sigGap) / 2;

  ["Reviewing Physician", "Consulting Endocrinologist"].forEach((title, i) => {
    const xStart = margin + i * (sigBoxWidth + sigGap);

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.4);
    doc.line(xStart, yPos + 14, xStart + sigBoxWidth, yPos + 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title, xStart + sigBoxWidth / 2, yPos + 19, { align: "center" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Signature / Date / License #",
      xStart + sigBoxWidth / 2,
      yPos + 23,
      { align: "center" }
    );
  });

  // ══════════════════════════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 118, 110);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Recura Clinical Platform  |  Confidential Medical Report",
      pageWidth / 2,
      pageHeight - 4,
      { align: "center" }
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 4, {
      align: "right",
    });
    doc.text("recura.health", margin, pageHeight - 4);
  }

  const suffix = includeTechnical ? "_full" : "";
  const fileName = `Recura_${result.patientId}_${new Date().toISOString().split("T")[0]}${suffix}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ══════════════════════════════════════════════════════════════
//  SECTION HEADER HELPER
// ══════════════════════════════════════════════════════════════
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  margin: number,
  yPos: number,
  pageWidth: number
): number {
  doc.setFillColor(15, 118, 110);
  doc.rect(margin, yPos, 4, 7, "F");

  doc.setTextColor(15, 118, 110);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin + 8, yPos + 5.5);

  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.4);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  return yPos + 14;
}