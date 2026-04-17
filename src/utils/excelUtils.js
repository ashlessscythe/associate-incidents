import XlsxPopulate from "xlsx-populate";
import path from "path";
import fs from "fs/promises";
import os from "os";
import axios from "axios";
import { prisma } from "../server.js";

// Helper function to get template mappings from database
async function getTemplateMappings(templateType) {
  try {
    const mappings = await prisma.templateMapping.findMany({
      where: { templateType },
    });
    
    // Convert to a map for easy lookup
    const mappingMap = {};
    mappings.forEach((mapping) => {
      try {
        mappingMap[mapping.dataPoint] = JSON.parse(mapping.cellValue);
      } catch (e) {
        // If parsing fails, use as string
        mappingMap[mapping.dataPoint] = mapping.cellValue;
      }
    });
    
    return mappingMap;
  } catch (error) {
    console.error(`Error fetching template mappings for ${templateType}:`, error);
    return {};
  }
}

// Helper function to get a cell value from mapping, with fallback
function getCellValue(mappings, dataPoint, fallback) {
  if (mappings[dataPoint] !== undefined) {
    return mappings[dataPoint];
  }
  return fallback;
}

export async function getTemplate(type) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "excel-templates-"));
  const filePath = path.join(tempDir, `${type}.xlsx`);

  try {
    // Find the most recent template for the specified type
    const template = await prisma.file.findFirst({
      where: { 
        fileType: "TEMPLATE",
        filename: {
          contains: type === "ca" ? "ca" : "occ",
          mode: "insensitive"
        }
      },
      orderBy: { createdAt: "desc" },
    });

    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    await fs.writeFile(filePath, template.content);
    return filePath;
  } catch (error) {
    console.error(`Error getting template for ${type}:`, error);
    throw error;
  }
}

function sumOccPoints(occurrences) {
  return (occurrences || []).reduce(
    (sum, occ) => sum + (occ.type?.points || 0),
    0
  );
}

function formatOccurrenceLine(occ) {
  const formattedDate = new Date(occ.date).toISOString().split("T")[0];
  return `${formattedDate} ${occ.type?.code || "Unknown"} - ${
    occ.type?.points || 0
  } pts`;
}

