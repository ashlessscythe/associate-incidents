import jsPDF from "jspdf";
import { Occurrence, CorrectiveAction, Associate } from "@/lib/api";

export const generateOccurrenceForm = (
  associate: Associate | null,
  occurrence: Occurrence,
  priorOccurrences: Occurrence[]
) => {
  const doc = new jsPDF();

  // Helper functions
  const drawRect = (x: number, y: number, w: number, h: number) => {
    doc.rect(x, y, w, h);
  };

  const addCell = (
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize = 10,
    align: string = "left"
  ) => {
    doc.setFontSize(fontSize);
    doc.text(text, align === "left" ? x + 2 : x + w - 2, y + h / 2, {
      baseline: "middle",
      align: "left",
    });
    drawRect(x, y, w, h);
  };

  // Add Penske logo (placeholder - replace with actual logo insertion)
  doc.setFontSize(24);
  doc.text("PENSKE", 15, 15);
  drawRect(10, 10, 95, 10);

  // Add header
  doc.setFontSize(16);
  doc.text("Attendance Warning Notice", 157.5, 15, { align: "center" });
  drawRect(105, 10, 95, 10);

  // Main info table
  const startY = 20;
  const colWidth = [70, 50, 40, 30];
  const headers = ["Print Associate Name", "Location", "Department", "Date"];

  headers.forEach((header, i) => {
    let x = 10 + colWidth.slice(0, i).reduce((a, b) => a + b, 0);
    addCell(header, x, startY, colWidth[i], 10);
    if (associate) {
      addCell(
        i === 0
          ? associate.name
          : i === 1
          ? "SITE LOCATION"
          : i === 2
          ? "FLOOR"
          : new Date(occurrence.date).toLocaleDateString(),
        x,
        startY + 10,
        colWidth[i],
        10
      );
    }
  });

  // Notification Options
  const notificationY = startY + 25;
  addCell("Notification Options:", 10, notificationY, 190, 10);

  const options = [
    "( ) Verbal Notice - 4 points",
    "( ) 1st Written Notice - 6 points",
    "( ) 2nd Written Notice - 8 points",
    "( ) Final Written Notice - 9 points",
    "( ) Termination - 10 points",
  ];

  options.forEach((option, i) => {
    addCell(
      option,
      10 + (i % 3) * 63,
      notificationY + 10 + Math.floor(i / 3) * 10,
      63,
      10
    );
  });

  // Reason for Corrective Counseling
  const reasonY = notificationY + 30;
  addCell("Reason for Corrective Counseling", 10, reasonY, 190, 10);
  addCell(
    "( ) CBA Article 11 - Attendance Violation",
    10,
    reasonY + 10,
    190,
    10
  );

  // Describe the misconduct
  const describeY = reasonY + 25;
  addCell(
    "Describe the misconduct (insert facts requested below ):",
    10,
    describeY,
    190,
    10
  );

  const descriptionText = `On ${new Date(
    occurrence.date
  ).toLocaleDateString()} at ${new Date(
    occurrence.date
  ).toLocaleTimeString()}, ${associate?.name} ${occurrence.type.description}`;
  const descriptionLines = doc.splitTextToSize(descriptionText, 186);
  doc.text(descriptionLines, 12, describeY + 15);
  drawRect(10, describeY + 10, 190, 30);

  // Expected Conduct
  const conductY = describeY + 45;
  addCell("Expected Conduct", 10, conductY, 190, 10);

  const conductTableY = conductY + 10;
  addCell("Issue", 10, conductTableY, 30, 10);
  addCell("Expected Associate Conduct & Timeline", 40, conductTableY, 80, 10);
  addCell("Resources/Assistance Provided", 120, conductTableY, 50, 10);
  addCell("Follow up w/ Manager required yes / no", 170, conductTableY, 30, 20);

  addCell("Absenteeism", 10, conductTableY + 10, 30, 30);
  addCell(
    "Attend work as scheduled or assigned, be on time and ready for duty at the start of the assigned shift and work until released",
    40,
    conductTableY + 10,
    80,
    30
  );
  addCell("CBA Art 11 Attendance Policy", 120, conductTableY + 10, 50, 30);
  addCell("No", 170, conductTableY + 30, 30, 10);

  // Continued failure message
  doc.setFontSize(8);
  doc.text(
    "Continued failure to meet expected attendance requirements will be cause for more serious corrective action and lead to termination",
    10,
    conductTableY + 45
  );

  // List Attendance Warning Notices
  const listY = conductTableY + 55;
  addCell(
    "List Attendance Warning Notices from the most recent 12 months:",
    10,
    listY,
    190,
    10
  );

  for (let i = 0; i < 4; i++) {
    const occurrence = priorOccurrences[i] || {};
    addCell(
      `Date: ${
        occurrence.date
          ? new Date(occurrence.date).toLocaleDateString()
          : "___________"
      }`,
      10,
      listY + 10 + i * 10,
      50,
      10
    );
    addCell(
      `Type: ${occurrence.type || "___________"}`,
      60,
      listY + 10 + i * 10,
      50,
      10
    );
    addCell(
      `Point Total: ${occurrence.pointsAtTime || "___________"}`,
      110,
      listY + 10 + i * 10,
      90,
      10
    );
  }

  // Signatures
  const signY = listY + 50;
  addCell("Associate Signature", 10, signY, 95, 10);
  addCell("Date", 105, signY, 95, 10);
  addCell("", 10, signY + 10, 95, 10);
  addCell("", 105, signY + 10, 95, 10);

  addCell("Print Supervisor Name", 10, signY + 20, 95, 10);
  addCell("Supervisor Signature", 105, signY + 20, 95, 10);
  addCell("", 10, signY + 30, 95, 10);
  addCell("Date", 105, signY + 30, 95, 10);

  addCell("Print Witness Name", 10, signY + 40, 95, 10);
  addCell("Witness Signature", 105, signY + 40, 95, 10);
  addCell("", 10, signY + 50, 95, 10);
  addCell("Date", 105, signY + 50, 95, 10);

  // Footer
  doc.setFontSize(8);
  doc.text(
    "By signing, the associate may not acknowledge agreement with the warning, only verification that warning was issued.",
    10,
    280
  );

  // CC section
  doc.text("CC: UAW Representative", 10, 285);
  doc.text("Human Resources", 10, 290);

  // Save the PDF
  doc.save(
    `Attendance_Warning_${associate?.name}_${
      new Date(occurrence.date).toISOString().split("T")[0]
    }.pdf`
  );
};

