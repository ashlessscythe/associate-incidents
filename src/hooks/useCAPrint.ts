import { Associate, CorrectiveAction } from "@/lib/api";

interface CAPrintData {
  associate: Associate | null;
  correctiveActions: CorrectiveAction[];
  totalCorrectiveActions: number;
  safetyCumulativeCount: number;
}

export const useCAPrint = () => {
  const handlePrint = ({
    associate,
    correctiveActions,
    totalCorrectiveActions,
    safetyCumulativeCount,
  }: CAPrintData) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Corrective Action List - ${associate?.name}</title>
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
            <h1>Corrective Action List for ${associate?.name}</h1>
            <div class="summary">
              <h2>Summary</h2>
              <p><strong>Name:</strong> ${associate?.name || "N/A"}</p>
              <p><strong>Department:</strong> ${
                associate?.department?.name || "N/A"
              }</p>
              <p><strong>Location:</strong> ${
                associate?.location?.name || "N/A"
              }</p>
              <p><strong>Total Corrective Actions:</strong> ${totalCorrectiveActions}</p>
              <p><strong>Cumulative Count (Safety):</strong> ${safetyCumulativeCount}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Level</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${correctiveActions
                  .map(
                    (action) => `
                  <tr>
                    <td>${action.rule.code}</td>
                    <td>${action.rule.type}</td>
                    <td>${
                      new Date(action.date).toISOString().split("T")[0]
                    }</td>
                    <td>Level ${action.level}</td>
                    <td>${action.description}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return handlePrint;
};
