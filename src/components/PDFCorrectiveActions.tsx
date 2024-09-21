import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CorrectiveAction } from "@/lib/api";

// Define your styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
  },
});

interface CorrectiveActionsPDFProps {
  correctiveActions: CorrectiveAction[];
  associateName: string;
}

const CorrectiveActionsPDF: React.FC<CorrectiveActionsPDFProps> = ({
  correctiveActions,
  associateName,
}) => {
  // Group corrective actions by type
  const groupedCA = correctiveActions.reduce((acc, ca) => {
    if (!acc[ca.ruleId]) {
      acc[ca.ruleId] = [];
    }
    acc[ca.ruleId].push(ca);
    return acc;
  }, {} as Record<string, CorrectiveAction[]>);

  return (
    <Document>
      {Object.entries(groupedCA).map(([_, actions], index) => (
        <Page key={index} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.title}>
              Corrective Actions for {associateName}
            </Text>
            <Text style={styles.title}>Rule: {actions[0].description}</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Date</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Level</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Description</Text>
                </View>
              </View>
              {actions.map((action, actionIndex) => (
                <View style={styles.tableRow} key={actionIndex}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {new Date(action.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{action.level}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{action.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CorrectiveActionsPDF;
