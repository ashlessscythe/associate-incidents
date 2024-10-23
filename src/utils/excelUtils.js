import XlsxPopulate from "xlsx-populate";
import path from "path";
import fs from "fs/promises";
import os from "os";
import axios from "axios";
import { prisma } from "../server.js";

export async function getTemplate(fileKey, type) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "excel-templates-"));
  const filePath = path.join(tempDir, `${type}.xlsx`);

  try {
    const base_url =
      process.env.BASE_UPLOAD_URL || "https://example.com/urlnotset";
    const response = await axios.get(`${base_url}${fileKey}`, {
      responseType: "arraybuffer",
    });

    await fs.writeFile(filePath, response.data);
    return filePath;
  } catch (error) {
    console.error(`Error downloading template for ${type}:`, error);
    throw error;
  }
}

export async function generateExcelOccurrence(
  associateName,
  location,
  department,
  date,
  occurrences,
  notificationLevel,
  notifications,
  designation
) {
  if (!associateName || !location || !department || !date || !designation) {
    throw new Error("Missing required parameters");
  }

  const templatePath = await getTemplate(
    process.env.OCC_TEMPLATE_KEY,
    "occurrence"
  );
  let workbook;

  try {
    workbook = await XlsxPopulate.fromFileAsync(templatePath);
  } catch (error) {
    console.error("Error loading Excel template:", error);
    throw new Error("Failed to load Excel template");
  }

  const sheet = workbook.sheet(0);

  // Fill in basic information
  sheet.cell("A7").value(associateName);
  sheet.cell("F7").value(location);
  sheet.cell("H7").value(department);
  sheet.cell("J7").value(date);

  // Fetch notification levels directly from the database
  const notificationLevels = await prisma.notificationLevel.findMany({
    where: { designation },
    orderBy: { level: "asc" },
  });

  // Map notification levels to Excel cells
  const levelCells = ["B9", "E9", "H9", "B10", "E10"];
  const mappedLevels = notificationLevels.slice(0, 5).map((level, index) => ({
    text: level.name,
    cell: levelCells[index],
  }));

  // Set notification level
  mappedLevels.forEach((level) => {
    const cellValue =
      level.text === notificationLevel
        ? `(X) ${level.text}`
        : `( ) ${level.text}`;
    sheet.cell(level.cell).value(cellValue);
  });

  // Calculate and set total points
  const totalPoints = occurrences.reduce(
    (sum, occ) => sum + (occ.type?.points || 0),
    0
  );

  // Create misconduct text
  const blurb = `Associate ${associateName} has the following occurrences. Total points: ${totalPoints}\n\n`;
  const misconduct = occurrences
    .map((occ) => {
      const formattedDate = new Date(occ.date).toISOString().split("T")[0];
      return `${formattedDate} ${occ.type?.code || "Unknown"} - ${
        occ.type?.points || 0
      } pts`;
    })
    .join(", ");
  const fullMisconductText = blurb + misconduct;
  sheet.cell("A14").value(fullMisconductText);

  // Fill notifications data
  const notificationCells = [
    { date: "B24", type: "D24", points: "G24" },
    { date: "B25", type: "D25", points: "G25" },
    { date: "B26", type: "D26", points: "G26" },
    { date: "B27", type: "D27", points: "G27" },
  ];

  (notifications || []).slice(0, 4).forEach((notification, index) => {
    if (notification && notification.date) {
      sheet
        .cell(notificationCells[index].date)
        .value(new Date(notification.date).toISOString().split("T")[0]);
      sheet
        .cell(notificationCells[index].type)
        .value(notification.level || "N/A");
      sheet
        .cell(notificationCells[index].points)
        .value(notification.totalPoints || 0);
    }
  });

  let excelBuffer;
  try {
    excelBuffer = await workbook.outputAsync();
  } catch (error) {
    console.error("Error generating Excel buffer:", error);
    throw new Error("Failed to generate Excel file");
  }

  try {
    await fs.unlink(templatePath);
  } catch (error) {
    console.warn("Failed to delete temporary template file:", error);
  }

  return excelBuffer;
}

export async function generateExcelCA(
  associateName,
  location,
  department,
  date,
  correctiveActions,
  notificationLevel
) {
  const templatePath = await getTemplate(process.env.CA_TEMPLATE_KEY, "ca");
  const workbook = await XlsxPopulate.fromFileAsync(templatePath);
  const sheet = workbook.sheet(0);

  sheet.cell("A7").value(associateName);
  sheet.cell("F7").value(location);
  sheet.cell("H7").value(department);
  sheet.cell("J7").value(date);

  const levels = [
    { text: "Coaching Conversation", cell: "B10" },
    { text: "1st Documented Verbal Warning", cell: "E10" },
    { text: "2nd Written Warning", cell: "H10" },
    { text: "3rd Final Written Warning", cell: "B11" },
    { text: "4th Termination", cell: "E11" },
  ];

  const currentLevel = parseInt(notificationLevel.split(" - ")[0]);

  levels.forEach((level, index) => {
    const cellValue =
      index === currentLevel ? `(X) ${level.text}` : `( ) ${level.text}`;
    sheet.cell(level.cell).value(cellValue);
  });

  function formatDescription(description) {
    if (description.length <= 90) {
      return description;
    } else {
      return `${description.slice(0, 90)}...`;
    }
  }

  // Handle the current corrective action
  const currentCA = correctiveActions[0];
  const r = currentCA.rule;

  if (r.code.includes("Appendix A")) {
    sheet
      .cell("B13")
      .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
    sheet.cell("B14").value("( ) Appendix B");
  } else if (r.code.includes("Appendix B")) {
    sheet.cell("B13").value("( ) Appendix A");
    sheet
      .cell("B14")
      .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
  } else {
    sheet.cell("B13").value(`Type: ${r.type}`);
    sheet.cell("B14").value(`Code: ${r.code}`);
  }

  const formattedDate = new Date(currentCA.date).toISOString().split("T")[0];
  const description = `${formattedDate} (${currentCA.description})`;

  const cell = sheet.cell("A17");
  cell.value(description);
  cell.style("wrapText", true);
  cell.style("verticalAlignment", "top");
  cell.style("horizontalAlignment", "left");

  // Handle previous corrective actions
  const caCells = [
    { date: "B28", type: "D28", reason: "G28" },
    { date: "B29", type: "D29", reason: "G29" },
    { date: "B30", type: "D30", reason: "G30" },
  ];

  correctiveActions.slice(1).forEach((ca, index) => {
    if (index < caCells.length) {
      const cells = caCells[index];
      sheet
        .cell(cells.date)
        .value(new Date(ca.date).toISOString().split("T")[0]);
      sheet.cell(cells.type).value(ca.rule.code);
      sheet.cell(cells.reason).value(formatDescription(ca.description));
    }
  });

  const excelBuffer = await workbook.outputAsync();

  await fs.unlink(templatePath);

  return excelBuffer;
}