export async function generateExcelOccurrence(
  associateName,
  location,
  department,
  date,
  countedOccurrences,
  notificationLevel,
  notifications,
  designation,
  pointsAdjustment = 0,
  priorOccurrences = [],
  outsideOccurrences = []
) {
  if (!associateName || !location || !department || !date || !designation) {
    throw new Error("Missing required parameters");
  }

  const counted = countedOccurrences || [];
  const prior = priorOccurrences || [];
  const outside = outsideOccurrences || [];

  const templatePath = await getTemplate("occ");
  let workbook;

  try {
    workbook = await XlsxPopulate.fromFileAsync(templatePath);
  } catch (error) {
    console.error("Error loading Excel template:", error);
    throw new Error("Failed to load Excel template");
  }

  const sheet = workbook.sheet(0);

  // Get template mappings from database
  const mappings = await getTemplateMappings("OCC");

  // Fill in basic information using mappings
  const associateNameCell = getCellValue(mappings, "associateName", "A7");
  const locationCell = getCellValue(mappings, "location", "F7");
  const departmentCell = getCellValue(mappings, "department", "H7");
  const dateCell = getCellValue(mappings, "date", "J7");

  sheet.cell(associateNameCell).value(associateName);
  sheet.cell(locationCell).value(location);
  sheet.cell(departmentCell).value(department);
  sheet.cell(dateCell).value(date);

  // Fetch notification levels directly from the database
  const notificationLevels = await prisma.notificationLevel.findMany({
    where: { designation },
    orderBy: { level: "asc" },
  });

  // Map notification levels to Excel cells using mappings
  const levelCellsDefault = ["B9", "E9", "H9", "B10", "E10"];
  const levelCells = getCellValue(mappings, "notificationLevels", levelCellsDefault);
  const mappedLevels = notificationLevels.slice(0, levelCells.length).map((level, index) => ({
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

  const occurrenceSubtotal = sumOccPoints(counted);
  const totalPoints = occurrenceSubtotal + (pointsAdjustment || 0);

  const countedLines = counted.map(formatOccurrenceLine).join(", ");
  const priorLines = prior.length
    ? `\n\nPrior in rolling window (not counted toward current total): ${prior
        .map(formatOccurrenceLine)
        .join(", ")}`
    : "";

  const outsideLines = outside.length
    ? `\n\nOlder than rolling 12-month window (reference only, not in totals): ${outside
        .map(formatOccurrenceLine)
        .join(", ")}`
    : "";

  const fullMisconductText =
    `Associate ${associateName} — point summary (last 12 months, counted occurrences only): ` +
    `occurrence subtotal ${occurrenceSubtotal}; manual adjustment ${
      pointsAdjustment > 0 ? "+" : ""
    }${pointsAdjustment || 0}; total ${totalPoints}. ` +
    `Line items below are raw logged points.\n\n` +
    `Counted toward current total: ${countedLines || "(none)"}` +
    priorLines +
    outsideLines;
  
  const misconductCell = getCellValue(mappings, "misconductText", "A14");
  sheet.cell(misconductCell).value(fullMisconductText);

  // Fill notifications data using mappings
  const notificationCellsDefault = [
    { date: "B24", type: "D24", points: "G24" },
    { date: "B25", type: "D25", points: "G25" },
    { date: "B26", type: "D26", points: "G26" },
    { date: "B27", type: "D27", points: "G27" },
  ];
  const notificationCells = getCellValue(mappings, "notifications", notificationCellsDefault);

  (notifications || []).slice(0, notificationCells.length).forEach((notification, index) => {
    if (notification && notification.date && notificationCells[index]) {
      const cells = notificationCells[index];
      sheet
        .cell(cells.date)
        .value(new Date(notification.date).toISOString().split("T")[0]);
      sheet
        .cell(cells.type)
        .value(notification.level || "N/A");
      sheet
        .cell(cells.points)
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
  const templatePath = await getTemplate("ca");
  const workbook = await XlsxPopulate.fromFileAsync(templatePath);
  const sheet = workbook.sheet(0);

  // Get template mappings from database
  const mappings = await getTemplateMappings("CA");

  // Fill in basic information using mappings
  const associateNameCell = getCellValue(mappings, "associateName", "A7");
  const locationCell = getCellValue(mappings, "location", "F7");
  const departmentCell = getCellValue(mappings, "department", "H7");
  const dateCell = getCellValue(mappings, "date", "J7");

  sheet.cell(associateNameCell).value(associateName);
  sheet.cell(locationCell).value(location);
  sheet.cell(departmentCell).value(department);
  sheet.cell(dateCell).value(date);

  // Map notification levels using mappings
  const levelCellsDefault = ["B10", "E10", "H10", "B11", "E11"];
  const levelCells = getCellValue(mappings, "notificationLevels", levelCellsDefault);
  
  const levels = [
    { text: "Coaching Conversation", cell: levelCells[0] },
    { text: "1st Documented Verbal Warning", cell: levelCells[1] },
    { text: "2nd Written Warning", cell: levelCells[2] },
    { text: "3rd Final Written Warning", cell: levelCells[3] },
    { text: "4th Termination", cell: levelCells[4] },
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

  // Handle the current corrective action using mappings
  const currentCA = correctiveActions[0];
  const r = currentCA.rule;

  const currentCADefault = { appendixA: "B13", appendixB: "B14" };
  const currentCAMapping = getCellValue(mappings, "currentCA", currentCADefault);

  if (r.code.includes("Appendix A")) {
    sheet
      .cell(currentCAMapping.appendixA)
      .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
    sheet.cell(currentCAMapping.appendixB).value("( ) Appendix B");
  } else if (r.code.includes("Appendix B")) {
    sheet.cell(currentCAMapping.appendixA).value("( ) Appendix A");
    sheet
      .cell(currentCAMapping.appendixB)
      .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
  } else {
    sheet.cell(currentCAMapping.appendixA).value(`Type: ${r.type}`);
    sheet.cell(currentCAMapping.appendixB).value(`Code: ${r.code}`);
  }

  const formattedDate = new Date(currentCA.date).toISOString().split("T")[0];
  const description = `${formattedDate} - ${currentCA.description}`;

  const descriptionCell = getCellValue(mappings, "description", "A17");
  const cell = sheet.cell(descriptionCell);
  cell.value(description);
  cell.style("wrapText", true);
  cell.style("verticalAlignment", "top");
  cell.style("horizontalAlignment", "left");

  // Handle previous corrective actions using mappings
  const caCellsDefault = [
    { date: "B28", type: "D28", reason: "G28" },
    { date: "B29", type: "D29", reason: "G29" },
    { date: "B30", type: "D30", reason: "G30" },
  ];
  const caCells = getCellValue(mappings, "previousCAs", caCellsDefault);

  correctiveActions.slice(1).forEach((ca, index) => {
    if (index < caCells.length && caCells[index]) {
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