export const generateCAFormPDF = (
  associate: Associate | null,
  ca: CorrectiveAction
) => {
  const doc = new jsPDF();

  // Helper function to draw a bordered rectangle
  const drawRect = (x: number, y: number, w: number, h: number) => {
    doc.rect(x, y, w, h);
  };

  // Helper function to add a cell with text
  const addCell = (
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize = 10
  ) => {
    doc.setFontSize(fontSize);
    doc.text(text, x + 2, y + h / 2, { baseline: "middle" });
    drawRect(x, y, w, h);
  };

  // Add Penske logo (you'll need to replace this with actual logo addition)
  doc.setFontSize(24);
  doc.text("PENSKE", 15, 15);

  // Add header
  doc.setFontSize(16);
  doc.text("Corrective Action Warning Notice", 105, 15, { align: "center" });

  // Add main table
  const startY = 20;
  const colWidth = 47.5;

  addCell("Print Associate Name", 10, startY, colWidth, 10);
  addCell("Location", 10 + colWidth, startY, colWidth, 10);
  addCell("Department", 10 + colWidth * 2, startY, colWidth, 10);
  addCell("Date", 10 + colWidth * 3, startY, colWidth, 10);

  addCell(associate?.name || "N/A", 10, startY + 10, colWidth, 10);
  addCell("SITE LOCATION", 10 + colWidth, startY + 10, colWidth, 10);
  addCell("FLOOR", 10 + colWidth * 2, startY + 10, colWidth, 10);
  addCell(
    new Date(ca.date).toLocaleDateString(),
    10 + colWidth * 3,
    startY + 10,
    colWidth,
    10
  );

  // Notification Options
  const notificationY = startY + 25;
  addCell(
    "Notification Options (no prior warning notice needed for serious misconduct):",
    10,
    notificationY,
    190,
    10
  );

  const optionsY = notificationY + 10;
  addCell(
    `( ${ca.level === 1 ? "X" : " "} ) 1st Documented Verbal Warning`,
    10,
    optionsY,
    95,
    10
  );
  addCell(
    `( ${ca.level === 2 ? "X" : " "} ) 2nd Written Warning`,
    105,
    optionsY,
    95,
    10
  );
  addCell(
    `( ${ca.level === 3 ? "X" : " "} ) 3rd Final Written Warning`,
    10,
    optionsY + 10,
    95,
    10
  );
  addCell(
    `( ${ca.level === 4 ? "X" : " "} ) 4th Termination`,
    105,
    optionsY + 10,
    95,
    10
  );

  // Reason for Corrective Action
  const reasonY = optionsY + 25;
  addCell(
    "Reason for Corrective Action (mark applicable violation below):",
    10,
    reasonY,
    190,
    10
  );

  addCell("( ) Appendix A", 10, reasonY + 10, 63, 10);
  addCell("( ) Appendix B", 73, reasonY + 10, 63, 10);
  addCell("( ) CBA Violation - Article 9", 136, reasonY + 10, 64, 10);

  // Describe the misconduct
  const describeY = reasonY + 25;
  addCell(
    "Describe the misconduct (insert facts requested below ):",
    10,
    describeY,
    190,
    10
  );

  const descriptionLines = doc.splitTextToSize(ca.description, 186);
  doc.text(descriptionLines, 12, describeY + 15);
  drawRect(10, describeY + 10, 190, 40);

  // Expected Conduct
  const conductY = describeY + 55;
  addCell("Expected Conduct", 10, conductY, 190, 10, 12);

  const conductTableY = conductY + 10;
  addCell("Issue", 10, conductTableY, 40, 10);
  addCell("Expected Associate Conduct & Timeline", 50, conductTableY, 60, 10);
  addCell("Resources/Assistance Provided", 110, conductTableY, 60, 10);
  addCell(
    "Follow up with Manager required yes / no",
    170,
    conductTableY,
    30,
    10
  );

  addCell("Failed to perform as instructed", 10, conductTableY + 10, 40, 10);
  addCell("Perform as instructed", 50, conductTableY + 10, 60, 10);
  addCell(
    "CBA, or associate to seek management assistance unless certain about performance instructions",
    110,
    conductTableY + 10,
    60,
    20
  );
  addCell("No", 170, conductTableY + 10, 30, 20);

  // Continued failure message
  doc.setFontSize(8);
  doc.text(
    "Continued failure to meet expected standard of conduct will be cause for more serious corrective action and lead to termination",
    10,
    conductTableY + 35
  );

  // List Prior Misconduct
  const priorY = conductTableY + 40;
  addCell("List Prior Misconduct:", 10, priorY, 190, 10);

  for (let i = 0; i < 3; i++) {
    addCell("Date: _________", 10, priorY + 10 + i * 10, 50, 10);
    addCell("Type: _________", 60, priorY + 10 + i * 10, 50, 10);
    addCell("Reason(s): _________", 110, priorY + 10 + i * 10, 90, 10);
  }

  // Signatures
  const signY = priorY + 45;
  addCell("Associate Signature", 10, signY, 95, 10);
  addCell("Date", 105, signY, 95, 10);
  addCell("", 10, signY + 10, 95, 10);
  addCell("", 105, signY + 10, 95, 10);

  addCell("Employer Signature", 10, signY + 20, 95, 10);
  addCell("Date", 105, signY + 20, 95, 10);
  addCell("", 10, signY + 30, 95, 10);
  addCell("", 105, signY + 30, 95, 10);

  addCell("Print Employer Name", 10, signY + 40, 190, 10);
  addCell("", 10, signY + 50, 190, 10);

  addCell("Print Witness Name", 10, signY + 60, 95, 10);
  addCell("Date", 105, signY + 60, 95, 10);
  addCell("", 10, signY + 70, 95, 10);
  addCell("", 105, signY + 70, 95, 10);

  // Footer
  doc.setFontSize(8);
  doc.text(
    "By signing, the associate may not acknowledge agreement with the warning, only verification that warning was issued.",
    10,
    280
  );

  // CC section
  doc.text("CC: UAW Representative", 10, 285);
  doc.text("Human Resources", 10, 290);
  doc.text("Labor Relations", 70, 290);
  doc.text("Personnel file", 130, 290);

  // Save the PDF
  doc.save(`Corrective_Action_${associate?.name || "Unknown"}_${ca.id}.pdf`);
};
