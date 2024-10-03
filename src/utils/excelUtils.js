import XlsxPopulate from "xlsx-populate";
import path from "path";
import fs from "fs/promises";
import os from "os";
import axios from "axios";

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
  notificationLevel
) {
  const templatePath = await getTemplate(
    process.env.OCC_TEMPLATE_KEY,
    "occurrence"
  );
  const workbook = await XlsxPopulate.fromFileAsync(templatePath);
  const sheet = workbook.sheet(0);

  sheet.cell("A7").value(associateName);
  sheet.cell("F7").value(location);
  sheet.cell("H7").value(department);
  sheet.cell("J7").value(date);

  switch (notificationLevel) {
    case "Termination":
      sheet.cell("E10").value("10");
      break;
    case "Final Written Notice":
      sheet.cell("B10").value("7");
      break;
    case "2nd Written Notice":
      sheet.cell("H9").value("5");
      break;
    case "1st Written Notice":
      sheet.cell("E9").value("3");
      break;
    case "Verbal Notice":
      sheet.cell("B9").value("4");
      break;
  }

  const totalPoints = occurrences.reduce(
    (sum, occ) => sum + occ.type.points,
    0
  );

  const blurb = `Associate ${associateName} has below occurrences. Total points: ${totalPoints} \n\n`;

  const misconduct = occurrences
    .map((occ) => {
      const formattedDate = new Date(occ.date).toISOString().split("T")[0];
      return `${formattedDate} ${occ.type.code} - ${occ.type.points} pts`;
    })
    .join(", ");

  const fullMisconductText = blurb + misconduct;

  sheet.cell("A14").value(fullMisconductText);

  const excelBuffer = await workbook.outputAsync();

  await fs.unlink(templatePath);

  return excelBuffer;
}

export async function generateExcelCA(
  associateName,
  location,
  department,
  date,
  correctiveAction,
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

  const r = correctiveAction.rule;

  function formatDescription(description) {
    if (description.length <= 90) {
      return description;
    } else {
      return `${description.slice(0, 90)}...`;
    }
  }

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
    sheet.cell("B13").value("( ) Appendix A");
    sheet.cell("B14").value("( ) Appendix B");
  }

  const formattedDate = new Date(correctiveAction.date)
    .toISOString()
    .split("T")[0];
  const description = `${formattedDate} (${correctiveAction.description})`;

  const cell = sheet.cell("A17");
  cell.value(description);
  cell.style("wrapText", true);
  cell.style("verticalAlignment", "top");

  const excelBuffer = await workbook.outputAsync();

  await fs.unlink(templatePath);

  return excelBuffer;
}
