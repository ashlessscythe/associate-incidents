import { PDFDocument } from "pdf-lib";
// import { Occurrence, AssociateInfo } from "@/lib/api";

// interface OccurrencesPDFProps {
//   occurrences?: Occurrence[];
//   info: AssociateInfo;
// }

export async function loadAndInspectPdf() {
  const formUrl = "../assets/fields_attendance_form.pdf"; // local or remote
  const formBytes = await fetch(formUrl).then((res) => res.arrayBuffer());

  // Load the PDF with form fields
  const pdfDoc = await PDFDocument.load(formBytes);

  const form = pdfDoc.getForm();

  // Get all fields in the form
  const fields = form.getFields();

  // Log the names and types of all fields
  fields.forEach((field) => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${type}: ${name}`);
  });
}
