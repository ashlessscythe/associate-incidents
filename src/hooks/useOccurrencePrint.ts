import { AssociateInfo, Occurrence } from "@/lib/api";

interface PrintData {
  associateInfo: AssociateInfo;
  /** Sum of counted occurrence rows (same basis as occurrencePoints from API). */
  occurrenceSubtotal: number;
  pointsAdjustment: number;
  totalPoints: number;
  notificationLevel: string;
  designation: string;
  /** Counted toward current total (rolling window + optional effective date). */
  filteredCountedOccurrences: Occurrence[];
  /** In rolling window but before effective date — not in subtotal/total. */
  filteredPriorOccurrences: Occurrence[];
  /** Before rolling 12-month window — excluded from totals (reference only). */
  filteredOutsideOccurrences?: Occurrence[];
}

export const useOccurrencePrint = () => {
  const handlePrint = ({
    associateInfo,
    occurrenceSubtotal,
    pointsAdjustment,
    totalPoints,
    notificationLevel,
    designation,
    filteredCountedOccurrences,
    filteredPriorOccurrences,
    filteredOutsideOccurrences = [],
  }: PrintData) => {
    const adjStr =
      pointsAdjustment > 0
        ? `+${pointsAdjustment}`
        : String(pointsAdjustment);
    const renderRows = (occurrences: Occurrence[]) =>
      occurrences
        .map(
          (occurrence) => `
                  <tr>
                    <td>${occurrence.type.code}</td>
                    <td>${occurrence.type.description}</td>
                    <td>${
                      new Date(occurrence.date).toISOString().split("T")[0]
                    }</td>
                    <td>${occurrence.notes}</td>
                    <td>${occurrence.type.points}</td>
                  </tr>
                `
        )
        .join("");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Occurrence List - ${associateInfo.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 20px;
                background-color: #fff;
              }
              h1, h2 {
                color: #2c3e50;
                margin-bottom: 10px;
              }
              h1 {
                font-size: 24px;
              }
              h2 {
                font-size: 20px;
                border-bottom: 2px solid #ddd;
                padding-bottom: 5px;
              }
              p {
                margin: 5px 0;
              }
              .summary {
                background-color: #f4f4f9;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 6px;
                margin-bottom: 20px;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                page-break-inside: avoid;
              }
              .summary .note {
                font-size: 12px;
                color: #555;
                margin-top: 8px;
              }
              h2 + table {
                margin-top: 8px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
                font-size: 14px;
              }
              th {
                background-color: #f9fafb;
                font-weight: bold;
                color: #333;
              }
              tbody tr:nth-child(odd) {
                background-color: #f5f5f5;
              }
              tbody tr:hover {
                background-color: #e2e8f0;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
                table {
                  page-break-inside: avoid;
                }
                .summary {
                  page-break-after: avoid;
                }
              }
            </style>
          </head>
          <body>
            <h1>Occurrence List for ${associateInfo.name}</h1>
            <div class="summary">
              <h2>Summary</h2>
              <p><strong>Occurrence subtotal (counted):</strong> ${occurrenceSubtotal}</p>
              <p><strong>Manual adjustment:</strong> ${adjStr}</p>
              <p><strong>Total points (last 12 months):</strong> ${totalPoints}</p>
              <p class="note">Line-item points are raw logged values; the total includes the manual adjustment.</p>
              ${
                associateInfo.resolvedPointTotalsEffectiveDate
                  ? `<p><strong>Cutoff applied (inclusive):</strong> ${new Date(
                      associateInfo.resolvedPointTotalsEffectiveDate
                    )
                      .toISOString()
                      .split("T")[0]}${
                      associateInfo.pointTotalsEffectiveDate
                        ? " (associate override)"
                        : associateInfo.designationPointTotalsEffectiveDate
                          ? " (designation default)"
                          : ""
                    }</p>`
                  : ""
              }
              <p><strong>Current Notification Level:</strong> ${notificationLevel}</p>
              <p><strong>Designation:</strong> ${designation}</p>
            </div>
            <h2>Occurrences counted toward current total</h2>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(filteredCountedOccurrences)}
              </tbody>
            </table>
            ${
              filteredPriorOccurrences.length
                ? `<h2>Prior in rolling window (not counted toward current total)</h2>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(filteredPriorOccurrences)}
              </tbody>
            </table>`
                : ""
            }
            ${
              filteredOutsideOccurrences.length
                ? `<h2>Older than rolling 12-month window (not in totals)</h2>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(filteredOutsideOccurrences)}
              </tbody>
            </table>`
                : ""
            }
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return handlePrint;
};
